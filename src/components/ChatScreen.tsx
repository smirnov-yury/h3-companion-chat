import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Trash2, Mic, Square, Loader2 } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { useGlyphs } from "@/context/GlyphsContext";
import { renderGlyphs } from "@/utils/renderGlyphs";
import { useEntityLinkHandler } from "@/hooks/useEntityLinkHandler";
import { supabase } from "@/integrations/supabase/client";
import ChatSources from "@/components/ChatSources";
import { loadChat, saveChat, clearChat, hoursLeft } from "@/lib/chatPersistence";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TITLE = { RU: "ИИ Мастер", EN: "AI Master" };
const PLACEHOLDER = { RU: "Задайте вопрос по правилам...", EN: "Ask a question about the rules..." };
const OFFLINE_MSG = { RU: "Для этого модуля требуется подключение к интернету", EN: "This module requires an internet connection" };
const RATE_LIMIT_MSG = {
  RU: "Слишком много запросов. Попробуйте через час.",
  EN: "Too many requests. Try again in an hour.",
};
const GENERIC_ERROR = {
  RU: "Ошибка соединения. Попробуйте позже.",
  EN: "Connection error. Please try again.",
};
const SAVED_BANNER = {
  RU: (hours: number) => `Чат сохранён локально, очистится через ${hours} ч`,
  EN: (hours: number) => `Chat saved locally, expires in ${hours}h`,
};
const CLEAR_LABEL = { RU: "Очистить", EN: "Clear" };
const MIC_LABEL = { RU: "Записать голосом", EN: "Record voice" };
const STOP_LABEL = { RU: "Остановить", EN: "Stop" };
const VOICE_PERMISSION_ERROR = {
  RU: "Не удалось получить доступ к микрофону",
  EN: "Microphone access denied",
};
const VOICE_TRANSCRIBE_ERROR = {
  RU: "Не удалось распознать речь. Попробуйте ещё раз.",
  EN: "Failed to transcribe audio. Try again.",
};
const MAX_RECORD_SECONDS = 60;

export default function ChatScreen() {
  const { lang } = useLang();
  const { glyphs } = useGlyphs();
  const handleEntityClick = useEntityLinkHandler();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);

  useEffect(() => {
    const restored = loadChat();
    if (restored) {
      setMessages(restored.messages);
      setSavedAt(restored.savedAt);
    }
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (loading) return;
    if (messages.length === 0) {
      setSavedAt(null);
      return;
    }
    saveChat(messages, lang);
    setSavedAt(new Date());
  }, [messages, loading, lang]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    clearChat();
    setSavedAt(null);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const session = await supabase.auth.getSession();
      const anonKey = (supabase as unknown as { supabaseKey: string }).supabaseKey;
      const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
      const token = session.data.session?.access_token ?? anonKey;

      const url = `${supabaseUrl}/functions/v1/ai-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ messages: newMessages, lang }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as { error?: string }));
        const fallback = res.status === 429 ? RATE_LIMIT_MSG[lang] : GENERIC_ERROR[lang];
        const msg = errBody.error ? `${fallback} (${errBody.error})` : fallback;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: msg };
          return copy;
        });
        return;
      }

      if (!res.body) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: GENERIC_ERROR[lang] };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta: string | undefined = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: GENERIC_ERROR[lang] };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, lang]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">{TITLE[lang]}</h1>
      </header>

      {savedAt && messages.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/40 border-b border-border text-xs text-muted-foreground shrink-0">
          <span>{SAVED_BANNER[lang](hoursLeft(savedAt))}</span>
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {CLEAR_LABEL[lang]}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground rounded-bl-md"
              }`}
            >
              {m.role === "assistant" ? (
                <>
                  <div
                    className="prose prose-sm prose-invert max-w-none [&_p]:m-0"
                    onClick={handleEntityClick}
                    dangerouslySetInnerHTML={{ __html: renderGlyphs(m.content, glyphs) }}
                  />
                  <ChatSources content={m.content} lang={lang} />
                </>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <span className="text-lg font-bold tracking-widest">
                <span className="dot-1">.</span>
                <span className="dot-2">.</span>
                <span className="dot-3">.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!online ? (
        <div className="px-4 py-3 bg-destructive/20 text-center text-sm text-destructive shrink-0">
          {OFFLINE_MSG[lang]}
        </div>
      ) : (
        <div className="px-3 py-3 border-t border-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER[lang]}
              className="flex-1 rounded-xl bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
