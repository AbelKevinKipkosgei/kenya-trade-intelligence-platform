"use client";

import { useRef, useState } from "react";
import { MarkdownMessage } from "@/components/markdown-message";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What are Kenya's top export destinations by value?",
  "Which products have active trade barriers right now?",
  "Compare the MFN and EAC preferential tariff rates for a coffee product.",
];

export default function AnalystPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(question: string) {
    const text = question.trim();
    if (!text || isStreaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

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
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: `${last.content}\n\n_${message}_` };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Trade Analyst
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ask about Kenyan exports, imports, tariffs, or trade barriers. Answers are grounded in
          the KTIP database and cite their source.
        </p>
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
                <span className="text-sm">…</span>
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
