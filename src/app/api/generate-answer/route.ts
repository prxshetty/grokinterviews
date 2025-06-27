// src/app/api/generate-answer/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';

// Try to import KV, but handle gracefully if not available
let kv: any = null;
let kvInitialized = false;

async function initializeKV() {
  if (kvInitialized) return;
  
  const hasKVEnvVars = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  
  if (hasKVEnvVars) {
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
      console.log('KV available - using KV-based API key rotation');
    } catch {
      console.log('KV module not available - using local fallback for API key rotation');
    }
  } else {
    console.log('KV environment variables not set - using local fallback for API key rotation');
  }
  
  kvInitialized = true;
}

interface Resource {
  id: number;
  question_id: number;
  type: 'youtube' | 'paper' | 'note' | 'code_snippet' | string;
  title: string | null;
  url: string | null;
  created_at: string;
  relevance_score?: number | null;
}

type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown';
type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

const apiKeys: string[] = [];
const numApiKeysEnv = process.env.NUM_GROQ_API_KEYS;
const numApiKeys = numApiKeysEnv ? parseInt(numApiKeysEnv, 10) : 0;

if (numApiKeys > 0) {
  for (let i = 0; i < numApiKeys; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) apiKeys.push(key);
    else console.warn(`generate-answer: GROQ_API_KEY_${i} not set.`);
  }
}
if (apiKeys.length === 0) console.error('CRITICAL: No Groq API keys configured. Set GROQ_API_KEY_0... and NUM_GROQ_API_KEYS.');

const KV_KEY_GROQ_API_INDEX = 'groq_api_key_index_v1';

// Local fallback for development when KV is not available
let localApiKeyIndex = 0;

async function getNextGroqApiKey(): Promise<string | null> {
  if (apiKeys.length === 0) {
    console.error("No API keys available.");
    return null;
  }

  // If only one API key, return it directly
  if (apiKeys.length === 1) {
    return apiKeys[0] || null;
  }

  // Initialize KV if not already done
  await initializeKV();

  try {
    let currentIndex: number;
    
    if (kv) {
      // Production: Use Vercel KV for persistence across requests
      currentIndex = await kv.get(KV_KEY_GROQ_API_INDEX);
      if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= apiKeys.length) {
        currentIndex = 0;
      }
      
      const apiKeyToUse = apiKeys[currentIndex];
      if (!apiKeyToUse) {
        console.error(`API key at index ${currentIndex} is undefined`);
        const fallbackKey = apiKeys.find(key => key);
        return fallbackKey ? fallbackKey : null;
      }
      
      // Update index for next request
      await kv.set(KV_KEY_GROQ_API_INDEX, (currentIndex + 1) % apiKeys.length);
      console.log(`Using Groq API key ${currentIndex} (KV-based rotation)`);
      return apiKeyToUse;
    } else {
      // Local development: Use in-memory rotation
      currentIndex = localApiKeyIndex;
      const apiKeyToUse = apiKeys[currentIndex];
      
      if (!apiKeyToUse) {
        console.error(`API key at index ${currentIndex} is undefined`);
        const fallbackKey = apiKeys.find(key => key);
        return fallbackKey || null;
      }
      
      // Update index for next request (in-memory)
      localApiKeyIndex = (localApiKeyIndex + 1) % apiKeys.length;
      console.log(`Using Groq API key ${currentIndex} (local rotation)`);
      return apiKeyToUse;
    }
  } catch (error) {
    console.error('Error rotating API key:', error);
    // Fallback: return first available key
    const fallbackKey = apiKeys.find(key => key);
    console.log('Using fallback API key due to rotation error');
    return fallbackKey || null;
  }
}

