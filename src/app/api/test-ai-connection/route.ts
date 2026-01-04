// API endpoint to test AI connection with user's API key
import { NextResponse } from 'next/server';
import { createAIClient, type AIProvider } from '@/utils/ai-client';

export async function POST(request: Request) {
    try {
        const { provider, apiKey } = await request.json();

        if (!provider || !apiKey) {
            return NextResponse.json({ error: 'Provider and API key required' }, { status: 400 });
        }

        if (provider !== 'openai' && provider !== 'google') {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const client = createAIClient(provider as AIProvider, apiKey);

        // Make a minimal API call to test the connection
        const response = await client.chat.completions.create({
            model: provider === 'openai' ? 'gpt-5-nano-2025-08-07' : 'gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: 'Say "OK"' }],
            max_tokens: 5,
        });

        if (response.choices && response.choices.length > 0) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
    } catch (error: unknown) {
        console.error('Connection test error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('invalid')) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
    }
}
