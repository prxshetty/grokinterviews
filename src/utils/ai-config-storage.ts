// Client-side AI configuration storage using localStorage
// Stores provider, API key, and model selection locally

import type { AIProvider } from './ai-client';

export type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

const STORAGE_KEYS = {
    PROVIDER: 'ai_provider',
    API_KEY_PREFIX: 'ai_key_',
    MODEL_PREFIX: 'ai_model_',
    ANSWER_DEPTH: 'ai_answer_depth',
    INCLUDE_CODE: 'ai_include_code',
} as const;

// Simple obfuscation for API keys (not encryption, but prevents casual viewing)
// For production, consider using Web Crypto API or a more robust solution
function obfuscate(text: string): string {
    return btoa(text.split('').reverse().join(''));
}

function deobfuscate(text: string): string {
    try {
        return atob(text).split('').reverse().join('');
    } catch {
        return '';
    }
}

// Provider management
export function getSelectedProvider(): AIProvider | null {
    if (typeof window === 'undefined') return null;
    const provider = localStorage.getItem(STORAGE_KEYS.PROVIDER);
    if (provider === 'openai' || provider === 'google') {
        return provider;
    }
    return null;
}

export function setSelectedProvider(provider: AIProvider): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
}

// API Key management
export function getAPIKey(provider: AIProvider): string | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEYS.API_KEY_PREFIX + provider);
    if (!stored) return null;
    return deobfuscate(stored);
}

export function setAPIKey(provider: AIProvider, key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.API_KEY_PREFIX + provider, obfuscate(key));
}

export function clearAPIKey(provider: AIProvider): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.API_KEY_PREFIX + provider);
}

export function hasAPIKey(provider: AIProvider): boolean {
    return !!getAPIKey(provider);
}

// Model selection management
export function getSelectedModel(provider: AIProvider): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.MODEL_PREFIX + provider);
}

export function setSelectedModel(provider: AIProvider, modelId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MODEL_PREFIX + provider, modelId);
}

// Answer Depth management
export function getAnswerDepth(): AnswerDepth {
    if (typeof window === 'undefined') return 'standard';
    return (localStorage.getItem(STORAGE_KEYS.ANSWER_DEPTH) as AnswerDepth) || 'standard';
}

export function setAnswerDepth(depth: AnswerDepth): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ANSWER_DEPTH, depth);
}

// Include Code management
export function getIncludeCode(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEYS.INCLUDE_CODE);
    return stored === null ? true : stored === 'true';
}

export function setIncludeCode(include: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.INCLUDE_CODE, String(include));
}

// Get full AI config for API calls
export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
    modelId: string;
}

export function getAIConfig(): AIConfig | null {
    const provider = getSelectedProvider();
    if (!provider) return null;

    const apiKey = getAPIKey(provider);
    if (!apiKey) return null;

    const modelId = getSelectedModel(provider);
    if (!modelId) return null;

    return { provider, apiKey, modelId };
}

// Check if AI is fully configured
export function isAIConfigured(): boolean {
    return getAIConfig() !== null;
}

// Clear all AI config
export function clearAllAIConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PROVIDER);
    localStorage.removeItem(STORAGE_KEYS.API_KEY_PREFIX + 'openai');
    localStorage.removeItem(STORAGE_KEYS.API_KEY_PREFIX + 'google');
    localStorage.removeItem(STORAGE_KEYS.MODEL_PREFIX + 'openai');
    localStorage.removeItem(STORAGE_KEYS.MODEL_PREFIX + 'google');
}
