import OpenAI from 'openai';
export type AIProvider = 'openai' | 'google';

// Base URLs for OpenAI SDK compatibility
const PROVIDER_BASE_URLS: Record<AIProvider, string | undefined> = {
    openai: undefined,
    google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
};

// Model configurations per provider
export interface AIModelConfig {
    id: string;
    name: string;
    tier: 'cheap' | 'balanced' | 'premium';
    speed: number;
    quality: number;
    inputPrice: number;
    outputPrice: number;
    description: string;
}

export const PROVIDER_MODELS: Record<AIProvider, AIModelConfig[]> = {
    openai: [
        {
            id: 'gpt-4.1-nano',
            name: 'GPT-4.1 Nano',
            tier: 'cheap',
            speed: 5,
            quality: 3,
            inputPrice: 0.10,
            outputPrice: 0.40,
            description: 'Fastest, most cost-efficient non-thinking variant',
        },
        {
            id: 'gpt-5-mini-2025-08-07',
            name: 'GPT-5 Mini',
            tier: 'balanced',
            speed: 4,
            quality: 4,
            inputPrice: 0.25,
            outputPrice: 2.00,
            description: 'Great balance of speed and reasoning',
        },
        {
            id: 'gpt-5.2-2025-12-11',
            name: 'GPT-5.2',
            tier: 'premium',
            speed: 3,
            quality: 5,
            inputPrice: 1.75,
            outputPrice: 14.00,
            description: 'Highest reasoning capability',
        },
    ],
    google: [
        {
            id: 'gemini-2.5-flash-lite',
            name: 'Gemini 2.5 Flash Lite',
            tier: 'cheap',
            speed: 5,
            quality: 3,
            inputPrice: 0.10,
            outputPrice: 0.40,
            description: 'Fastest, optimized for cost-efficiency',
        },
        {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash',
            tier: 'balanced',
            speed: 4,
            quality: 4,
            inputPrice: 0.50,
            outputPrice: 3.00,
            description: 'Balanced speed and intelligence',
        },
        {
            id: 'gemini-3-pro-preview',
            name: 'Gemini 3 Pro',
            tier: 'premium',
            speed: 3,
            quality: 5,
            inputPrice: 2.00,
            outputPrice: 12.00,
            description: 'Most capable Gemini model',
        },
    ],
};

// Get all models for a provider
export function getModelsForProvider(provider: AIProvider): AIModelConfig[] {
    return PROVIDER_MODELS[provider] || [];
}

// Get a specific model config
export function getModelConfig(provider: AIProvider, modelId: string): AIModelConfig | undefined {
    return PROVIDER_MODELS[provider]?.find(m => m.id === modelId);
}

// Get default model for a provider (balanced tier)
export function getDefaultModel(provider: AIProvider): AIModelConfig {
    const models = PROVIDER_MODELS[provider];
    const balanced = models.find(m => m.tier === 'cheap');
    return balanced ?? models[0]!;
}

// Create an OpenAI-compatible client for the specified provider
export function createAIClient(provider: AIProvider, apiKey: string): OpenAI {
    const baseURL = PROVIDER_BASE_URLS[provider];

    return new OpenAI({
        apiKey,
        baseURL,
        defaultHeaders: provider === 'google' ? {
            'x-goog-api-key': apiKey,
        } : undefined,
    });
}

// Provider display info
export const PROVIDER_INFO: Record<AIProvider, { name: string; description: string }> = {
    openai: {
        name: 'OpenAI',
        description: 'GPT series models',
    },
    google: {
        name: 'Google',
        description: 'Gemini series models',
    },
};
