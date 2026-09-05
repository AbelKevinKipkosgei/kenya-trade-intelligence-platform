import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SCHEMA_CONTEXT } from "./schema-context";
import { runReadOnlyQuery, UnsafeQueryError } from "./sql-tool";
import { statusChunk } from "../status-protocol";

const client = new Anthropic();

const MODEL = "claude-opus-5";
// A chat answer doesn't need the 64K streaming default this skill
// recommends for long-form generation — 8192 is a deliberate cost cap,
// generous enough that a grounded, cited answer won't get truncated.
const MAX_TOKENS = 8192;
const MAX_TOOL_ITERATIONS = 8;

const queryTool: Anthropic.Beta.BetaTool = {
  name: "query_trade_database",
  description:
    "Run a single read-only SQL query (SELECT, or WITH ... SELECT) against the KTIP Postgres database and get back up to 200 rows as JSON. Writes and DDL are rejected server-side.",
  input_schema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "A single read-only SELECT statement. No semicolons, no writes/DDL.",
      },
    },
    required: ["sql"],
    additionalProperties: false,
  },
};

const toolInputSchema = z.object({ sql: z.string() });

async function executeQueryTool(rawInput: unknown): Promise<{ content: string; isError: boolean }> {
  const parsed = toolInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { content: `Invalid tool input: ${parsed.error.message}`, isError: true };
  }
  try {
    const { rows, rowCount, truncated } = await runReadOnlyQuery(parsed.data.sql);
    const body = JSON.stringify({ rowCount, truncated, rows });
    return { content: body, isError: false };
  } catch (err) {
    if (err instanceof UnsafeQueryError) {
      return { content: `Query rejected: ${err.message}`, isError: true };
    }
    const message = err instanceof Error ? err.message : "Unknown database error";
    return { content: `Query failed: ${message}`, isError: true };
  }
}

/**
 * Runs one AI Trade Analyst turn against the given conversation history
 * (the caller's new user message must already be the last entry) and
 * yields response text as it streams. Internally drives the full
 * tool-use loop — the caller only sees the final assistant text.
 */
export async function* runTradeAnalystTurn(
  history: Anthropic.Beta.BetaMessageParam[],
): AsyncGenerator<string> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [...history];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    yield statusChunk(iteration === 0 ? "Thinking…" : "Reviewing the results…");

    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      // Opus 5's safety classifiers can decline with stop_reason: "refusal"
      // (a normal 200, not an error). "default" re-runs a declined request
      // on Anthropic's recommended substitute model server-side, routed by
      // refusal category, instead of just dead-ending the conversation.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Explicit breakpoint: the frozen schema prompt, reused across every
      // user's requests (1h TTL — gaps between chat turns are often well
      // past 5 minutes but rarely past an hour).
      system: [
        {
          type: "text",
          text: SCHEMA_CONTEXT,
          cache_control: { type: "ephemeral", ttl: "1h" },
        },
      ],
      // Automatic breakpoint: walks forward onto the growing messages array
      // on its own as this loop appends tool_use/tool_result turns, so each
      // iteration only pays for what it just added instead of replaying the
      // whole tool-call history at full price. Default 5m TTL is correct
      // here — iterations are seconds apart, well under that window.
      cache_control: { type: "ephemeral" },
      tools: [queryTool],
      messages,
    });

    // Buffered, not yielded live: a message that ends in tool_use often
    // carries "I'll check the database..."-style narration before the
    // tool_use block, and once bytes reach the client over HTTP they can't
    // be un-sent. So every iteration's text is held until stop_reason is
    // known — only a genuine final answer (not tool_use, not pause_turn)
    // gets forwarded. This trades live token-by-token streaming for a
    // guarantee that narration never reaches the chat.
    let iterationText = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        iterationText += event.delta.text;
      }
    }

    const message = await stream.finalMessage();
    messages.push({ role: "assistant", content: message.content });

    // Cache verification per the skill's own guidance: this is the only
    // ground truth that caching is actually working, and regressions here
    // are silent (requests keep succeeding, the bill just goes up).
    const { input_tokens, cache_read_input_tokens, cache_creation_input_tokens } = message.usage;
    console.log(
      `[trade-analyst] iteration ${iteration}: input=${input_tokens} cache_read=${cache_read_input_tokens ?? 0} cache_write=${cache_creation_input_tokens ?? 0}`,
    );

    if (message.stop_reason === "pause_turn") {
      continue;
    }

    if (message.stop_reason !== "tool_use") {
      if (iterationText) yield iterationText;
      if (message.stop_reason === "refusal") {
        yield "\n\n_I can't answer that._";
      }
      return;
    }

    const toolUseBlocks = message.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );

    yield statusChunk("Querying the trade database…");

    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const { content, isError } = await executeQueryTool(block.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content,
        is_error: isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  yield "\n\n_Reached the tool-call limit for this turn — try narrowing the question._";
}
