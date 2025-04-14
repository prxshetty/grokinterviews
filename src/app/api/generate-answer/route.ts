import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Ensure this edge runtime is appropriate for your deployment environment
// If using Node.js features, remove this line.
// export const runtime = 'edge';

export async function POST(request: Request) {
  const { questionText } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (!questionText) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }

  try {
    // 1. Get the authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session Error:', sessionError.message);
      return NextResponse.json({ error: 'Failed to get user session' }, { status: 500 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Fetch the user's profile to get the API key, preferred model, and specific model ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferred_model, custom_api_key, specific_model_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile Fetch Error:', profileError.message);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!profile) {
       return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 3. Check if Groq is preferred and a key exists
    const { preferred_model, custom_api_key, specific_model_id } = profile;

    if (preferred_model !== 'groq' || !custom_api_key) {
      // If Groq isn't selected or no key is provided, return a message indicating that.
      // The frontend can decide how to handle this (e.g., prompt user to set key).
      return NextResponse.json({ 
        message: 'Generation requires selecting Groq as the preferred model and providing a custom API key in account settings.', 
        answer: null // Explicitly return null for the answer
      }, { status: 200 }); // Status 200 because it's not an error, just a condition not met
    }

    // --- SECURITY WARNING --- 
    // Ensure custom_api_key is stored securely (e.g., encrypted) in your database.
    // Fetching and using it directly here assumes secure storage.
    // ------------------------

    // 4. Initialize Groq SDK and generate answer
    const groq = new Groq({
      apiKey: custom_api_key,
      // Consider adding configuration like maxRetries, timeout if needed
    });

    // Simple prompt - customize as needed
    const prompt = `Provide a concise and helpful answer to the following interview question:

Question: ${questionText}

Answer:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to answer interview questions clearly and concisely.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // Use the specific model ID saved by the user, with a fallback
      model: specific_model_id || 'llama-3.1-8b-instant', 
      // Optional parameters: temperature, max_tokens, top_p, stream
       temperature: 0.7,
       max_tokens: 1024,
       top_p: 1,
       stream: false, // Set to true if you want to stream the response
    });

    const answer = chatCompletion.choices[0]?.message?.content || 'No answer generated.';

    // 5. Return the generated answer
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
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 