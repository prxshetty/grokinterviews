'use client';

export type AnswerFormat = 'bullet_points' | 'numbered_lists' | 'table' | 'paragraph' | 'markdown';
export type AnswerDepth = 'brief' | 'standard' | 'comprehensive';

export interface AnswerPreferences {
    use_youtube_sources: boolean;
    use_pdf_sources: boolean;
    use_paper_sources: boolean;
    use_website_sources: boolean;
    use_book_sources: boolean;
    use_image_sources: boolean;
    preferred_answer_format: AnswerFormat;
    preferred_answer_depth: AnswerDepth;
    include_code_snippets: boolean;
    include_latex_formulas: boolean;
    custom_formatting_instructions: string;
}

const STORAGE_KEY = 'answer_preferences';

const DEFAULT_PREFERENCES: AnswerPreferences = {
    use_youtube_sources: true,
    use_pdf_sources: true,
    use_paper_sources: true,
    use_website_sources: true,
    use_book_sources: false,
    use_image_sources: false,
    preferred_answer_format: 'markdown',
    preferred_answer_depth: 'standard',
    include_code_snippets: true,
    include_latex_formulas: false,
    custom_formatting_instructions: '',
};

export function getAnswerPreferences(): AnswerPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_PREFERENCES;

        const parsed = JSON.parse(stored) as Partial<AnswerPreferences>;
        return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export function saveAnswerPreferences(preferences: Partial<AnswerPreferences>): void {
    if (typeof window === 'undefined') return;

    const current = getAnswerPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getPreference<K extends keyof AnswerPreferences>(key: K): AnswerPreferences[K] {
    return getAnswerPreferences()[key];
}

export function setPreference<K extends keyof AnswerPreferences>(key: K, value: AnswerPreferences[K]): void {
    const current = getAnswerPreferences();
    current[key] = value;
    saveAnswerPreferences(current);
}

export function resetAnswerPreferences(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
}

export function clearAnswerPreferences(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

export function hasCustomPreferences(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
}
