import { createRouteHandlerClient, type SupabaseClient as AuthHelperSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Define the structure of a resource item from the database
interface Resource {
  id: string;
  question_id: string;
  resource_type: 'youtube' | 'paper' | 'note' | 'code_snippet' | string; // Allow other types
  title: string | null;
  url: string | null;
  content: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Define types for preferences (mirroring frontend)
type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown';
type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

// NEW HELPER FUNCTION
async function fetchUserSetup(
  supabase: AuthHelperSupabaseClient<any>, // Use the specific client type from auth-helpers
  userId: string
) {
  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('custom_api_key')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile Fetch Error:', profileError.message);
    return { 
      custom_api_key: null, 
      specific_model_id: null, 
      preferences: null,
      errorResponse: NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 }) 
    };
  }
  if (!profileData) {
    return { 
      custom_api_key: null, 
      specific_model_id: null, 
      preferences: null,
      errorResponse: NextResponse.json({ error: 'User profile not found' }, { status: 404 }) 
    };
  }
  const { custom_api_key } = profileData;

  // Fetch user preferences
  const { data: preferencesData, error: preferencesError } = await supabase
    .from('user_preferences')
    .select('specific_model_id, use_youtube_sources, use_pdf_sources, use_paper_sources, use_website_sources, use_book_sources, use_image_sources, preferred_answer_format, preferred_answer_depth, include_code_snippets, include_latex_formulas, custom_formatting_instructions')
    .eq('user_id', userId)
    .maybeSingle();

  if (preferencesError) {
    console.error('Preferences Fetch Error:', preferencesError.message);
    // Logged, but we proceed with defaults, so no errorResponse here.
  }

  const specific_model_id_fetched = preferencesData?.specific_model_id || null;
  
  const userPreferences = {
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

  return { 
    custom_api_key, 
    specific_model_id: specific_model_id_fetched, 
    preferences: userPreferences, 
    errorResponse: null 
  };
}

// Ensure this edge runtime is appropriate for your deployment environment
// If using Node.js features, remove this line.
// export const runtime = 'edge';

