import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ApiKeyModal from "./ApiKeyModal";
import { useRules, Rule } from "@/context/RulesContext";

type Lang = "RU" | "EN";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPTS: Record<Lang, string> = {
  RU: "Ты ассистент по настольной игре Heroes 3 Board Game. Отвечай строго на основе предоставленного текста правил. Не выдумывай правила. Отвечай на русском языке. Максимум 3 предложения. Если информация отсутствует в тексте - скажи 'Я не знаю'.",
  EN: "You are an assistant for the Heroes 3 Board Game. Answer strictly based on the provided rules text. Do not make up rules. Answer in English. Maximum 3 sentences. If the information is not in the text, say 'I don't know'.",
};

const TITLE: Record<Lang, string> = { RU: "ИИ Мастер", EN: "AI Master" };
const PLACEHOLDER: Record<Lang, string> = {
  RU: "Задайте вопрос по правилам...",
  EN: "Ask a question about the rules...",
};
const OFFLINE_MSG: Record<Lang, string> = {
  RU: "Для этого модуля требуется подключение к интернету",
  EN: "This module requires an internet connection",
};

function getApiKey() {
  return localStorage.getItem("groq_api_key") || import.meta.env.VITE_GROQ_API_KEY || "";
}

export default function ChatScreen() {
  const [lang, setLang] = useState<Lang>("RU");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [apiKey, setApiKey] = useState(getApiKey);
  const [showKeyModal, setShowKeyModal] = useState(!getApiKey());
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[lang] },
            ...newMessages,
          ],
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? "Error";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: lang === "RU" ? "Ошибка соединения." : "Connection error." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, lang, apiKey]);

  return (
    <div className="flex flex-col h-full">
      <ApiKeyModal
        open={showKeyModal}
        onSave={(key) => {
          localStorage.setItem("groq_api_key", key);
          setApiKey(key);
          setShowKeyModal(false);
        }}
      />
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">{TITLE[lang]}</h1>
        <button
          onClick={() => setLang((l) => (l === "RU" ? "EN" : "RU"))}
          className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {lang}
        </button>
      </header>

      {/* Messages */}
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
                <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && (
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

      {/* Input or offline banner */}
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
