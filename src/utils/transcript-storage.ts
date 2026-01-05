'use client';

const STORAGE_KEY = 'voice_transcripts';
const MAX_SESSIONS = 5;

export interface TranscriptMessage {
    type: 'user' | 'ai';
    text: string;
    timestamp: number;
}

export interface VoiceSession {
    id: string;
    sessionType: 'behavioral' | 'technical' | 'custom' | 'sd';
    startedAt: string;
    endedAt?: string | undefined;
    isCompleted: boolean;
    messages: TranscriptMessage[];
    score?: {
        overall_score: number;
        strengths: string[];
        weaknesses: string[];
        improvements: string[];
        detailed_feedback?: string | undefined;
    } | undefined;
    voiceName?: string | undefined;
}

function getStoredSessions(): VoiceSession[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as VoiceSession[];
    } catch {
        return [];
    }
}

function saveSessions(sessions: VoiceSession[]): void {
    if (typeof window === 'undefined') return;
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Generate a unique session ID
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create a new session
export function createSession(sessionType: VoiceSession['sessionType'], voiceName?: string): VoiceSession {
    const session: VoiceSession = {
        id: generateSessionId(),
        sessionType,
        startedAt: new Date().toISOString(),
        isCompleted: false,
        messages: [],
        voiceName
    };

    const sessions = getStoredSessions();
    sessions.unshift(session);
    saveSessions(sessions);

    return session;
}

// Add a message to a session
export function addMessage(sessionId: string, message: TranscriptMessage): void {
    const sessions = getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = sessions[sessionIndex];
    if (!session) return;

    session.messages.push(message);
    saveSessions(sessions);
}

// Add a conversation pair (user + AI response)
export function addConversationPair(
    sessionId: string,
    userText: string,
    aiText: string
): void {
    const timestamp = Date.now();
    addMessage(sessionId, { type: 'user', text: userText, timestamp });
    addMessage(sessionId, { type: 'ai', text: aiText, timestamp: timestamp + 1 });
}

// Complete a session with optional score
export function completeSession(
    sessionId: string,
    score?: VoiceSession['score']
): void {
    const sessions = getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const session = sessions[sessionIndex];
    if (!session) return;

    session.isCompleted = true;
    session.endedAt = new Date().toISOString();
    if (score) {
        session.score = score;
    }

    saveSessions(sessions);
}

// Get a specific session
export function getSession(sessionId: string): VoiceSession | null {
    const sessions = getStoredSessions();
    return sessions.find(s => s.id === sessionId) || null;
}

// Get all sessions
export function getAllSessions(): VoiceSession[] {
    return getStoredSessions();
}

// Get recent sessions (completed only)
export function getRecentSessions(limit: number = 10): VoiceSession[] {
    return getStoredSessions()
        .filter(s => s.isCompleted)
        .slice(0, limit);
}

// Delete a session
export function deleteSession(sessionId: string): void {
    const sessions = getStoredSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    saveSessions(filtered);
}

// Clear all sessions
export function clearAllSessions(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// Get session count
export function getSessionCount(): number {
    return getStoredSessions().length;
}

// Update session (general purpose)
export function updateSession(sessionId: string, updates: Partial<VoiceSession>): void {
    const sessions = getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return;

    const existingSession = sessions[sessionIndex];
    if (!existingSession) return;

    sessions[sessionIndex] = { ...existingSession, ...updates } as VoiceSession;
    saveSessions(sessions);
}
