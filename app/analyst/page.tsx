"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MarkdownMessage } from "@/components/markdown-message";
import { parseStatusStream } from "@/lib/status-protocol";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  status?: string;
};

const SUGGESTIONS = [
  "What are Kenya's top export destinations by value?",
  "Which products have active trade barriers right now?",
  "Compare the MFN and EAC preferential tariff rates for a coffee product.",
];

const STORAGE_KEY = "ktip-analyst-chat";

export default function AnalystPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          content: `${last.content}\n\n_${message}_`,
          status: undefined,
        };
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

  const signInPrompt = (
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M8 9h.01M12 9h.01M16 9h.01M7 19l-3 2 .8-3.2A7.5 7.5 0 0 1 4 14.5C4 10.4 7.6 7 12 7s8 3.4 8 7.5-3.6 7.5-8 7.5a9 9 0 0 1-5-.0Z" />
            <path d="M8 4.5C9.2 3.5 10.5 3 12 3c2.8 0 5 1.6 5 3.5" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ktp-navy dark:text-zinc-50">
          AI Trade Analyst
        </h1>
        <p className="text-sm leading-5 text-slate-500 dark:text-zinc-400">
          Sign in to ask questions about Kenyan exports, imports, tariffs, or
          trade barriers — answers are grounded in the KTIP database and cite
          their source.
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth/signin?callbackUrl=/analyst")}
          className="mt-2 flex h-12 items-center justify-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red"
        >
          Sign in to continue
        </button>
      </div>
    </main>
  );

  if (status === "loading") return null;

  return session ? (
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M8 9h.01M12 9h.01M16 9h.01M7 19l-3 2 .8-3.2A7.5 7.5 0 0 1 4 14.5C4 10.4 7.6 7 12 7s8 3.4 8 7.5-3.6 7.5-8 7.5a9 9 0 0 1-5-.0Z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-ktp-navy dark:text-zinc-50 sm:text-4xl">
                AI Trade Analyst
              </h1>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
                Ask about Kenyan exports, imports, tariffs, or trade barriers.
                Answers are grounded in the KTIP database and cite their source.
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="shrink-0 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-kenya-green hover:text-kenya-green dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Clear
            </button>
          )}
        </div>

        {messages.length === 0 && (
          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-xs leading-4 text-slate-600 transition-colors hover:border-kenya-green hover:text-ktp-navy dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
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
                className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-kenya-green px-4 py-3 text-sm leading-relaxed text-white shadow-[0_2px_6px_rgba(0,102,0,0.16)]"
              >
                {m.content}
              </div>
            ) : (
              <div
                key={i}
                className="w-full max-w-full self-start rounded-lg border border-slate-200 bg-white px-5 py-4 text-zinc-800 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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
          className="mt-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Kenyan trade data…"
            className="h-10 flex-1 border border-slate-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="h-10 bg-kenya-green px-5 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  ) : (
    signInPrompt
  );
}
