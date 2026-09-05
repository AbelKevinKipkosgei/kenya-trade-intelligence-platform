"use client";

import { useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "@/components/markdown-message";
import { parseStatusStream } from "@/lib/status-protocol";

type ChatMessage = { role: "user" | "assistant"; content: string; status?: string };

const SUGGESTIONS = [
  "What are Kenya's top export destinations by value?",
  "Which products have active trade barriers right now?",
  "Compare the MFN and EAC preferential tariff rates for a coffee product.",
];

const STORAGE_KEY = "ktip-analyst-chat";

export default function AnalystPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Per-browser conversation persistence — survives a refresh/tab close.
  // No account system exists yet, so this can't sync across devices.
  // Deliberate one-time exception to react-hooks/set-state-in-effect: a
  // lazy useState initializer would read real localStorage during the
  // client's hydration render while SSR always sees none, which is a
  // *worse* trade (a hydration mismatch) than the lint rule's concern
  // (cascading renders) — there's no cascade here, just a single
  // mount-time sync, and there's no "change" event to subscribe to for
  // same-tab writes, so useSyncExternalStore doesn't fit either.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // Corrupt or inaccessible storage — start with an empty conversation.
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full or unavailable (private browsing, etc.) — not fatal.
    }
  }, [messages, hydrated]);

  async function send(question: string) {
    const text = question.trim();
    if (!text || isStreaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let raw = "";

    try {
      const res = await fetch("/api/trade-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const { content, status } = parseStatusStream(raw);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content, status };
          return updated;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: `${last.content}\n\n_${message}_`, status: undefined };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Not fatal — the in-memory state is already cleared.
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            AI Trade Analyst
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Ask about Kenyan exports, imports, tariffs, or trade barriers. Answers are grounded in
            the KTIP database and cite their source.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            className="shrink-0 rounded-full border border-stone-400 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear
          </button>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-xl border border-stone-300 bg-white/60 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-kenya-green hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl bg-kenya-green px-4 py-3 text-sm leading-relaxed text-white"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="w-full max-w-full self-start rounded-2xl border border-stone-300 bg-white/70 px-4 py-3 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200"
            >
              {m.content ? (
                <MarkdownMessage content={m.content} />
              ) : isStreaming && i === messages.length - 1 ? (
                <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kenya-green" />
                  {m.status ?? "Thinking…"}
                </span>
              ) : null}
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Kenyan trade data…"
          className="flex-1 rounded-full border border-stone-400 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-full bg-kenya-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kenya-green/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
