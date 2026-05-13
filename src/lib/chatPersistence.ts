// Persists AI chat messages in localStorage with a 24h TTL.
// Pattern mirrors h3_recent_sessions used in Game Setup (Step4Review.tsx).

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface StoredChat {
  messages: ChatMessage[];
  savedAt: string; // ISO timestamp
  lang: "RU" | "EN";
}

const KEY = "h3_ai_chat_session";
const TTL_MS = 24 * 60 * 60 * 1000;

export function loadChat(): { messages: ChatMessage[]; savedAt: Date } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChat;
    if (!parsed?.messages || !Array.isArray(parsed.messages) || !parsed.savedAt) {
      return null;
    }
    const savedAt = new Date(parsed.savedAt);
    if (Number.isNaN(savedAt.getTime())) return null;
    if (Date.now() - savedAt.getTime() > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { messages: parsed.messages, savedAt };
  } catch {
    return null;
  }
}

export function saveChat(messages: ChatMessage[], lang: "RU" | "EN"): void {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }
    const payload: StoredChat = {
      messages,
      savedAt: new Date().toISOString(),
      lang,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function clearChat(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function hoursLeft(savedAt: Date): number {
  const elapsedMs = Date.now() - savedAt.getTime();
  const remainingMs = Math.max(0, TTL_MS - elapsedMs);
  return Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
}