export async function POST(request: Request) {
  // 1. Read request body
  const { questionText, questionId } = await request.json();

  // Create Supabase client with cookies
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Validate input
  if (!questionText || !questionId) {
    return NextResponse.json({ error: 'Question text and Question ID are required' }, { status: 400 });
  }

  try {
    // 2. Get the authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
      return NextResponse.json({ error: 'Failed to get user session' }, { status: 500 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user setup (profile and preferences) using the helper
    const userSetup = await fetchUserSetup(supabase, userId);

    if (userSetup.errorResponse) {
      return userSetup.errorResponse;
    }
    
    if (!userSetup.preferences) {
        // This case should ideally not be hit if errorResponse is null and helper logic is correct
        console.error('User preferences unexpectedly null after fetchUserSetup');
        return NextResponse.json({ error: 'Internal server error processing user preferences' }, { status: 500 });
    }

    const { custom_api_key, specific_model_id, preferences } = userSetup;
    
    // Check for API Key and selected model ID
    if (!custom_api_key || !specific_model_id) {
      const missingItems = [];
      if (!custom_api_key) missingItems.push("Groq API key");
      if (!specific_model_id) missingItems.push("Groq model selection");
      const message = `Generation requires a ${missingItems.join(' and ')} to be configured in Account Preferences.`;
      // Log activity for missing config before returning
      try {
        // Assuming questionId from request.json() is of a type compatible with the database.
        // If questionId can be number or string, ensure DB schema for user_activity.question_id matches or cast appropriately.
        const qId = typeof questionId === 'string' ? parseInt(questionId, 10) : questionId
        if (Number.isNaN(qId) && questionId !== null) { // check if questionId was a non-numeric string
             console.warn(`Invalid questionId format: ${questionId}, logging as null`)
        }

        await supabase.from('user_activity').insert({
          user_id: userId,
          activity_type: 'answer_generation_failed_config',
          question_id: (Number.isNaN(qId) || questionId === null) ? null : qId, // Ensure it's number or null
          metadata: { 
            reason: 'missing_api_key_or_model', 
            message,
            question_text: questionText
          },
        });
      } catch (logError: any) {
        console.error('Error logging failed config activity:', logError.message);
      }
      return NextResponse.json({ message: message, answer: null, errorType: 'CONFIGURATION_ERROR' }, { status: 200 });
    }

    // 5. Fetch supplementary resources for the question
    let resources: Resource[] = [];
    try {
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('question_id', questionId); // Use questionId from request

      if (resourceError) {
        console.error('Resource Fetch Error:', resourceError.message);
        // Don't fail the request, just proceed without resources
      } else {
        resources = resourceData || [];
      }
    } catch (err) {
      console.error('Unexpected error fetching resources:', err);
      // Proceed without resources
    }

    // 6. Filter resources based on user preferences
    const sourceMap: { [key: string]: boolean } = {
        youtube: preferences.use_youtube,
        pdf: preferences.use_pdf,
        paper: preferences.use_paper,
        website: preferences.use_website,
        book: preferences.use_book,
        image: preferences.use_image,
        note: true, // Always include notes if they exist?
        // code_snippet: true // [REMOVED] - Code snippets are generated, not fetched
        // Add mappings for other resource_types if needed
    };
    const filteredResources = resources.filter(r => sourceMap[r.resource_type] === true);

    // 7. Format *filtered* resources for the prompt
    const formatResources = (type: string): string => {
      return filteredResources
        .filter(r => r.resource_type === type)
        .map(r => {
          if (['youtube', 'paper', 'website', 'pdf', 'book', 'image'].includes(type)) {
            const title = r.title || (r.url ? new URL(r.url).hostname : 'Link');
            const link = r.url ? `(${r.url})` : '';
            let text = `- [${title}]${link}`;
            if (r.description) text += ` - ${r.description}`;
            return text;
          } else if (type === 'note') {
            return `- ${r.content || ''}`;
          }
          // [REMOVED] else if (type === 'code_snippet') { ... }
          return ''; // Fallback for unknown types
        })
        .join('\n');
    };

    const formattedData = {
      youtube_links: formatResources('youtube'),
      papers: formatResources('paper'),
      pdfs: formatResources('pdf'),
      websites: formatResources('website'),
      books: formatResources('book'),
      images: formatResources('image'),
      notes: formatResources('note'),
      // code_snippets: formatResources('code_snippet'), // [REMOVED]
      // Add other types as needed
    };

    // 8. Construct the final prompt based on preferences
    let promptSegments = [
        `Please answer the following interview question strictly using the specified Markdown format (Headers: #, ##, ###; Emphasis: **bold**):`,
        `"${questionText}"`,
        `\nAdhere to the following preferences:`,
        `- Answer Format: ${preferences.format}`,
        `- Answer Depth: ${preferences.depth}`,
    ];

    if (preferences.custom_instructions) {
        promptSegments.push(`- Additional Instructions: ${preferences.custom_instructions}`);
    }

    // Add detailed instructions about generating code snippets if applicable and enabled
    if (preferences.include_code) {
      promptSegments.push(`- Include relevant code snippets in the answer if the question involves coding or algorithms. Format them using proper markdown code blocks with triple backticks and language specification. For example:
  \`\`\`javascript
  // Your JavaScript code here
  \`\`\`
  or
  \`\`\`python
  # Your Python code here
  \`\`\`
- Ensure all code is properly indented and formatted within these code blocks.
- Always specify the programming language after the opening triple backticks.
- Do not use single backticks for multi-line code blocks.`);
    } else {
      promptSegments.push(`- Focus on theoretical explanations rather than code examples. If the question is about programming or algorithms, explain the concepts, patterns, and approaches in plain language without including code snippets.`);
    }

    // Add instructions for LaTeX formulas if enabled
    if (preferences.include_latex) {
      promptSegments.push(`- For mathematical formulas and equations, use LaTeX notation. Use single dollar signs for inline formulas ($...$) and double dollar signs for block formulas ($$...$$). For example:
  The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ for the equation $ax^2 + bx + c = 0$.

  For more complex equations, use block format:
  $$\int_{a}^{b} f(x) dx = F(b) - F(a)$$
- Ensure all mathematical symbols, variables, and expressions are properly formatted using LaTeX notation.`);
    }

    const resourceSegments: string[] = [];
    if (formattedData.youtube_links) resourceSegments.push(`**Relevant YouTube Videos:**\n${formattedData.youtube_links}`);
    if (formattedData.papers) resourceSegments.push(`**Relevant Research Papers:**\n${formattedData.papers}`);
    if (formattedData.pdfs) resourceSegments.push(`**Relevant PDFs:**\n${formattedData.pdfs}`);
    if (formattedData.websites) resourceSegments.push(`**Relevant Websites:**\n${formattedData.websites}`);
    if (formattedData.books) resourceSegments.push(`**Relevant Books:**\n${formattedData.books}`);
    if (formattedData.images) resourceSegments.push(`**Relevant Images:**\n${formattedData.images}`);
    if (formattedData.notes) resourceSegments.push(`**Additional Notes:**\n${formattedData.notes}`);

    if (resourceSegments.length > 0) {
        promptSegments.push(`\nConsider the following supplementary resources based on your enabled sources:`);
        promptSegments.push(...resourceSegments);
    }

    promptSegments.push(`\nAnswer:`);

    const finalPrompt = promptSegments.join('\n');

    // --- SECURITY WARNING ---
    // Using user API key requires secure storage and handling.
    // Templating user prompts + DB content needs care against injection if resource content isn't trusted.
    // ------------------------

    // 9. Initialize Groq SDK and generate answer
    const groq = new Groq({
      apiKey: custom_api_key,
    });

    // Determine max_tokens based on answer depth
    let max_tokens = 1024; // Default for 'standard' depth
    if (preferences.depth === 'brief') {
      max_tokens = 768; // Shorter for brief answers
    } else if (preferences.depth === 'comprehensive') {
      max_tokens = 4096; // Much larger for comprehensive answers
    }

    console.log(`Using max_tokens=${max_tokens} for answer depth: ${preferences.depth}, include_code: ${preferences.include_code}, include_latex: ${preferences.include_latex}`);

    // Prepare system prompt based on user preferences
    let systemPrompt = "You are a helpful AI assistant specialized in providing clear, accurate answers to technical interview questions.";

    // Add code snippet instructions if enabled
    if (preferences.include_code) {
      systemPrompt += " When including code examples, always format them properly using markdown code blocks with triple backticks and language specification. Ensure code is well-indented, properly commented, and follows best practices for the language being used.";
    } else {
      systemPrompt += " Focus on theoretical explanations and concepts rather than code examples. Explain programming concepts in plain language without code snippets.";
    }

    // Add LaTeX formula instructions if enabled
    if (preferences.include_latex) {
      systemPrompt += " For mathematical formulas and equations, use LaTeX notation enclosed in dollar signs for inline formulas ($...$) and double dollar signs for block formulas ($$...$$). Ensure all mathematical symbols, variables, and expressions are properly formatted using LaTeX.";
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: 'user',
          content: finalPrompt, // Use the fully constructed prompt
        },
      ],
      model: specific_model_id, // Use the specific model ID from preferences
      temperature: 0.7,
      max_tokens: max_tokens,
      top_p: 1,
      stream: false,
    });

    let answer = chatCompletion.choices[0]?.message?.content || 'No answer generated.';

    // Process the answer to handle Llama 4 <think> tags
    // Remove <think> tags and their content as they can make code almost invisible
    answer = answer.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Log activity for answer generation
    try {
      // First, get the question to find its category_id
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('category_id')
        .eq('id', questionId)
        .single();

      if (questionError) {
        console.error('Error fetching question data:', questionError);
        // Continue with partial data
      } else {
        // Get the topic_id from the category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('topic_id')
          .eq('id', questionData.category_id)
          .single();

        if (categoryError) {
          console.error('Error fetching category data:', categoryError);
          // Continue with partial data
        } else {
          // Get the domain from the topic
          const { data: topicData, error: topicError } = await supabase
            .from('topics')
            .select('domain')
            .eq('id', categoryData.topic_id)
            .single();

          if (topicError) {
            console.error('Error fetching topic data:', topicError);
            // Continue with partial data
          }

          // Insert activity with all the data
          await supabase
            .from('user_activity')
            .insert({
              user_id: userId,
              activity_type: 'answer_generated',
              question_id: questionId,
              category_id: questionData.category_id,
              topic_id: categoryData.topic_id,
              domain: topicData?.domain || null,
              metadata: {
                model: specific_model_id,
                timestamp: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            });

          console.log('Successfully logged answer generation activity with topic, category, and domain');
        }
      }
    } catch (activityError) {
      console.error('Error logging answer generation activity:', activityError);
      // Continue anyway, this is not critical
    }

    // 10. Return the processed answer
    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error('Answer Generation Error:', error);

    // Check for specific Groq API errors if needed
    let errorMessage = 'Failed to generate answer.';
    let statusCode = 500;

    if (error instanceof Groq.APIError) {
      errorMessage = `Groq API Error: ${error.message}`;
      statusCode = error.status || 500;
       // Handle specific status codes like 401 (Unauthorized - likely bad API key)
      if(error.status === 401) {
         errorMessage = "Invalid Groq API Key provided in account settings.";
         statusCode = 400; // Return as a client error
      }
    } else if (error.name === 'TypeError' && error.message.includes('cookies')) {
      // Handle cookie-related errors
      errorMessage = "Authentication error. Please try signing in again.";
      statusCode = 401;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}