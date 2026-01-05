'use client';

// Storage format: Set of "topicId:categoryId:questionId" strings
const STORAGE_KEY = 'user_bookmarks';

export interface Bookmark {
    topicId: number;
    categoryId: number;
    questionId: number;
}

export const getBookmarks = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return new Set();

        return new Set(JSON.parse(stored));
    } catch (error) {
        console.error('Failed to parse bookmarks from local storage:', error);
        return new Set();
    }
};

export const addBookmark = (topicId: number, categoryId: number, questionId: number): void => {
    if (typeof window === 'undefined') return;

    const bookmarks = getBookmarks();
    const key = `${topicId}:${categoryId}:${questionId}`;

    if (!bookmarks.has(key)) {
        bookmarks.add(key);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    }
};

export const removeBookmark = (questionId: number): void => {
    if (typeof window === 'undefined') return;

    const bookmarks = getBookmarks();
    let foundKey: string | null = null;

    // Find key that ends with the questionId
    for (const key of bookmarks) {
        const parts = key.split(':');
        const qId = parts[2];
        if (qId && parseInt(qId, 10) === questionId) {
            foundKey = key;
            break;
        }
    }

    if (foundKey) {
        bookmarks.delete(foundKey);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    }
};

export const isBookmarked = (questionId: number): boolean => {
    if (typeof window === 'undefined') return false;

    const bookmarks = getBookmarks();
    for (const key of bookmarks) {
        const parts = key.split(':');
        const qId = parts[2];
        if (qId && parseInt(qId, 10) === questionId) {
            return true;
        }
    }
    return false;
};

export const getBookmarkDetails = (): Bookmark[] => {
    if (typeof window === 'undefined') return [];

    const bookmarks = getBookmarks();
    const details: Bookmark[] = [];

    bookmarks.forEach(key => {
        const parts = key.split(':');
        if (parts.length >= 3) {
            const topicId = Number(parts[0]);
            const categoryId = Number(parts[1]);
            const questionId = Number(parts[2]);

            if (!isNaN(topicId) && !isNaN(categoryId) && !isNaN(questionId)) {
                details.push({ topicId, categoryId, questionId });
            }
        }
    });

    return details;
};
