import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SCHEMA_CONTEXT } from "./schema-context";
import { runReadOnlyQuery, UnsafeQueryError } from "./sql-tool";

const client = new Anthropic();

const MODEL = "claude-opus-5";
// A chat answer doesn't need the 64K streaming default this skill
// recommends for long-form generation — 8192 is a deliberate cost cap,
// generous enough that a grounded, cited answer won't get truncated.
const MAX_TOKENS = 8192;
const MAX_TOOL_ITERATIONS = 8;

const queryTool: Anthropic.Tool = {
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
  history: Anthropic.MessageParam[],
): AsyncGenerator<string> {
  const messages: Anthropic.MessageParam[] = [...history];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [
        {
          type: "text",
          text: SCHEMA_CONTEXT,
          cache_control: { type: "ephemeral", ttl: "1h" },
        },
      ],
      tools: [queryTool],
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }

    const message = await stream.finalMessage();
    messages.push({ role: "assistant", content: message.content });

    if (message.stop_reason === "pause_turn") {
      continue;
    }

    if (message.stop_reason !== "tool_use") {
      if (message.stop_reason === "refusal") {
        yield "\n\n_I can't answer that._";
      }
      return;
    }

    const toolUseBlocks = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
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
