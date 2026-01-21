// src/app/api/generate-answer/route.ts
import { NextResponse } from 'next/server';
import { createAIClient, type AIProvider } from '@/utils/ai-client';
type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

export async function POST(request: Request) {
  const {
    questionText,
    questionId,
    apiKey,
    provider,
    modelId,
    preferences: clientPreferences
  } = await request.json();

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

  try {
    const preferences = {
      depth: (clientPreferences?.preferred_answer_depth || 'standard') as AnswerDepth,
      include_code: clientPreferences?.include_code_snippets ?? true,
    };

    const client = createAIClient(provider as AIProvider, apiKey);

    // Pre-flight key validation
    try {
      if (provider === 'openai') {
        await client.models.list();
      } else if (provider === 'google') {
        // no lightweight validation endpoint
      }
    } catch (validationError: unknown) {
      const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown error';

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

      throw validationError;
    }

    const systemPromptContent = "You are a helpful AI assistant specialized in providing clear, accurate answers to technical interview questions. Always respond in well-formatted Markdown.";
    const userMessageSegments = [
      `Please answer the following interview question using Markdown format:`,
      `"${questionText}"`,
    ];

    if (preferences.include_code) {
      userMessageSegments.push(`Include relevant code snippets with proper markdown code blocks.`);
    } else {
      userMessageSegments.push(`Focus on theoretical explanations rather than code examples.`);
    }

    const depthInstructions: Record<AnswerDepth, string> = {
      brief: "Provide a concise, high-level summary. Focus on the core concept and answer. Keep it under 2 paragraphs.",
      standard: "Provide a balanced explanation. Cover the core concept, key details, and common use cases. Avoid excessive verbosity.",
      comprehensive: "Provide an in-depth, exhaustive explanation. Include theoretical background, detailed examples, edge cases, pros/cons, and best practices. Break down complex topics thoroughly."
    };

    const depthInstruction = depthInstructions[preferences.depth] || depthInstructions.standard;

    userMessageSegments.push(`\n**Instruction:** ${depthInstruction}`);

    const finalUserMessage = userMessageSegments.join('\\n');
    const maxTokens = 16384;
    const isOpenAIModel = provider === 'openai';

    const requestOptions: any = {
      messages: [
        { role: "system", content: systemPromptContent },
        { role: "user", content: finalUserMessage }
      ],
      model: modelId,
      stream: false,
    };

    if (isOpenAIModel) {
      requestOptions.max_completion_tokens = maxTokens;
    } else {
      requestOptions.max_tokens = maxTokens;
      requestOptions.temperature = 0.7;
    }

    requestOptions.stream = true;

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = await client.chat.completions.create(requestOptions) as unknown as AsyncIterable<any>;

          for await (const chunk of streamResponse) {
            const content = (chunk as any).choices?.[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error: unknown) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          let userFriendlyError = 'An error occurred while generating the answer.';
          let errorType = 'unknown_error';

          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('invalid_api_key')) {
            userFriendlyError = 'Invalid API key. Please check your API key in Account Settings.';
            errorType = 'auth_error';
          } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            userFriendlyError = 'Rate limit exceeded. Please wait a moment and try again.';
            errorType = 'rate_limit';
          } else if (errorMessage.includes('model') || errorMessage.includes('does not exist')) {
            userFriendlyError = 'Model not available. Please select a different model in Account Settings.';
            errorType = 'model_error';
          }

          const errorPayload = JSON.stringify({
            __stream_error__: true,
            error: userFriendlyError,
            type: errorType
          });
          controller.enqueue(encoder.encode(`\n\n__ERROR__${errorPayload}__ERROR__`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
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