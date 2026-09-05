import "../db/seed/load-env";
import type Anthropic from "@anthropic-ai/sdk";
import { runTradeAnalystTurn } from "../lib/ai/trade-analyst";
import { parseStatusStream } from "../lib/status-protocol";
import { pool } from "../db/client";

/**
 * Lightweight regression smoke test for the AI Trade Analyst — not a
 * rigorous graded eval (see the claude-api skill's `build-eval` for
 * that), just a fast, real-API check that core behaviors haven't
 * silently broken: grounded answers, procedural lookups, honest "no
 * data" reporting, and no leaked tool/narration internals.
 *
 * The exact-number assertions are tied to the current seed data — if
 * you reseed with a different SEED_SCALE or add/remove rows, update
 * the expected values here to match.
 *
 * Run with: npx tsx evals/trade-analyst.eval.ts
 * Costs a handful of real Opus 5 calls (a few cents total).
 */

type Case = {
  name: string;
  question: string;
  expectContains?: string[];
  expectNotMatch?: RegExp[];
};

const CASES: Case[] = [
  {
    name: "aggregate count — countries",
    question: "How many countries are in the database? Just the number.",
    expectContains: ["250"],
  },
  {
    name: "aggregate count — active trade barriers",
    question: "How many active trade barriers are there? Just the number.",
    expectContains: ["2,023"],
  },
  {
    name: "procedures — coffee import walkthrough",
    question: "How do I get started importing coffee into Kenya?",
    expectContains: ["KEPHIS"],
  },
  {
    name: "honest empty result — no users registered",
    question: "How many registered platform users are there?",
    expectContains: ["0"],
  },
  {
    name: "no narration leakage before the answer",
    question: "What is Kenya's top export destination by value?",
    expectNotMatch: [/^I'll (query|check|look)/i, /^Let me/i],
  },
  {
    name: "does not expose raw tool/SQL internals",
    question: "What is Kenya's top export destination by value?",
    expectNotMatch: [/query_trade_database/i, /\bSELECT\b.*\bFROM\b/],
  },
];

async function runCase(c: Case): Promise<{ name: string; pass: boolean; failures: string[]; answer: string }> {
  const history: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: c.question }];
  let raw = "";
  for await (const chunk of runTradeAnalystTurn(history)) {
    raw += chunk;
  }
  const { content } = parseStatusStream(raw);

  const failures: string[] = [];
  for (const needle of c.expectContains ?? []) {
    if (!content.includes(needle)) failures.push(`expected to contain "${needle}"`);
  }
  for (const re of c.expectNotMatch ?? []) {
    if (re.test(content)) failures.push(`unexpectedly matched ${re}`);
  }

  return { name: c.name, pass: failures.length === 0, failures, answer: content };
}

async function main() {
  console.log(`Running ${CASES.length} AI Trade Analyst smoke checks...\n`);
  let allPassed = true;

  for (const c of CASES) {
    const result = await runCase(c);
    const status = result.pass ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name}`);
    if (!result.pass) {
      allPassed = false;
      for (const f of result.failures) console.log(`  - ${f}`);
      console.log(`  answer: ${result.answer.slice(0, 300)}${result.answer.length > 300 ? "…" : ""}`);
    }
  }

  console.log(allPassed ? "\nAll checks passed." : "\nSome checks failed — see above.");
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
