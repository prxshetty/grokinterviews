// src/app/api/generate-answer/route.ts
import { NextResponse } from 'next/server';
import { createAIClient, type AIProvider } from '@/utils/ai-client';
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
  const { questionText, questionId, apiKey, provider, modelId } = await request.json();
  const supabase = await createClient();

  if (!questionText || !questionId) {
    return NextResponse.json({ error: 'Question text and ID required' }, { status: 400 });
  }

  if (!apiKey || !provider || !modelId) {
    return NextResponse.json({
      error: 'AI configuration required. Please configure your API key in Account Settings.',
      requires_ai_config: true
    }, { status: 400 });
  }

  if (provider !== 'openai' && provider !== 'google') {
    return NextResponse.json({ error: 'Invalid AI provider' }, { status: 400 });
  }

  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch (e: unknown) {
    console.error('Auth error:', e instanceof Error ? e.message : 'Unknown error');
  }

  try {
    const { data: preferencesData, error: preferencesFetchError } = await supabase
      .from('user_preferences')
      .select('use_youtube_sources, use_pdf_sources, use_paper_sources, use_website_sources, use_book_sources, use_image_sources, preferred_answer_format, preferred_answer_depth, include_code_snippets, include_latex_formulas, custom_formatting_instructions')
      .eq('user_id', userId)
      .maybeSingle();

    if (preferencesFetchError) console.error('Preferences Fetch Error:', preferencesFetchError.message);

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

    const client = createAIClient(provider as AIProvider, apiKey);

    let resources: Resource[] = [];
    try {
      const { data: resourceData, error: resourceError } = await supabase.from('resources').select('*').eq('question_id', questionId);
      if (resourceError) console.error('Resource Fetch Error:', resourceError.message);
      else resources = resourceData || [];
    } catch (err) { console.error('Err fetching resources:', err); }

    const sourceMap: { [key: string]: boolean } = {
      youtube: preferences.use_youtube,
      pdf: preferences.use_pdf,
      paper: preferences.use_paper,
      website: preferences.use_website,
      book: preferences.use_book,
      image: preferences.use_image,
      note: true
    };
    const filteredResources = resources.filter(r => sourceMap[r.type] === true);

    const formatResources = (type: string): string => filteredResources.filter(r => r.type === type).map(r => {
      if (['youtube', 'paper', 'website', 'pdf', 'book', 'image'].includes(type)) {
        return `- [${r.title || (r.url ? new URL(r.url).hostname : 'Link')}](${r.url || ''})`;
      }
      if (type === 'note') return `- ${r.title || r.url || 'Note'}`;
      return '';
    }).join('\\n');

    const formattedData = {
      youtube_links: formatResources('youtube'),
      papers: formatResources('paper'),
      pdfs: formatResources('pdf'),
      websites: formatResources('website'),
      books: formatResources('book'),
      images: formatResources('image'),
      notes: formatResources('note')
    };

    const systemPromptContent = "You are a helpful AI assistant specialized in providing clear, accurate answers to technical interview questions.";
    const userMessageSegments = [
      `Please answer the following interview question strictly using the specified Markdown format (Headers: #, ##, ###; Emphasis: **bold**):`,
      `"${questionText}"`,
      `\\nAdhere to the following preferences:`,
      `- Answer Format: ${preferences.format}`,
      `- Answer Depth: ${preferences.depth}`,
    ];

    if (preferences.custom_instructions) {
      userMessageSegments.push(`- Additional Instructions: ${preferences.custom_instructions}`);
    }
    if (preferences.include_code) {
      userMessageSegments.push(`- Include relevant code snippets. Format them using proper markdown code blocks with triple backticks and language specification.`);
    } else {
      userMessageSegments.push(`- Focus on theoretical explanations rather than code examples.`);
    }
    if (preferences.include_latex) {
      userMessageSegments.push(`- For mathematical formulas and equations, use LaTeX notation with dollar signs.`);
    }

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

    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPromptContent },
        { role: "user", content: finalUserMessage }
      ],
      model: modelId,
      temperature: 0.7,
      max_tokens,
      top_p: 1,
      stream: false,
    });

    const generatedAnswer = chatCompletion.choices[0]?.message?.content || 'No answer generated.';

    return NextResponse.json({
      id: questionId,
      question_text: questionText,
      answer_text: generatedAnswer,
      needs_generation: false,
    });

  } catch (error: unknown) {
    console.error('Error in generate-answer POST handler:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('invalid_api_key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your API key in Account Settings.', type: 'auth_error' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.', type: 'rate_limit' },
        { status: 429 }
      );
    }

    if (errorMessage.includes('model') || errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Model not available. Please select a different model in Account Settings.', type: 'model_error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate answer.', details: errorMessage },
      { status: 500 }
    );
  }
}