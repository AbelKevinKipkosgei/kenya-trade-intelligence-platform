import type { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { runTradeAnalystTurn } from "@/lib/ai/trade-analyst";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Uses the `pg` driver (TCP), not fetch-only — needs the Node runtime, not Edge.
export const runtime = "nodejs";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeMessages(body: unknown): ChatMessage[] {
  const raw = Array.isArray((body as { messages?: unknown })?.messages)
    ? (body as { messages: unknown[] }).messages
    : [];

  const cleaned = raw
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        (m as { role?: unknown }).role !== undefined &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  return cleaned.slice(-MAX_MESSAGES);
}

export async function POST(req: NextRequest) {
  // Every call here is a real, metered LLM request — require sign-in so
  // usage is tied to an account, not just an IP (which the rate limiter
  // below already covers, but doesn't stop anonymous abuse from rotating).
  const { userId } = await auth();
  if (!userId) {
    return new Response("Sign in to use the AI Trade Analyst.", { status: 401 });
  }

  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(rateLimit.reason, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const messages = sanitizeMessages(body);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Expected a non-empty message list ending in a user message.", {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runTradeAnalystTurn(messages as Anthropic.Beta.BetaMessageParam[])) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n_Something went wrong: ${message}_`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