export async function POST(request: Request) {
  const { questionText, questionId } = await request.json();
  const supabase = await createClient();

  if (!questionText || !questionId) return NextResponse.json({ error: 'Question text and ID required' }, { status: 400 });

  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
    // else console.log('No authenticated user. Some features like user-specific preferences might use defaults. Activity logging skipped.');
  } catch (e: any) { console.error('Auth error:', e.message); }

  const internalApiKey = await getNextGroqApiKey();
  if (!internalApiKey) return NextResponse.json({ error: 'Service unavailable: API configuration issue.' }, { status: 503 });

  try {
    const { data: preferencesData, error: preferencesFetchError } = await supabase
      .from('user_preferences')
      .select('specific_model_id, use_youtube_sources, use_pdf_sources, use_paper_sources, use_website_sources, use_book_sources, use_image_sources, preferred_answer_format, preferred_answer_depth, include_code_snippets, include_latex_formulas, custom_formatting_instructions')
      .eq('user_id', userId) // userId can be undefined here, Supabase client handles it
      .maybeSingle();

    if (preferencesFetchError) console.error('Preferences Fetch Error:', preferencesFetchError.message);

    const current_specific_model_id = preferencesData?.specific_model_id ?? null;
    const preferences = {
      use_youtube: preferencesData?.use_youtube_sources ?? true,
      use_pdf: preferencesData?.use_pdf_sources ?? true,
      use_paper: preferencesData?.use_paper_sources ?? true,
      use_website: preferencesData?.use_website_sources ?? true,
      use_book: preferencesData?.use_book_sources ?? false,
      use_image: preferencesData?.use_image_sources ?? false,
      format: (preferencesData?.preferred_answer_format || 'markdown') as AnswerFormat,
      depth: (preferencesData?.preferred_answer_depth || 'standard') as AnswerDepth,
      include_code: preferencesData?.include_code_snippets ?? true,
      include_latex: preferencesData?.include_latex_formulas ?? false,
      custom_instructions: preferencesData?.custom_formatting_instructions || null,
    };

    if (!current_specific_model_id) {
      return NextResponse.json({ message: 'Groq model selection required in Account Preferences.', answer: null, requires_model_selection: true }, { status: 200 });
    }

    const groq = new Groq({ apiKey: internalApiKey });
    
    let resources: Resource[] = [];
    try {
        const { data: resourceData, error: resourceError } = await supabase.from('resources').select('*').eq('question_id', questionId);
        if (resourceError) console.error('Resource Fetch Error:', resourceError.message);
        else resources = resourceData || [];
    } catch (err) { console.error('Err fetching resources:', err); }
    
    const sourceMap: { [key: string]: boolean } = { youtube: preferences.use_youtube, pdf: preferences.use_pdf, paper: preferences.use_paper, website: preferences.use_website, book: preferences.use_book, image: preferences.use_image, note: true };
    const filteredResources = resources.filter(r => sourceMap[r.type] === true);
    const formatResources = (type: string): string => filteredResources.filter(r => r.type === type).map(r => {
      if (['youtube', 'paper', 'website', 'pdf', 'book', 'image'].includes(type)) return `- [${r.title || (r.url ? new URL(r.url).hostname : 'Link')}](${r.url || ''})`;
      if (type === 'note') return `- ${r.title || r.url || 'Note'}`;
      return '';
    }).join('\\n');
    const formattedData = { youtube_links: formatResources('youtube'), papers: formatResources('paper'), pdfs: formatResources('pdf'), websites: formatResources('website'), books: formatResources('book'), images: formatResources('image'), notes: formatResources('note') };

    const systemPromptContent = "You are a helpful AI assistant specialized in providing clear, accurate answers to technical interview questions.";
    const userMessageSegments = [
      `Please answer the following interview question strictly using the specified Markdown format (Headers: #, ##, ###; Emphasis: **bold**):`,
      `"${questionText}"`,
      `\\nAdhere to the following preferences:`,
      `- Answer Format: ${preferences.format}`,
      `- Answer Depth: ${preferences.depth}`,
    ];
    if (preferences.custom_instructions) userMessageSegments.push(`- Additional Instructions: ${preferences.custom_instructions}`);
    if (preferences.include_code) userMessageSegments.push(`- Include relevant code snippets. Format them using proper markdown code blocks with triple backticks and language specification. Example:\\n  \\\`\\\`\\\`javascript\\n  // Your JavaScript code here\\n  \\\`\\\`\\\``);
    else userMessageSegments.push(`- Focus on theoretical explanations rather than code examples. Explain programming concepts in plain language without including code snippets.`);
    if (preferences.include_latex) userMessageSegments.push(`- For mathematical formulas and equations, use LaTeX notation. Use single dollar signs for inline formulas ($...$) and double dollar signs for block formulas ($$...$$). Example: $x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$`);

    const resourceInfoSegments: string[] = [];
    if (formattedData.youtube_links) resourceInfoSegments.push(`**Relevant YouTube Videos:**\\n${formattedData.youtube_links}`);
    if (formattedData.papers) resourceInfoSegments.push(`**Relevant Research Papers:**\\n${formattedData.papers}`);
    if (formattedData.pdfs) resourceInfoSegments.push(`**Relevant PDFs:**\\n${formattedData.pdfs}`);
    if (formattedData.websites) resourceInfoSegments.push(`**Relevant Websites:**\\n${formattedData.websites}`);
    if (formattedData.books) resourceInfoSegments.push(`**Relevant Books:**\\n${formattedData.books}`);
    if (formattedData.images) resourceInfoSegments.push(`**Relevant Images:**\\n${formattedData.images}`);
    if (formattedData.notes) resourceInfoSegments.push(`**Relevant Notes:**\\n${formattedData.notes}`);
    
    if (resourceInfoSegments.length > 0) {
      userMessageSegments.push("\\n**Supplementary Resources (for context, do not explicitly cite unless part of the answer flow):**");
      userMessageSegments.push(...resourceInfoSegments);
    }
    
    const finalUserMessage = userMessageSegments.join('\\n');
    const max_tokens = preferences.depth === 'brief' ? 768 : preferences.depth === 'comprehensive' ? 4096 : 1024;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPromptContent }, { role: "user", content: finalUserMessage }],
      model: current_specific_model_id,
      temperature: 0.7, max_tokens, top_p: 1, stream: false,
    });
    const generatedAnswer = chatCompletion.choices[0]?.message?.content || 'No answer generated.';

    await supabase.from('questions').update({ answer_text: generatedAnswer, last_generated_at: new Date().toISOString() }).eq('id', questionId);

    if (userId) {
      try {
        const { data: qData, error: qFetchError } = await supabase
          .from('questions')
          .select('category_id, categories!inner(topic_id, topics!inner(id, domain))')
          .eq('id', questionId)
          .single();

        if (qFetchError) {
          console.error('Activity Log QData Fetch Error:', qFetchError.message);
        } else if (qData) {
          // Cast to unknown first, then to our expected type to handle Supabase type limitations
          const typedQData = qData as unknown as {
            category_id: number;
            categories: {
              topic_id: number;
              topics: {
                id: number;
                domain: string;
              };
            };
          };
          
          if (typedQData.categories && typedQData.categories.topics) {
            await supabase.from('user_activity').insert({
              user_id: userId,
              activity_type: 'answer_generated',
              question_id: questionId,
              category_id: typedQData.category_id,
              topic_id: typedQData.categories.topic_id,
              domain: typedQData.categories.topics.domain,
              metadata: { model: current_specific_model_id, timestamp: new Date().toISOString() },
              created_at: new Date().toISOString(),
            });
          } else {
            console.warn('Activity log: Missing nested category/topic details in query result.');
          }
        } else { 
          console.warn('Activity log: No data returned from question query.'); 
        }
      } catch (activityError: any) { 
        console.error('Activity log error:', activityError.message); 
      }
    }

    return NextResponse.json({
      id: questionId,
      question_text: questionText, 
      answer_text: generatedAnswer,
      needs_generation: false, 
    });
    
  } catch (error: any) {
    console.error('Error in generate-answer POST handler:', error);
    if (error instanceof Groq.APIError) {
      return NextResponse.json(
        { error: 'Failed to generate answer due to an AI provider issue.', details: error.message, type: 'groq_api_error' },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error during answer generation.', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}