// src/app/api/generate-answer/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getNextGroqApiKey as getRotatingGroqApiKey } from '@/utils/groqApi';
import { createClient } from '@/utils/supabase/server';


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

  const internalApiKey = await getRotatingGroqApiKey();
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

    // Note: We intentionally don't store answers in the database to save storage costs
    // Answers are only kept in frontend state during the session

    if (userId) {
      try {
        const { data: qData, error: qFetchError } = await supabase
          .from('questions')
          .select('category_id')
          .eq('id', questionId)
          .single();

        if (qFetchError) {
          console.error('Activity Log QData Fetch Error:', qFetchError.message);
        } else if (qData) {
          // Get topic_id from category
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('topic_id')
            .eq('id', qData.category_id)
            .single();
          
          if (categoryError) {
            console.error('Activity Log Category Fetch Error:', categoryError.message);
          } else if (categoryData) {
            // Get domain_id from topic
            const { data: topicData, error: topicError } = await supabase
              .from('topics')
              .select('domain_id')
              .eq('id', categoryData.topic_id)
              .single();
            
            if (topicError) {
              console.error('Activity Log Topic Fetch Error:', topicError.message);
            } else if (topicData) {
              // Log the API call with comprehensive usage tracking
              const apiCallMetadata = {
                // API Request Info
                model: current_specific_model_id,
                temperature: 0.7,
                max_tokens: max_tokens,
                top_p: 1,
                
                // Response Metadata
                response_id: chatCompletion.id,
                response_model: chatCompletion.model,
                response_object: chatCompletion.object,
                created_timestamp: chatCompletion.created,
                
                // Usage Statistics (if available)
                usage_prompt_tokens: chatCompletion.usage?.prompt_tokens,
                usage_completion_tokens: chatCompletion.usage?.completion_tokens,
                usage_total_tokens: chatCompletion.usage?.total_tokens,
                
                // Performance Metrics (if available)
                usage_prompt_time: chatCompletion.usage?.prompt_time,
                usage_completion_time: chatCompletion.usage?.completion_time,
                usage_total_time: chatCompletion.usage?.total_time,
                usage_queue_time: chatCompletion.usage?.queue_time,
                
                // Response Quality
                finish_reason: chatCompletion.choices[0]?.finish_reason,
                system_fingerprint: chatCompletion.system_fingerprint,
                
                // User Preferences Context
                answer_format: preferences.format,
                answer_depth: preferences.depth,
                include_code: preferences.include_code,
                include_latex: preferences.include_latex,
                
                // Resource Context
                resources_count: filteredResources.length,
                resource_types: [...new Set(filteredResources.map(r => r.type))],
                
                // Timestamp
                logged_at: new Date().toISOString()
              };

              // Insert activity log with retry logic for database concurrency issues
              const insertActivityLog = async (retryCount = 0) => {
                try {
                  const { error: activityInsertError } = await supabase.from('user_activity').insert({
                    user_id: userId,
                    activity_type: 'answer_generated',
                    question_id: questionId,
                    category_id: qData.category_id,
                    topic_id: categoryData.topic_id,
                    domain_id: topicData.domain_id,
                    metadata: apiCallMetadata
                  });
                  
                  if (activityInsertError) {
                    // Check if it's a materialized view concurrency issue
                    if (activityInsertError.message.includes('materialized view') && retryCount < 2) {
                      console.warn(`Materialized view concurrency issue, retrying... (attempt ${retryCount + 1})`);
                      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1))); // Wait 100ms, 200ms
                      return insertActivityLog(retryCount + 1);
                    }
                    
                    console.error('Failed to log API call activity:', activityInsertError.message);
                    return false;
                  } else {
                    console.log(`Successfully logged API call for question ${questionId}:`, {
                      model: current_specific_model_id,
                      tokens: `${apiCallMetadata.usage_prompt_tokens}→${apiCallMetadata.usage_completion_tokens} (${apiCallMetadata.usage_total_tokens} total)`,
                      time: `${apiCallMetadata.usage_total_time}s`,
                      finish_reason: apiCallMetadata.finish_reason
                    });
                    return true;
                  }
                } catch (insertError: any) {
                  console.error('Exception during activity logging:', insertError.message);
                  return false;
                }
              };
              
              // Execute the logging with retry logic (non-blocking)
              insertActivityLog();
            }
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