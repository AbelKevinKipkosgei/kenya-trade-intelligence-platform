# KTIP — Presentation Cheat Sheet

## 30-Second Pitch
Kenya's trade data (customs, tariffs, agreements, barriers, exporters, procedures) is scattered across many agencies. KTIP unifies it in one Next.js + Postgres platform with an AI analyst that answers questions by querying the real database — so every number is traceable, not a black box.

## The 3 Problems It Solves
1. **Policymakers** have no single cross-agency view of trade flows/tariffs/barriers.
2. **Exporters/importers** can't easily find procedures, promising markets, or who else supplies them.
3. **Existing insight tools are black boxes** — KTIP requires every score to trace back to real data.

## Architecture (say this in one breath)
Next.js 16 app → Postgres (Neon) single source of truth → 8 feature pages (server-rendered, URL-filtered, no dashboard framework) → AI Trade Analyst (Claude Opus 5 + one locked-down SQL tool) → BI views (`vw_*`) feed the org's existing BI tool, **InsightGrid**, instead of duplicating dashboards in-repo.

## Key Terms (say these correctly and you'll sound sharp)
| Term | Meaning |
|---|---|
| **HS Code** | International standard code for classifying a traded product |
| **MFN rate** | Default/standard tariff a country charges everyone |
| **Preferential rate** | Lower tariff available via a trade agreement |
| **Non-tariff barrier (NTB)** | Non-tax obstacle — licensing, quotas, SPS/technical rules |
| **Landed cost** | Declared value + duty owed = real cost of importing |
| **Trade bloc/agreement** | EAC, COMESA, AfCFTA, AGOA, EU-EPA, WTO-MFN, bilateral |
| **Market access** | How cheaply Kenya can sell into a market (driven by tariff) |
| **Export-ready** | Exporter flagged as certified/capable to supply now |
| **Provenance** | Every fact traces to the government agency that's its source |

## The 8 Features (one line each)
1. **Explorer** — full trade profile for any product (markets, tariffs, barriers, exporters, procedures, news)
2. **Landed Cost Estimator** — duty + declared value, live USD/KES rate
3. **Opportunity Engine/Leaderboard** — ranks product-market pairs by a 7-factor score
4. **Barrier Monitor** — feed of active non-tariff barriers
5. **Export Capacity Map** — directory of Kenyan exporters by capability
6. **Getting Started** — step-by-step import/export procedures by agency
7. **Trade News** — live-ingested + mock news feed
8. **AI Trade Analyst** — chat that queries the live DB and cites its own query

## Opportunity Score — 7 Dimensions
Demand · Growth · Market Access · Competition · Logistics · Domestic Capacity · Competitiveness
> Say: "Each dimension is labeled in the UI as either a direct measurement or a documented proxy — we never hide which is which."

## Data Sources (if asked "is this real data?")
- **Mock/synthetic** (transactions, tariffs, barriers, exporters — 2.7M+ rows): generated with Faker + real `world-countries` ISO reference data, since no live government feed exists yet. Clearly labeled.
- **Real & live**: Trade news via **NewsAPI.org** (ingested every 6h); USD/KES exchange rate via **open.er-api.com**.
- **Real & static**: Port throughput weighting uses actual 2024/2025 Mombasa/Lamu and JKIA/Moi figures.
- Tariff records carry a `rate_source` field distinguishing real WITS-sourced rates from estimates.

## The One Killer Line for Q&A
"The AI doesn't generate answers from training data — it runs a real, read-only SQL query against our live database every time, so it can never invent a number, and if there's no data, it says so."

## If They Ask About Limitations (be upfront, don't dodge)
- No third-country trade data → "competitiveness"/"competition" scores are proxies, not true rival comparisons.
- No real freight data → "logistics" score proxies off trade-bloc membership.
- Most data is synthetic pending real agency integration (KRA, KEPROBA, KEBS, EPZA, KenTrade, KPA).
