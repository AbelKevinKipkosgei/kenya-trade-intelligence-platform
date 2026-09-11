# Kenya Trade Intelligence Platform (KTIP)

A centralized trade decision-support platform built for Kenya's State Department for Trade — unifying trade transaction data, tariffs, trade agreements, non-tariff barriers, export capacity, and market opportunity intelligence into one system, with an AI analyst that can answer questions grounded directly in that data.

This document is the platform's technical and product documentation: the problem it solves, how it solves it, the stack and techniques behind it, every feature in detail, the limitations that come with a project at this stage, the errors hit along the way and how they were fixed, and where it hands off to the organization's existing BI tooling (InsightGrid).

> Source of truth: the feature scope below was defined by two internal concept documents — "Kenya Trade Intelligence Platform (Software Concept)" and "KTIP Data Analysis Concept" — which specify the platform's core capabilities and the requirement that every insight the system surfaces be traceable back to real underlying data, not a black box.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Solution Architecture](#3-solution-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Data Model](#5-data-model)
6. [Features](#6-features)
7. [Key Techniques & Implementation Patterns](#7-key-techniques--implementation-patterns)
8. [Limitations & Known Errors (and How They Were Fixed)](#8-limitations--known-errors-and-how-they-were-fixed)
9. [Getting Started (Local Development)](#9-getting-started-local-development)
10. [Automation / Scheduled Jobs](#10-automation--scheduled-jobs)
11. [External Analytics: InsightGrid](#11-external-analytics-insightgrid)

---

## 1. Problem Statement

Kenya's trade information — customs and transaction records, tariff schedules, trade agreement terms, non-tariff barrier reports, export procedures, and registered export capacity — is fragmented across multiple state agencies (KRA/Customs, KEPROBA, KEBS, EPZA, KenTrade, KPA, KEPHIS, and others), each with its own systems and formats. This creates three concrete problems:

- Policymakers and trade officers at the State Department for Trade have no single, up-to-date view of trade flows, tariff exposure, or active barriers to reason about policy with. Getting a cross-agency picture today means manually reconciling separate reports.
- Exporters and importers — especially new or small businesses — have no single place to find what procedures apply to them, which markets are actually promising for their product, what barriers currently exist there, and who else in Kenya already has the capacity to supply that market. This information exists, but it's scattered and hard to act on.
- Insight tools that do exist tend to be black boxes. The source concept docs explicitly call for the opposite: any score or recommendation the platform produces must be explainable and traceable back to the real data behind it — not an opaque model output.

KTIP exists to solve these three problems in one system.

## 2. Solution Overview

KTIP is a Next.js application backed by a single Postgres database (hosted on Neon) that models Kenya's trade data as a set of clearly-related tables — products, countries, tariffs, trade agreements, barriers, exporters, transactions, and procedures — each traceable to the government agency that is its source of record. On top of that data model sit eight purpose-built tools (detailed in [Section 6](#6-features)), each addressing one part of the problem above: exploring a product's trade profile, estimating landed cost, ranking market opportunities, monitoring active barriers, finding capable Kenyan exporters, walking through export/import procedures, tracking live trade news, and — tying it all together — an AI Trade Analyst that can answer free-form questions by querying the same live database and citing what it finds.

Three design decisions shape the whole system:

- Every page is server-rendered and grounded in the real database — there is no page in this app showing numbers that aren't a query result. Even the homepage's headline statistics (export/import totals, top trading partner, active barrier count) are computed live from the same tables the rest of the app uses, not hardcoded copy.
- General analytics and dashboarding are explicitly out of scope for this repo. The organization already has a BI tool for that — InsightGrid (see [Section 11](#11-external-analytics-insightgrid)) — so instead of duplicating dashboard-building work, KTIP exposes a set of clean, denormalized SQL views (`vw_*`) that InsightGrid (or any BI tool) can point at directly. The one deliberate exception is the Market Opportunity Engine's scoring logic, which was brought in-repo because it's core product logic the platform itself depends on, not a general-purpose analytics view.
- The AI Trade Analyst is retrieval-grounded, not a trained model. It's Claude (Anthropic's Opus 5) given a single tool — a hardened, read-only SQL query against the live database — so every answer it gives is backed by a query it actually ran, satisfying the "traceable, not a black box" requirement directly rather than trying to approximate it with a fine-tuned model.

Because there is no live feed from the real government agencies yet, the database is seeded with a large, structurally realistic mock dataset (2.7M+ trade transaction rows, real ISO country/HS-chapter reference data, curated per-sector product names, real Kenyan counties/agencies/trade-bloc memberships) so every feature can be built, tested, and demonstrated against something that behaves like the real thing. Two parts of that dataset are not entirely mock: the trade news feed is backed by a live ingestion pipeline pulling real Kenya trade news from NewsAPI.org on a schedule (see the Trade News feature below), and MFN tariff rates for Kenya's actual major trading partners can be synced from the World Bank's real WITS/TRAINS database via a manually-triggered job (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed) and [Section 10](#10-automation--scheduled-jobs)) — every tariff row is tagged `rateSource: "real" | "estimated"` so the two are never presented as equally authoritative.

## 3. Solution Architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js pages<br/>(Server Components, URL-filtered)"]
        Chat["AI Trade Analyst chat UI<br/>(Client Component, streaming)"]
        Interests["Interests picker<br/>(Client Component)"]
        Bell["Notification bell<br/>(Client Component, polling)"]
    end

    subgraph App["Next.js 16 App (Node runtime)"]
        Pages["Feature pages<br/>Explorer · Opportunities · Barriers<br/>Exporters · News · Getting Started · Dashboards"]
        API["/api/trade-analyst<br/>streaming route handler"]
        InterestsAPI["/api/interests<br/>route handler (adapter over watchlist_items)"]
        WatchlistAPI["/api/watchlists*<br/>route handlers"]
        NotifAPI["/api/notifications<br/>route handler"]
        Analyst["AI Trade Analyst<br/>Claude Opus 5 + tool-use loop"]
        SQLTool["Hardened read-only SQL tool<br/>(regex prefilter + READ ONLY tx<br/>+ statement timeout + row cap)"]
        Proxy["NextAuth middleware (proxy.ts)<br/>gates /api/trade-analyst, /interests,<br/>/watchlists, /profile, /dashboard, /notifications"]
        AuthJs["NextAuth.js (lib/auth.ts)<br/>Credentials + Google/LinkedIn/GitHub/Facebook OAuth<br/>hand-written adapter, JWT sessions"]
    end

    subgraph Data["Neon Postgres"]
        Core[("Core tables<br/>products, countries, tariffs,<br/>barriers, exporters, transactions,<br/>procedures, agencies")]
        UsersTable[("users, accounts, user_profiles<br/>(NextAuth's own user store,<br/>via a hand-written Adapter)")]
        WatchlistTables[("watchlists, watchlist_items<br/>(products/countries/sectors/<br/>opportunities/barriers/exporters —<br/>sector+country follows live here too)")]
        NotifTable[("notifications")]
        Scores[("market_opportunity_scores<br/>(computed in-repo, see §6.3)")]
        Views[("vw_* BI views<br/>(read-only, denormalized)")]
    end

    subgraph External["External Systems"]
        NewsAPI["NewsAPI.org"]
        WITS["World Bank WITS/TRAINS<br/>(real MFN tariff rates)"]
        Resend["Resend<br/>(email delivery)"]
        OAuthProviders["Google · LinkedIn ·<br/>GitHub · Facebook"]
        InsightGrid["InsightGrid<br/>(org's BI/dashboard tool,<br/>also embedded at /dashboards)"]
    end

    subgraph Automation["GitHub Actions (scheduled)"]
        ScoreJob["Recompute Opportunity Scores<br/>(daily cron)"]
        NewsJob["Fetch Trade News<br/>(every 6h cron)"]
        AlertsJob["Send Interest Alerts<br/>(daily cron)"]
        TariffJob["Sync Real MFN Tariffs<br/>(manual trigger, resumable)"]
    end

    UI -->|"Drizzle ORM queries"| Core
    UI -->|"reads"| Scores
    UI -->|"iframe embed"| InsightGrid
    Chat --> API --> Analyst --> SQLTool --> Core
    Interests --> InterestsAPI --> WatchlistTables
    Bell --> NotifAPI --> NotifTable
    UI --> WatchlistAPI --> WatchlistTables
    Proxy --> AuthJs --> UsersTable
    AuthJs <-->|"sign-in / account link"| OAuthProviders
    ScoreJob -->|"pnpm db:score"| Scores
    NewsJob -->|"pnpm news:fetch"| NewsAPI
    NewsJob --> Core
    TariffJob -->|"pnpm tariffs:sync-real"| WITS
    TariffJob --> Core
    AlertsJob -->|"pnpm alerts:send"| WatchlistTables
    AlertsJob --> Core
    AlertsJob -->|"look up email"| UsersTable
    AlertsJob -->|"send digest"| Resend
    Core --> Views
    Views --> InsightGrid
```

Layering, top to bottom:

- Feature pages are React Server Components. Each one reads its filters from the URL's search params (not client state), queries Postgres directly through Drizzle ORM, and renders server-side — so every page is a plain link that can be bookmarked or shared and reproduces the exact same view. There is no client-side dashboard framework anywhere in this layer, with one deliberate exception: `/dashboards` embeds the organization's own InsightGrid (Superset) dashboards directly via iframe, rather than rebuilding them (see [Section 6.10](#610-dashboards--insightgrid-embed-dashboards)).
- The AI Trade Analyst is a separate, parallel path: a streaming API route that hands the conversation to Claude with a single tool (a locked-down SQL runner) and loops until Claude produces a final, non-tool-use answer. It's one of several routes gated behind authentication — every core data page stays public, matching the platform's public-data mission.
- Authentication is fully self-hosted via NextAuth.js — a credentials provider (email/password, bcrypt-hashed) plus four OAuth providers (Google, LinkedIn, GitHub, Facebook), all backed by a **hand-written** `Adapter` against this same Postgres database (not `@auth/drizzle-adapter`'s generic implementation — see [Section 7](#7-key-techniques--implementation-patterns) for why), not an external identity provider. Sessions are stateless JWTs.
- Watchlists (`watchlists`/`watchlist_items`) are the single home for everything a signed-in user tracks — individual products, countries, opportunities, barriers, and exporters, but also sector/country follows for the alert digest, which used to live in a separate `user_interests` table before being folded in (see [Section 6.11](#611-my-interests--watchlists-watchlists-interests)).
- The notification system (`notifications` table, the bell in the header, `/notifications`) is a second, independent alerting path alongside the older interest-alert email digest — in-app plus optional email notifications for tariff changes, new barriers, and opportunity score shifts on tracked items, detected by scheduled scripts that are not yet wired to a GitHub Actions schedule (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)).
- The database is the single source of truth for every path. It also exposes a layer of read-only SQL views (`vw_*`) purely for external consumption — this is the seam where InsightGrid plugs in without needing to understand the underlying normalized schema.
- Four GitHub Actions workflows run against the same database, standing in for the recurring jobs a deployed system would need: recomputing opportunity scores (daily), pulling in new trade news (every 6h), emailing interest-alert digests (daily), and syncing real MFN tariff rates from the World Bank's WITS/TRAINS database (manually triggered — a multi-hour job, see [Section 10](#10-automation--scheduled-jobs)). The alerts job's only external dependency beyond the database is Resend, for actually sending the email — the recipient's address is a direct query against `users`, not an external lookup.

## 4. Technology Stack

- Next.js 16 (App Router) — full-stack framework: Server Components for all data-driven pages, route handlers for the streaming AI API, file-based routing throughout.
- NextAuth.js (Auth.js v5 beta, `bcryptjs`) — self-hosted authentication: email/password sign-in plus Google, LinkedIn, GitHub, and Facebook OAuth, backed directly by this project's own Postgres via a **hand-written `Adapter`** (not the `@auth/drizzle-adapter` package — its generic implementation assumes a UUID-string-keyed `user` table, which doesn't match this project's pre-existing serial-integer `users` table; see [Section 7](#7-key-techniques--implementation-patterns)), JWT sessions, and role-based access control (`public | exporter | importer | officer | admin`, though only the first three are self-selectable for now — see [Section 6.11](#611-my-interests--watchlists-watchlists-interests)). Gates the AI Trade Analyst and account-specific pages (interests, watchlists, profile, dashboard, notifications) behind a signed-in user; every core data page stays public.
- Resend — transactional email delivery for the interest-alert digest job and the notification system's optional email channel (see [Section 6.11](#611-my-interests--watchlists-watchlists-interests) and [Section 6.12](#612-notifications-notifications)).
- React 19 — UI rendering, used with the React Compiler's stricter lint rules (`react-hooks/refs`, `react-hooks/set-state-in-effect`) enabled.
- TypeScript — end-to-end static typing, including inferred types from the Drizzle schema all the way into page props.
- Tailwind CSS v4 — styling; custom theme tokens for the Kenyan flag palette (`kenya-black`, `kenya-red`, `kenya-green`, `kenya-white`) and dark/light mode via `@custom-variant dark`.
- Drizzle ORM (`drizzle-orm/node-postgres`) + drizzle-kit — typed schema definition and query building against Postgres; `drizzle-kit push` keeps the live schema in sync with the TypeScript schema files.
- Neon (serverless Postgres) — the database. Free-tier project, which shaped several design decisions (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)).
- Redux Toolkit + react-redux — client-side state, deliberately scoped to state that's genuinely shared across client components within a page (e.g. filter context), not used as a replacement for the URL-driven server-rendered pattern most pages use.
- next-themes — dark / light / system theme switching with persistence.
- Anthropic SDK (`@anthropic-ai/sdk`) + Claude Opus 5 — powers the AI Trade Analyst: streaming responses, tool use, prompt caching, adaptive thinking, and server-side refusal fallback.
- Zod — runtime validation of the AI tool's input and the chat API's request body.
- react-markdown + remark-gfm — renders the AI Trade Analyst's Markdown-formatted answers (tables, lists, code) safely in the chat UI.
- @faker-js/faker + world-countries — mock data generation: faker for volume/randomization, `world-countries` for real ISO country reference data (names, codes, regions) so the mock dataset is geographically accurate.
- NewsAPI.org — real-time source for the trade news feed's live ingestion pipeline.
- pnpm — package manager (workspace-aware, used for its strict, disk-efficient install model).
- GitHub Actions — scheduled automation: daily opportunity-score recomputation, 6-hourly news ingestion, and daily interest-alert digests, chosen after confirming Neon's free tier does not support `pg_cron` (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)).
- Playwright (dev-only) — available for browser-driven verification of pages during development.

## 5. Data Model

The schema is organized into six logical groups, each in its own file under `db/schema/`. Row counts below reflect the current seeded database:

- Reference / core (`core.ts`) — `agencies`, `countries`, `sectors`, `counties`, `ports`: 13 agencies · 250 countries · 14 sectors · 47 counties · 12 ports.
- Trade catalog (`trade.ts`) — `products`, `trade_agreements`, `agreement_members`, `tariffs`, `trade_barriers`: 1,307 products · 8 agreements · 395 memberships · 79,528 tariffs · 4,000 barriers.
- Export capacity (`exporters.ts`) — `exporters`: 5,000 rows.
- Transactions (`transactions.ts`) — `trade_transactions`: 2,708,389 rows.
- Intelligence (`intelligence.ts`) — `market_opportunity_scores`, `news_articles`: 311,217 scores · 3,004 articles (3,000 seeded mock + live NewsAPI ingestion).
- Procedures (`procedures.ts`) — `procedures`: 10 rows.
- Users (`users.ts`) — `users` (real, wired accounts: email, nullable bcrypt password hash, role, active/verified flags, OAuth avatar `image`), `accounts` (one row per linked OAuth provider — Google/LinkedIn/GitHub/Facebook — keyed by `(provider, providerAccountId)`), `user_profiles` (role-specific extended data — business details shared by exporters and importers, officer agency/department), `watchlists`/`watchlist_items` (tracking individual products, countries, sectors, opportunities, barriers, or exporters — sector/country follows for the alert digest live here too, see [Section 6.11](#611-my-interests--watchlists-watchlists-interests)), `notifications` (in-app/email alerts on tracked items, see [Section 6.12](#612-notifications-notifications)). This is NextAuth's own user store, accessed via a hand-written `Adapter` — not a separate identity provider, and not the generic `@auth/drizzle-adapter` package (see [Section 7](#7-key-techniques--implementation-patterns)).

Design principles baked into the schema:

- Provenance first — every fact table (`trade_transactions`, `tariffs`, `trade_barriers`, `procedures`) carries a foreign key back to the `agencies` table that is its source of record, a direct implementation of the concept docs' "must be traceable" requirement.
- `trade_transactions` is a narrow fact table (product × country × month × flow direction) with a single composite index covering the common query patterns, deliberately kept lean since it's both the largest table and the one InsightGrid would query most heavily.
- JSONB where structure is genuinely variable — `exporters.certifications` (a list of cert names) and `procedures.steps` (an ordered list of step objects with optional documents/fees/duration), both consumed as typed structures in TypeScript via Drizzle's `$type<T>()`.
- Idempotency where re-runs are expected — `news_articles.source_url` has a `UNIQUE` constraint specifically so the scheduled ingestion job can `ON CONFLICT DO NOTHING` instead of accumulating duplicates on every run.

## 6. Features

### 6.1. Market & Product Explorer (`/explorer`)

Look up any product by HS code or free-text name (a debounced autocomplete backed by `/api/products/search`, matching against both HS code and description) and see its complete trade profile in one page: top export markets and import sources (with a relative-share indicator per country), tariff rates by market (color-coded MFN vs. preferential, and flagged when a rate is real WITS-sourced data rather than an estimate — see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)), active trade barriers, Kenyan exporters registered against that product (flagged if export-ready), related step-by-step procedures, and related news — all in parallel queries against the live database, joined by the product's ID. This is the page every other feature links back to, so a user can go from "here's a market opportunity" or "here's a barrier" straight to the full picture for that product. Signed-in users can bookmark a product to a watchlist directly from this page (see [Section 6.11](#611-my-interests--watchlists-watchlists-interests)).

### 6.2. Landed Cost Estimator (part of `/explorer`)

Given a product already open on the Explorer page, a declared shipment value, and a destination market, computes the estimated total cost of importing that shipment: the applicable import duty plus the declared value. It lives as a section on the Explorer page rather than its own nav entry — the nav was already at seven links, and this needs exactly the tariff data the Explorer page has already loaded for that product, so a separate page would just mean re-fetching the same data behind a new route. See [Section 7](#7-key-techniques--implementation-patterns) for how the rate is chosen and how the USD/KES conversion works.

### 6.3. Market Opportunity Engine / Leaderboard (`/opportunities`)

Ranks product–market combinations by a composite Opportunity Score built from seven dimensions, exactly as specified in the concept docs: demand, growth, competitiveness, market access, competition, logistics, and domestic capacity. Unlike most of the platform's intelligence, this scoring is computed for real from the underlying transaction, tariff, barrier, and exporter data — not seeded as placeholder noise (see [Section 7](#7-key-techniques--implementation-patterns) for the exact formula). The leaderboard is filterable by sector, market, and quarter, and every result links to the full product profile on the Explorer page. The UI is explicit about which dimensions are direct measurements versus documented proxies (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)) rather than presenting every number with false precision.

### 6.4. Trade Barrier Monitor (`/barriers`)

A filterable feed of non-tariff barriers, SPS/technical requirements, quotas, and licensing issues affecting Kenyan exports — each entry attributed to the Kenyan agency that reported it, with a status (active / monitoring / resolved) and an impact level. Filterable by status, barrier type, sector, and destination market.

### 6.5. Kenyan Export Capacity Map (`/exporters`)

A directory of registered Kenyan manufacturers and producers, searchable by name and filterable by sector, county, and export-readiness. This is what closes the loop on the Market Opportunity Engine: once a promising product-market pair is identified, this page answers "who in Kenya can actually supply it" — each exporter shows employee count, annual capacity, certifications, and contact info where available.

### 6.6. Trade Agreement & Market Access Intelligence

Rather than a standalone page, this is woven directly into the Explorer's tariff table and the Opportunity Engine's market-access score: every tariff rate is linked to the specific trade agreement it derives from (EAC, COMESA, AfCFTA, AGOA, EU-EPA, WTO-MFN, or bilateral), and agreement membership dates are tracked per country so eligibility is queryable, not asserted.

### 6.7. Getting Started (`/getting-started`)

A step-by-step procedures browser, grouped by category (Importing, Exporting, Certification, Licensing, Customs & Duties), each with a quick-nav strip, a lead-agency and estimated-duration badge, and a numbered step timeline including required documents and fees per step. This is the piece the concept docs identified as missing from typical trade-data platforms: quantitative data alone doesn't help a first-time exporter who doesn't know which agency to visit first.

### 6.8. Trade News (`/news`)

A categorized (tariff / agreement / market / policy / logistics) feed of Kenya trade news, filterable by category and related market. Most of the 3,000+ articles are part of the seeded mock dataset (clearly labeled "Mock article"), but the feed is also backed by a real, live ingestion pipeline: a scheduled job pulls actual Kenya trade/tariff/agreement news from [NewsAPI.org](https://newsapi.org) every six hours, filters it for relevance, categorizes it, and inserts it idempotently. See [Section 7](#7-key-techniques--implementation-patterns) for exactly how the relevance filtering works and why.

### 6.9. AI Trade Analyst (`/analyst`)

A chat interface for asking free-form questions about Kenyan trade — tariffs, barriers, exporters, market opportunities — answered by Claude Opus 5, grounded entirely in the live database via a single read-only SQL tool. Every answer is the result of a query the model actually ran against the real data; the model cannot free-hallucinate a number, and if it doesn't have data for something, it says so rather than inventing an answer. Conversations persist per-browser (localStorage) across refreshes, responses stream with a live "Thinking… / Querying the trade database…" status indicator, and the interface degrades gracefully with a rate limit (10/min, 60/hour per IP) to bound API cost exposure on a public route.

### 6.10. Dashboards & InsightGrid Embed (`/dashboards`)

Per the architectural boundary in [Section 11](#11-external-analytics-insightgrid), general trend dashboards and BI-style analytics are intentionally not *built* in this repository — that's InsightGrid's job, fed by the `vw_*` views. `/dashboards` is where that boundary becomes a concrete page rather than just an integration point: it embeds the organization's own hosted InsightGrid (Apache Superset) dashboards directly via iframe (an opportunities/tariffs dashboard and a trade-performance dashboard), so a user never has to leave KTIP to see the BI analytics built on top of the same underlying data. This is a convenience embed, not a rebuild — the dashboards themselves are still authored and hosted entirely in InsightGrid. Separately, the homepage (`/`) surfaces a small set of real, live headline statistics (current-year export/import totals, top export partner, active trade barrier count) computed directly from the database — deliberately a summary strip, not a dashboard.

### 6.11. My Interests & Watchlists (`/watchlists`, `/interests`)

Authentication is self-hosted via NextAuth.js — email/password sign-in and sign-up at `/auth/signin` / `/auth/signup`, plus one-click sign-in via Google, LinkedIn, GitHub, or Facebook, all backed directly by this project's own `users`/`accounts` tables (bcrypt password hashing for credentials, a hand-written Adapter for OAuth, JWT sessions — see [Section 7](#7-key-techniques--implementation-patterns)). A first-time OAuth sign-in with an email that already matches an existing password-based account is auto-linked to it (`allowDangerousEmailAccountLinking`) rather than creating a duplicate account, since all four providers only ever hand back an email they've themselves already verified. The AI Trade Analyst and every account-specific page (watchlists, interests, profile, dashboard, notifications) are gated behind sign-in; every core data page stays fully public, matching the platform's stated public-data mission.

Self-selectable account types are `public`, `exporter`, and `importer` (`app/onboarding/`, `components/onboarding/`) — `officer` still exists as a `UserRole` and keeps its own dashboard/profile support, but nothing lets a new user become one for now (not offered on the signup form, and `POST /api/auth/signup`/`POST /api/user/role` both reject it server-side too), and `admin` was never self-registrable. Credentials signup picks a role up front and provisions an (initially empty) `user_profiles` row immediately; OAuth sign-in has no form to ask at, so a first-time OAuth account defaults to `public` with no profile row at all, and `/onboarding` treats "no profile row" as the signal that this account has never chosen a type — every OAuth sign-in (new or returning) is routed through `/onboarding` first (`components/auth/oauth-buttons.tsx` always sends the provider's `callbackUrl` through `/onboarding?next=<original destination>`), where a returning, fully-onboarded user is simply redirected straight on to that original destination with no extra step, and a brand-new one sees an account-type picker (`components/onboarding/account-type-step.tsx`) before landing on the same `exporter`/`importer` business-details form (`components/onboarding/business-onboarding.tsx`) credentials signups get. Choosing a type there updates `users.role` and, since a JWT session never re-reads the database on its own, also calls `useSession().update()` to refresh the role into the live session immediately rather than waiting for the next full sign-in.

An "Account Security" panel on `/profile` (`components/profile/account-security.tsx`, `app/api/user/password/route.ts`, `app/api/user/accounts/route.ts`) lets a user manage the credentials/OAuth boundary directly instead of it being fixed at sign-up: a user who signed up with a password can change it (current password verified via `bcrypt.compare` first); a user who signed up via an OAuth provider and has no password yet can set one for the first time, with no current-password check since the session itself is the proof of identity; and any linked OAuth provider can be disconnected individually. Disconnecting is blocked with a 400 if it would leave the account with no way to sign back in at all — no password set and this is the only linked provider — verified live against both the blocked and now-unblocked (after setting a password) cases.

Once signed in, `/watchlists` is the single place a user tracks anything: named lists (a user can have several) holding any mix of products, countries, sectors, opportunities, barriers, and exporters, each item individually toggle-able for alerts and editable with personal notes. `/interests` is a focused, faster on-ramp into the same system for the two follow-worthy categories that benefit from a flat "browse everything, toggle several" picker rather than the general add-to-a-named-list flow — sectors and countries — and a first follow there auto-provisions a "My Interests" watchlist rather than requiring the user to create one manually first. These two pages are not separate data models: sector/country follows are ordinary `watchlist_items` rows (`itemType: "sector" | "country"`), so anything followed via the picker shows up in the regular watchlist UI too, and a "View My Interests watchlist →" link on `/interests` jumps straight there once it exists.

A daily scheduled job (`db/notifications/send-interest-alerts.ts`, see [Section 10](#10-automation--scheduled-jobs)) emails a digest of new trade barriers and news articles matching each user's followed sectors/countries (`watchlist_items` where `alertsEnabled` is true) since the last run, looking up each recipient's email with a direct query — no external identity API involved. Deliberately scoped to those two sources for now — tariff-rate changes and opportunity-score shifts are covered instead by the separate, in-app-first notification system (see [Section 6.12](#612-notifications-notifications)).

### 6.12. Notifications (`/notifications`)

A second, independent alerting path alongside the interest-alert email digest above — notifications are per-item rather than per-sector/country, and in-app first rather than email-only. Three scheduled detection scripts (`db/notifications/detect-{barriers,tariff-changes,opportunity-changes}.ts`, run together via `pnpm notifications:detect`, and scheduled hourly — see [Section 10](#10-automation--scheduled-jobs)) scan every `watchlistItem` with alerts enabled for a new barrier, a tariff-rate change, or a significant (>5 point) opportunity-score shift, and write a row to `notifications` for each affected user (respecting their notification-category preferences on `user_profiles.notificationPreferences`). Each detector only checks one specific `itemType`, so which category a user follows determines what can actually notify them: `detect-barriers.ts` checks `itemType: "product" | "country"` items for a new barrier; `detect-opportunity-changes.ts` checks `itemType: "opportunity"` items for a score shift; a `sector` follow (unlike `product`/`country`) isn't checked by any detector here — it's covered instead by the interest-alert digest in [Section 6.11](#611-my-interests--watchlists-watchlists-interests). A bell icon in the site header polls for unread notifications and shows a dropdown; the full `/notifications` page supports filtering, marking read, and pagination. A separate script (`pnpm notifications:email`) sends the same notifications by email — immediately, daily, or weekly per the user's own preference — for users who've opted into the email channel. Tariff-rate-change detection is currently a documented stub (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)): the query and notification-creation logic are written, but commented out pending a tracked "previous rate" to diff against, which doesn't exist yet.

## 7. Key Techniques & Implementation Patterns

Server-rendered, URL-filtered pages instead of a client dashboard framework — every feature page reads its filter state from `searchParams`, queries the database in the Server Component itself (often several queries in parallel via `Promise.all`), and renders fully on the server. Filter controls are small Client Components that just push a new URL via `router.push()` — no client-side data fetching, no loading spinners, no state synchronization bugs, and every filtered view is a real, shareable URL.

The Opportunity Score is computed with real SQL, not placeholder randomness (`db/scoring/compute-opportunity-scores.sql`, run via `pnpm db:score`):

- Demand — a percentile rank of a product-market pair's export value against every other pair traded that same quarter.
- Growth — quarter-over-quarter change via a `LAG()` window function over full transaction history.
- Market access — driven by the best (lowest) tariff rate Kenya's exporters actually face for that pair.
- Competition — a penalty accumulated from active trade barriers, weighted by severity.
- Logistics — a proxy based on EAC/COMESA trade-bloc membership (overland-reachable vs. not), since the platform has no real freight/transit-time data.
- Domestic capacity — a percentile rank of registered, export-ready exporter capacity for that product.
- Competitiveness — a percentile rank of a product's performance within a specific market relative to Kenya's other products sold there (not against rival exporting countries — see limitations).

Every dimension is documented inline in the SQL and in the UI as either a direct measurement or an explicit proxy, per the concept docs' explainability requirement.

The Landed Cost Estimator (`components/landed-cost-calculator.tsx`, `lib/forex.ts`) picks, per destination market, the best (lowest) tariff rate the product actually qualifies for — the same "lowest applicable rate" logic the Opportunity Score's market-access dimension uses — since a market can have both an MFN rate and a preferential rate under an agreement, and only the lower one is what an exporter would actually pay. Duty is calculated as declared value × that rate, and shown as a total alongside the declared value. For the USD/KES conversion, rather than hardcoding an exchange rate that would silently go stale, the Explorer page fetches a live rate server-side from a free, no-key API (`open.er-api.com`, backed by exchangerate-api.com's free tier, rates updated daily), cached for an hour via Next's fetch cache so repeated page views don't each trigger an external call. The rate itself is disclosed inline rather than hidden behind the converted figures, and if the forex API is ever unreachable, the KES figures are simply omitted with a note instead of the page breaking.

BI views as the external-analytics boundary (`db/views/bi-views.sql`, applied via `pnpm db:views`) — seven flattened, fully-joined, zero-storage-cost SQL views (`vw_trade_transactions`, `vw_market_opportunity`, `vw_tariffs`, `vw_trade_barriers`, `vw_news_articles`, `vw_procedures`, `vw_exporters`) so a BI tool never needs to understand the normalized schema or write its own joins — see [Section 11](#11-external-analytics-insightgrid).

AI Trade Analyst internals (`lib/ai/trade-analyst.ts`, `lib/ai/sql-tool.ts`):

- Hardened read-only SQL tool — defense in depth: a regex prefilter rejects obvious writes/DDL, the query then runs inside a `BEGIN TRANSACTION READ ONLY` block (so Postgres itself refuses any write regardless of what slips past the regex), with an 8-second statement timeout and every result wrapped in an outer `LIMIT` so no query can return more than 200 rows.
- Prompt caching — the schema-context system prompt uses an explicit 1-hour cache breakpoint (since gaps between a user's chat turns are often past the default 5-minute window but rarely past an hour); the growing tool-use message history uses an automatic breakpoint so each iteration only pays for what it just added.
- Narration suppression — the model's text is buffered per tool-loop iteration and only forwarded to the client once a genuine final answer (not a tool call) is confirmed, so "I'll check the database…"-style narration never reaches the visible chat.
- A custom status-protocol (`lib/status-protocol.ts`) rides the same plain-text HTTP stream as the answer, delimited by the Unicode Private Use Area character `U+E000` (chosen specifically because it can never appear in real model output, unlike a word like "status" which is common in this domain) — the client strips these out and renders them as a transient "Thinking… / Querying the trade database…" indicator instead of leaking them into the visible message.
- Refusal fallback — uses Claude's server-side fallback beta so a safety-classifier refusal (a normal `200`, not an error) automatically retries on Anthropic's recommended substitute model instead of dead-ending the conversation.
- In-memory sliding-window rate limiting (10/min, 60/hour per IP) bounds worst-case API cost exposure on the public chat route.

Idempotent, scheduled data ingestion (`db/ingestion/fetch-news.ts`, run via `pnpm news:fetch` or the "Fetch Trade News" GitHub Action) — queries NewsAPI's `/v2/everything` with an empirically-tuned boolean query, then applies a dual-regex relevance filter requiring both a Kenya-signal term (`kenya|nairobi|mombasa|ruto|eac|comesa|east african community`) and a trade-signal term (`trade|export|import|tariff|customs|comesa|eac|afcfta|agoa|...`) to both appear in the combined title+description (not the full article body, which was found empirically to produce false positives). Category is assigned via keyword-priority heuristic, related country via substring match against the `countries` table, and inserts use `onConflictDoNothing()` against the unique `source_url` constraint — safe to run on any schedule without duplicating articles.

Mock data generation, at volume, within a free-tier storage budget (`db/seed/`) — `@faker-js/faker` for randomized volume plus `world-countries` for real ISO reference data, a size-guard system (`checkSizeLimit()`) that checks live database size after every insert batch and halts generation before hitting Neon's free-tier cap, and curated per-sector product name lists (replacing faker's nonsensical generic product names) so the 1,307-product catalog reads like real HS-coded goods.

Kenyan flag theming with full dark/light/system support — Tailwind v4 theme tokens (`kenya-black`, `kenya-red`, `kenya-green`, `kenya-white`) plus `next-themes` for OS-default theme detection with a manual override, implemented as a compact icon-based toggle (not full text labels, which was found to crowd the header on mobile — see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)).

A deliberate mobile-first pass — the 8-column Opportunity Leaderboard table renders as a stacked card view below the `sm` breakpoint instead of relying on horizontal scroll; all filter inputs render at 16px on mobile (smaller sizes trigger unwanted auto-zoom in iOS Safari on focus); the site header spans the full viewport width (not a centered max-width box) so the logo and controls sit at the true edges instead of being crowded into a narrow strip; and the mobile nav uses a proper overlay panel with backdrop blur rather than blending into page content.

A hand-written NextAuth `Adapter`, not the generic `@auth/drizzle-adapter` package (`lib/auth.ts`) — `@auth/drizzle-adapter`'s default implementation defines its own `user`/`account`/`session` tables assuming a UUID-string primary key, and passing this project's own `users` table into it as an override still fails, because Auth.js's internal `AdapterUser` type doesn't line up with this schema's actual column names or types: `id` must come back as a `string` (this project's is a serial integer), `emailVerified` must be a `Date | null` (this project's is a plain `boolean`), and Auth.js's own `createUser` call writes a `name` field (this project's column is `fullName`). Every method Auth.js actually calls under this JWT-session, no-Email-provider configuration (`getUser`, `getUserByEmail`, `getUserByAccount`, `createUser`, `updateUser`, `linkAccount`, `unlinkAccount` — traced directly against `@auth/core`'s `handleLoginOrRegister` source, not assumed) is implemented by hand instead, translating at the boundary each time. `createUser` also leaves `passwordHash` unset (the column is nullable specifically for this — an OAuth-only account has no password), so `authorize()`'s credentials path explicitly checks for a missing hash before attempting a `bcrypt.compare` against it.

Notification detection as three independent scheduled scripts, not one monolith (`db/notifications/detect-{barriers,tariff-changes,opportunity-changes}.ts`) — each scans `watchlist_items` for one specific kind of change and calls a shared `createNotification()` helper, which itself checks the target user's `notificationPreferences` (in-app on/off, per-category on/off) before writing a row, so a detection script never needs to know about user preferences itself. The opportunity-score detector re-reads and updates the tracked item's last-known score after notifying (`itemMeta.score`) so a re-run doesn't re-notify on a score that hasn't moved further — this exact mechanism was the source of a real duplicate-notification bug (see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)).

On-demand cache invalidation after a mutation the client might immediately navigate away from (`app/api/interests/route.ts`) — Next.js prefetches `<Link>`s automatically as they scroll into view and caches the prefetched RSC payload client-side for up to 5 minutes by default (`dynamic` staleTime), so a follow/unfollow that only ever refreshed its own page could still leave `/watchlists` (or a specific watchlist's detail page) showing pre-change data if it had been prefetched earlier in the session. Fixed by calling `revalidatePath()` on `/watchlists`, `/watchlists/[id]`, and `/dashboard` from the route handler itself right after the mutation — the next navigation to any of them re-fetches live data regardless of what was cached.

## 8. Limitations & Known Errors (and How They Were Fixed)

### Documented data limitations (by design, not oversight)

- No third-country trade data — KTIP holds only Kenya's own bilateral trade records; there's no UN Comtrade-style global dataset. This means the Opportunity Engine's "competitiveness" and "competition" scores are genuine, data-derived proxies (see [Section 7](#7-key-techniques--implementation-patterns)) rather than true measurements against rival exporting countries — clearly caveated in both the UI and the AI's system prompt, not hidden.
- No real freight/logistics data — the "logistics" score dimension uses EAC/COMESA trade-bloc membership as a stand-in for actual transit-time/freight-cost data.
- Mock data stands in for real agency feeds, with one partial exception — trade transactions, trade barriers, and exporter records are still entirely synthetically generated (structurally realistic, at real-world scale) pending an actual integration with KRA/KEPROBA/KEBS/EPZA/KenTrade/KPA systems. Tariffs are the one table with a real, working (if manually-triggered) path to genuine data: `tariffs.rateSource` distinguishes `"real"` from `"estimated"`, and the "Sync Real MFN Tariffs" job (see [Section 10](#10-automation--scheduled-jobs)) overwrites MFN rates for Kenya's actual major trading partners with real World Bank WITS/TRAINS figures, leaving everything else (preferential EAC/COMESA/AGOA/AfCFTA/EU-EPA rates, and MFN rates for minor partners) on the synthetic estimate. Seeded news articles link to a placeholder `example.com` URL and are labeled "Mock article" wherever shown, specifically so they're never confused with the real, live-ingested articles.
- News relevance filtering is heuristic, not semantic — the dual-regex approach materially improved on NewsAPI's raw boolean search (from ~90% noise down to a handful of clearly on-topic articles per fetch) but it's keyword-based, not an LLM classifier — a documented, deliberate cost/complexity trade-off, with LLM-based classification identified as a future upgrade path if warranted.
- Rate limiting is in-memory, per-instance — fine for a single self-hosted Node process; would need a Postgres- or Redis-backed limiter before running multiple instances.
- The Landed Cost Estimator's USD/KES conversion depends on a free, third-party forex API with no uptime guarantee — the page degrades gracefully (KES figures are omitted with a note) if it's unreachable, but the rate itself is indicative, not an authoritative customs valuation.
- Tariff-rate-change notifications are a documented stub — `detect-tariff-changes.ts` runs, queries tracked product/market pairs, and logs what it would check, but the actual notification-creation logic is commented out pending a tracked "previous rate" to diff against (currently only the *current* rate is stored, nothing historical). Barrier and opportunity-score-change notifications are fully live.
- The notification-detection and notification-email scripts (`pnpm notifications:detect`, `pnpm notifications:email`) are not yet wired to a GitHub Actions schedule the way the interest-alerts, news-fetch, and score jobs are — they exist and work (verified directly, not just by reading the code), but currently have to be triggered manually. See [Section 10](#10-automation--scheduled-jobs).

### Errors encountered during development, and their fixes

- Seed inserts intermittently failing against a 512MB size cap. Root cause: Neon's free-tier project storage limit (`throttle_or_fail_extension`). Fix: built a size-guard system (`checkSizeLimit`, `seedStopState`) that checks live DB size after every batch insert and halts generation cleanly before overshoot; scoring's `TRUNCATE` + `INSERT` split into two separate transactions to avoid a transient ~2x space spike.
- `pg_cron` needed for scheduled scoring, but unavailable. Root cause: confirmed directly (not just from docs) — `CREATE EXTENSION pg_cron` is rejected with `permission denied` even for the owning role on Neon's free plan. Fix: moved scheduling to GitHub Actions (`workflow_dispatch` + cron), which is also more portable across whatever host the app eventually deploys to.
- `.env` values not available when a seed script's later imports ran. Root cause: ES module imports hoist above interspersed code, so `import { config } from "dotenv"; config(...)` didn't actually run before the next import needed it. Fix: extracted env loading into a dedicated `db/seed/load-env.ts` side-effect module, imported first in every entry point.
- Random, seemingly unrelated "Failed query" errors deep in page code during dev. Root cause: Next.js Fast Refresh/Turbopack HMR re-executed `db/client.ts` on every save, creating a new `pg.Pool` each time without closing the old one, eventually exhausting Neon's connection limit. Fix: stashed the pool on `globalThis`, guarded by `NODE_ENV !== "production"`, so HMR reloads reuse the same pool within one Node process.
- Intermittent `ENETUNREACH`/`ETIMEDOUT` `AggregateError`s on random pages. Root cause: this sandbox (WSL2) has no real IPv6 route to Neon. `dns.setDefaultResultOrder("ipv4first")` alone only changes DNS lookup order — Node's Happy Eyeballs algorithm (default since Node 18) still races a parallel connection attempt on the next resolved address if the first hasn't connected within ~250ms, pulling in doomed IPv6 attempts under any latency. Fix: added `net.setDefaultAutoSelectFamily(false)` alongside the DNS fix, so Node tries addresses strictly in order instead of racing. Verified with 15 back-to-back requests against a previously-failing route with zero errors afterward.
- React 19 console warning: "Encountered a script tag while rendering React component." Root cause: `next-themes`' `ThemeProvider` (a Client Component) renders a blocking inline `<script>` to set the theme before hydration and avoid a flash of the wrong theme — it runs correctly as part of the server-rendered HTML, but React 19 warns on any `<script>` from a Client Component without distinguishing this legitimate case, and `next-themes` is unmaintained (no fix shipped). Fix: applied the documented community workaround — filter that one specific, dev-only `console.error` message.
- A Tailwind hover-ring effect silently did nothing. Root cause: constructed the class name dynamically as `` `hover:${style.ring}` `` at the usage site — Tailwind's compiler statically scans source text for complete class-name strings, and `"hover:ring-blue-500/30"` never appeared as one literal string anywhere in the file. Fix: pre-composed the full class string (`"hover:ring-blue-500/30"`) as a single literal value in the style-lookup object, so it appears intact for Tailwind's scanner regardless of which one gets selected at runtime.
- React Compiler lint failures (`react-hooks/refs`, `react-hooks/set-state-in-effect`). Root cause: stricter React 19 lint rules caught a `useRef`-based store pattern and a couple of effect-based `setState` calls that looked like cascading-render risks. Fix: `useState(() => makeStore())` for the store; `useSyncExternalStore` for one-time mount detection (theme toggle); a debounced search guarded on render instead of clearing state in an early-return branch (product search). One legitimate one-time localStorage-sync case in the AI Analyst chat kept its effect-based pattern with a scoped, justified `eslint-disable` rather than introducing a real SSR/hydration mismatch.
- Seeded product descriptions were nonsensical (e.g. "Coffee, tea, mate and spices – Sleek Chicken"). Root cause: `faker.commerce.product()` generates a generic random noun with no awareness of the HS chapter it was attached to. Fix: replaced with curated per-sector product name lists and backfilled all already-seeded rows in a single bulk update.
- The AI Analyst reported the trade barriers table as empty. Root cause: a genuine correctness signal, not a bug in the AI — `trade_barriers` genuinely had no seed function yet despite having a schema and a BI view. Fix: built the missing seed script and a backfill for data seeded before the gap was caught.
- NewsAPI's raw boolean search returned mostly irrelevant results. Root cause: matching "Kenya" and a trade keyword anywhere in an article's full stored text (not proximity-aware) — empirically tested and confirmed, not assumed. Fix: landed on a single boolean query for recall, plus a client-side dual-regex filter scoped to title+description only — verified to cut noise from ~90% down to a handful of clean, on-topic results per fetch.
- `drizzle-kit push` blocked on adding a `UNIQUE` constraint to `news_articles.source_url`. Root cause: the table already had 3,000 seeded rows; drizzle-kit's interactive TTY prompt (unavailable non-interactively) defaulted to suggesting a destructive truncate. Fix: verified zero duplicate `source_url` values existed first, applied the constraint directly via raw `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE` SQL, then re-ran `drizzle-kit push` to confirm the schema and database were back in sync.
- The Opportunity Leaderboard was unusable on a phone. Root cause: an 8-column table with only horizontal-scroll as a mobile fallback — comparing a row meant constant side-scrolling. Fix: added a stacked card view (overall score prominent, four sub-scores in a small grid) below the `sm` breakpoint, keeping the table for larger screens.
- Clicking a news article often didn't go anywhere real. Root cause: seeded mock articles use a placeholder `example.com` URL as a stand-in for a real source, which resolves to a generic placeholder page regardless of path. Fix: labeled every article sourced from that placeholder domain with a "Mock article" badge (kept clickable, since the placeholder link itself is harmless) so it's clear which articles are real, live-ingested coverage.
- Several ports converged to near-identical aggregate trade values (all six land border posts, both airports, both seaports pairwise), and the two Inland Container Depots had zero transactions, ever. Root cause: the seed generator picked a specific port uniformly at random within its type, independent of transaction value — over millions of rows this converges every port in a type toward an equal share purely by the law of large numbers — and never handled the `icd` port type at all. Fix: replaced the uniform pick with sourced, weighted port pools (real 2024/2025 published throughput figures for Port of Mombasa vs. Lamu Port and JKIA vs. Moi International; directional estimates, clearly labeled as such, for the six land borders and two ICDs — see the citations in `db/seed/04-transactions.ts`) and added the missing `icd` case.
- Correcting that port assignment on already-seeded data via an in-place `UPDATE` failed outright against Neon's 512MB project cap, even batched with `VACUUM` between batches. Root cause: Postgres's MVCC writes a new row version on every `UPDATE` rather than overwriting in place; plain `VACUUM` only reclaims trailing empty pages, and batching in ascending ID order never reaches the trailing pages until the whole table is done, so the bloat accumulates instead of getting reclaimed mid-run. Fix: `TRUNCATE` + a fresh `INSERT` via the corrected seed script instead of correcting rows in place — a clean rebuild carries none of the old-row-version overhead an `UPDATE` does — followed by recomputing `market_opportunity_scores`. Also added retry-wrapping around the transaction insert loop after a transient Neon connection drop killed one reseed attempt partway through.
- `<SignedIn>`/`<SignedOut>` crashed with "not available in @clerk/nextjs Core 3." Root cause: the installed `@clerk/nextjs` version (7.9.1) uses Clerk's newer "Core 3" component architecture, which replaced those two components with a single `<Show when="signed-in" fallback={...}>`. Fix: switched every conditional-auth-rendering call site to `<Show>` — the correct pattern was already shown in the Clerk setup instructions used to install it, so this was avoidable by following that literally instead of relying on a trained assumption about Clerk's API.
- Production deployment returned a 500 on every page after adding Clerk. Root cause: confirmed directly from Vercel's runtime logs (not assumed) — `@clerk/nextjs: Missing publishableKey`. The Clerk API keys only ever existed in the local, correctly-gitignored `.env.local`, which never reaches Vercel on its own. Fix: added the six Clerk env vars to Vercel's Production environment via the Vercel CLI (piping each value directly from `.env.local` into `vercel env add` so the secrets were never printed to a terminal or appear in this document), then redeployed.
- The interest-alert digest script logged "Sent digest to X" for an email that had actually failed to send. Root cause: the Resend SDK returns `{ data, error }` rather than throwing on a failed send (e.g. its sandbox-mode restriction on sending to unverified recipients) — the send call's result was never checked. Fix: check `error` before counting/logging a send as successful.
- The same digest script then failed with "Missing Clerk Secret Key" even though the key was present in `.env.local`. Root cause: the exact same ES-module import-ordering bug already documented above for seed scripts, reintroduced here — `import "../seed/load-env"` was placed after the `@clerk/nextjs/server` import instead of first, so Clerk's module read `process.env.CLERK_SECRET_KEY` before the env file had loaded it. Fix: moved the env-loading import to the top of the file, as the existing convention requires.
- A project-wide lint pass turned up two pre-existing `react/no-unescaped-entities` errors in `app/dashboards/page.tsx` (a literal `"` inside JSX text), unrelated to the session's own changes. Fix: escaped to `&ldquo;`/`&rdquo;`.
- Two people's parallel work replaced the same authentication subsystem in incompatible, incomplete ways at once — Clerk-based auth (with the interests/alerts feature built on it) plus a separate, more complete NextAuth.js migration, decided as the project's actual direction. Root cause: `package.json` had `@clerk/nextjs` removed and `next-auth`/`@auth/drizzle-adapter`/`bcryptjs` added, but `pnpm install` had never been run, so the app couldn't even start; separately, seven files (interests API/page, trade-analyst gate, the analyst chat UI, the alert digest script, both old Clerk sign-in/sign-up pages) still imported from `@clerk/nextjs`. Fix: installed the missing dependencies, deleted the orphaned Clerk pages (superseded by NextAuth's own `/auth/signin`/`/auth/signup`), and migrated every Clerk call site to `auth()` from `lib/auth.ts` — including re-pointing `user_interests` from a Clerk identity string to a real foreign key on `users.id`, now that genuine local user rows exist. The alert digest script actually simplified as a result: user email now comes from a direct query against `users` instead of an external API call.
- The same parallel `drizzle-kit push` that introduced NextAuth's tables also silently dropped every `vw_*` BI view and the `user_interests` table — `drizzle-kit push` only manages tables it knows about from committed schema files, and has no awareness of the separately-applied views; when it needs to alter a table a view depends on, Postgres drops the dependent view first, and nothing recreates it afterward. Fix: reran `pnpm db:views` to restore the views (zero data was lost — only the views existed, not the underlying data) and recreated `user_interests` directly via SQL once its schema changed to match the new NextAuth-based user reference. (`user_interests` was itself later retired entirely — see the watchlists-consolidation entry below.)
- `declare module "next-auth/jwt"` failed with "Invalid module name in augmentation, module 'next-auth/jwt' cannot be found," despite a plain `import type` of the exact same specifier resolving fine. Root cause: that module's `.d.ts` in the installed `next-auth@5.0.0-beta.32` is a bare `export * from "@auth/core/jwt"` re-export with no other content, and TypeScript's ambient `declare module` augmentation can't resolve subpath-exports packages shaped that way — a real limitation of the installed beta, not a mistake in the augmentation syntax. Fix: dropped the augmentation attempt; `JWT`'s real shape (`Record<string, unknown> & DefaultJWT`) already permits writing custom fields onto it without any augmentation, and reading them back out uses a narrow, explicitly-commented cast instead.
- Four pages (`/watchlists`, `/watchlists/[id]`, `/profile`, `/dashboard`) and nine API route handlers crashed to a generic 500 for any signed-out visitor. Root cause: they used `requireAuth()` — which `throw`s a plain `Error("Unauthorized")` — directly in a Server Component or inside a `try/catch` whose `catch` block treated every error identically, including this one. Fix: pages switched to `auth()` + an explicit `redirect("/auth/signin")`; API routes got a shared `isUnauthorizedError()` helper checked first in every catch block, returning 401 instead of falling through to the generic 500.
- Watchlist HS-code badges silently never rendered, and a "sector" field on tracked items was always empty. Root cause: the schema's own declared `itemMeta` type said `sectorName`, but every real call site (`AddToWatchlist` usages across Explorer, Opportunities, etc., checked directly rather than assumed) actually writes `sector` — and separately, the render code read `.code` where the real field was `hsCode`. Fix: aligned both the schema's declared shape and the render code to the field names every call site actually uses.
- Wiring up Google/LinkedIn/GitHub/Facebook sign-in surfaced that `@auth/drizzle-adapter`'s generic implementation is fundamentally incompatible with this project's pre-existing `users` table (see [Section 7](#7-key-techniques--implementation-patterns) for the full mismatch). This had been silently dormant the whole time the Credentials-only provider was in place, since Credentials sign-in never touches adapter methods at all — only exercised, and only then caught, once OAuth sign-in started actually calling `getUserByAccount`/`createUser`/`linkAccount`. Fix: replaced it with a hand-written `Adapter`; verified end-to-end with a script exercising every real code path (new OAuth user, returning OAuth user, and — the one that actually matters for correctness — an existing password-based user's role and data being preserved when they sign in via OAuth for the first time with the same email) directly against the live database, not just by reading the code.
- All seven new notification-system scripts failed immediately with "DATABASE_URL is not set," despite the value being present in `.env.local`. Root cause: they loaded env vars via a bare `import "dotenv/config"` (which reads `.env`, a file that doesn't exist in this project) instead of the project's own established `db/seed/load-env.ts` convention (which explicitly targets `.env.local`) — the same class of "wrong file" env-loading mistake as the import-*ordering* bug documented earlier in this section, just a different flavor of it. Fix: switched every script to the established loader.
- `detect-opportunity-changes.ts` created a duplicate notification every time it ran, for the same score change, instead of only once. Root cause: after creating a notification, the script updates the tracked item's stored score so a re-run has nothing new to report — but the `UPDATE ... WHERE` clause compared `watchlistItems.id` against `watchlistItems.itemId` (the polymorphic reference to the *opportunity*, not the watchlist-item row's own primary key), so the write matched zero rows and silently never persisted. Confirmed live: three duplicate notifications had already accumulated in the database for one real, non-test user before the fix. Fix: selected and compared against the watchlist item's actual row ID; verified with two consecutive runs, the second producing zero new notifications for the same underlying data.
- The notification email digest's hourly/daily/weekly windows were backwards — `send-emails.ts` used `lte(createdAt, lookbackStart)` ("older than the window") in all three digest queries where `gte` ("since the window started") was clearly intended, per both the surrounding comments and the established `gte`-based convention already used in the interest-alerts script. As written, it would only ever surface notifications *older* than the lookback period, never recent ones. Fix: corrected all three to `gte`.
- A user's chosen email-digest frequency was silently ignored — every new signup always got immediate-style emails regardless of what they'd have picked. Root cause: a field-name typo repeated in three places (the schema, the signup route's default preferences, and nowhere else) declared `frequency: "realtime"`, but the preferences UI and the email script both actually read/write `emailFrequency: "immediate"` — since this is a JSONB column with no compile-time schema enforcement, the mismatch never surfaced as an error until the schema's own type was corrected and TypeScript immediately flagged the now-provably-wrong signup route. Fix: renamed the field consistently everywhere it's touched.
- Two features doing the same job in two different tables — `/interests` (follow a sector/country for the alert digest) predated and duplicated part of what `/watchlists` does. Fix: added `"sector"` as a valid `watchlist_items.itemType`, retired the standalone `user_interests` table and its schema file, and rewrote `/interests` and its API route as a thin adapter over `watchlist_items` — an auto-provisioned "My Interests" watchlist backs the picker, so a sector/country followed there also shows up in the ordinary watchlist UI. The live `user_interests` table itself (found empty at consolidation time — nothing to migrate) was left in place rather than dropped, since dropping a live production table is a genuinely destructive action this session's tooling is deliberately blocked from taking unilaterally; it's flagged as safe-to-remove cleanup in this document's improvements list rather than actioned automatically.
- A watchlist section heading read "Countrys" (and, less obviously, "Opportunitys"). Root cause: the label was generated by naively appending `"s"` to the item type name, which breaks for any word ending in "y". Fix: replaced with an explicit label map for the six known item types instead of a pluralization rule.
- `/profile` sent a signed-in user's own bcrypt password hash to their browser. Root cause: the Server Component queried `db.select().from(users)` (every column, including `passwordHash`) and passed that raw row straight through as a prop into `<ProfileView>`, a Client Component — Next.js serializes the actual JS object across the Server-to-Client boundary, not just whatever subset a TypeScript prop interface happens to declare, so the hash rode along in the RSC payload regardless of what `ProfileView`'s own `User` type said. Confirmed live against a real signed-in test user (the hash was found intact in the page's rendered HTML), not just inferred from reading the code. Fix: replaced the query with an explicit column projection, then destructured `passwordHash` back out before constructing the object actually passed down, replacing it with a derived `hasPassword: boolean` — re-verified with a fresh test user that the leak was gone.
- The interest-alert digest and the per-item notification system could both email a user about the exact same trade barrier. Root cause: a country follow via `/interests` and a tracked country via `/watchlists` are the same underlying `watchlist_items` row (`itemType: "country"`, per the consolidation above) — `detect-barriers.ts` already notifies per-item for a new barrier in a followed country, while `send-interest-alerts.ts` independently matched barriers against the same followed countries for its own digest, so every country follow was double-alerted for every barrier. Sector follows have no such overlap (`detect-barriers.ts` never checks `itemType: "sector"`), and news has no equivalent in the per-item system at all. Fix: restricted `send-interest-alerts.ts`'s barrier matching to sector-only, leaving news matching on both sector and country unchanged; verified with constructed test data that a country-only-matched barrier is now correctly excluded from the digest while a sector-matched one still triggers a send.
- A repo-wide lint pass flagged a `<head>` element in a TanStack Start template file under `.agents/skills/`, as if it were a Next.js page. Root cause: that directory is bundled reference material (Clerk integration guides/templates for other frameworks — Astro, TanStack, Vue, etc.), not part of this app, but ESLint had no exclusion for it, so Next.js's `no-head-element` rule ran against code where `<head>` is actually the correct, required pattern. Separately, `detect-tariff-changes.ts`'s per-item loop ran two real DB queries every iteration whose results (`tariff`, `affectedUsers`) were only ever read by the commented-out notification logic further down — a discarded round trip on every run, not just an unused-variable warning. Fix: added `.agents/**` to `eslint.config.mjs`'s `globalIgnores`, and removed the two dead queries (and their now-unused imports) from the tariff-change stub, keeping the "waiting on historical rate tracking" explanation as a comment instead of live code.
- An OAuth sign-in never went through onboarding at all — a first-time Google/LinkedIn/GitHub/Facebook user landed straight on the homepage, still on the schema's default `role: "public"`, with no `user_profiles` row and no way to ever pick `exporter`/`importer` afterward (the profile-edit form only edits fields for a user's *existing* role — there was no path to changing the role itself). Root cause: `components/auth/oauth-buttons.tsx` passed `signIn(provider, { callbackUrl })` straight to the final destination (`"/"` by default), and `/onboarding` — the only page with any role/profile-completeness logic — was reachable only via an explicit `router.push("/onboarding")` the credentials *signup* page did right after registering; nothing routed an OAuth sign-in through it. Fix: `OAuthButtons` now always sends the provider through `/onboarding?next=<original callbackUrl>` instead; `/onboarding` itself already had (and still has) the logic to redirect an already-onboarded user straight on to `next`, so this adds no extra step for a returning user and, for a brand-new one, correctly stops at an account-type picker first. Verified live end-to-end with a simulated OAuth account (no password, no profile row, matching exactly what `createUser` in `lib/auth.ts` produces): hitting `/onboarding` rendered the picker, choosing "importer" updated `users.role` and provisioned the profile row, the business-details form appeared next with importer-specific copy, submitting it redirected to `/dashboard`, and a repeat visit to `/onboarding` (and to `/onboarding?next=/watchlists` for a `public`-choosing account) correctly redirected straight through without re-prompting.
- Deciding "no `user_profiles` row" as the specific signal for "hasn't chosen an account type yet" (rather than checking the role) mattered because both a credentials `public` signup and a not-yet-onboarded OAuth account share `role: "public"` — but only the OAuth one has no profile row, since credentials signup provisions one immediately regardless of role chosen. Using the role instead would have shown the account-type picker to already-legitimate `public` credentials users too.

## 9. Getting Started (Local Development)

Prerequisites: Node.js 24, pnpm, a Neon (or any) Postgres connection string, an Anthropic API key, and (optionally, for live news ingestion) a NewsAPI.org API key.

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Configure environment — create `.env.local` (git-ignored) in the project root:

   ```bash
   DATABASE_URL="postgresql://user:password@host/db?sslmode=verify-full"
   ANTHROPIC_API_KEY="sk-ant-..."
   AUTH_SECRET="..."    # required — generate with `openssl rand -base64 32`
   NEWS_API_KEY="..."   # optional — only needed for `pnpm news:fetch`
   RESEND_API_KEY="..." # optional — only needed for `pnpm alerts:send` and `pnpm notifications:email`

   # OAuth sign-in — all optional; a provider with no credentials set is
   # simply unusable without affecting the others or credentials sign-in.
   # Auth.js infers these automatically from each provider's id (see
   # Section 7); register an app with each provider's own developer
   # console to get a client ID/secret.
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   AUTH_LINKEDIN_ID="..."
   AUTH_LINKEDIN_SECRET="..."
   AUTH_GITHUB_ID="..."
   AUTH_GITHUB_SECRET="..."
   AUTH_FACEBOOK_ID="..."
   AUTH_FACEBOOK_SECRET="..."
   ```

3. Push the schema to your database

   ```bash
   pnpm db:push
   ```

4. Seed mock data (large — respects a size guard against free-tier storage caps)

   ```bash
   pnpm db:seed
   ```

5. Compute Market Opportunity scores

   ```bash
   pnpm db:score
   ```

6. Apply the BI views (optional, only needed if pointing an external BI tool at the database)

   ```bash
   pnpm db:views
   ```

7. Run the dev server

   ```bash
   pnpm dev
   ```

   Then open [http://localhost:3000](http://localhost:3000).

### Scripts reference

- `pnpm dev` — starts the Next.js dev server (Turbopack).
- `pnpm build` / `pnpm start` — production build and serve.
- `pnpm lint` — runs ESLint (includes React Compiler rules).
- `pnpm db:push` — syncs the live database schema to match `db/schema/*.ts`.
- `pnpm db:studio` — opens Drizzle Studio against the configured database.
- `pnpm db:seed` — seeds the full mock dataset (idempotent size-guarded batches).
- `pnpm db:views` — applies/refreshes the `vw_*` BI views.
- `pnpm db:score` — recomputes `market_opportunity_scores` from live transaction/tariff/barrier/exporter data.
- `pnpm news:fetch` — runs one pass of the NewsAPI ingestion pipeline.
- `pnpm tariffs:sync-real` — overwrites MFN tariff rows for Kenya's major trading partners with real World Bank WITS/TRAINS rates (resumable; see [Section 10](#10-automation--scheduled-jobs)).
- `pnpm alerts:send` — sends the interest-alert email digest (new barriers/news matching followed sectors/countries).
- `pnpm notifications:detect` — runs all three notification-detection scripts (barriers, tariff changes, opportunity-score changes) against tracked watchlist items.
- `pnpm notifications:email` — sends notification emails (immediate/daily/weekly per user preference) for users who've opted into the email channel.
- `pnpm eval:trade-analyst` — runs a lightweight real-API regression smoke test against the AI Trade Analyst.

## 10. Automation / Scheduled Jobs

All five jobs below run as GitHub Actions on a schedule (chosen after confirming `pg_cron` isn't available on Neon's free tier — see [Section 8](#8-limitations--known-errors-and-how-they-were-fixed)) and can also be triggered manually from the repository's Actions tab.

- Recompute Market Opportunity Scores (`.github/workflows/recompute-opportunity-scores.yml`) — runs daily at 03:00 UTC. Keeps the Opportunity Leaderboard current as underlying transaction/tariff/barrier data changes. Requires the `DATABASE_URL` secret.
- Fetch Trade News (`.github/workflows/fetch-trade-news.yml`) — runs every 6 hours. Pulls new, relevance-filtered Kenya trade news from NewsAPI.org into `news_articles`. Requires the `DATABASE_URL` and `NEWS_API_KEY` secrets.
- Send Interest Alerts (`.github/workflows/send-interest-alerts.yml`) — runs daily at 06:00 UTC. Emails each user a digest of new trade barriers and news matching their followed sectors/markets (see [Section 6.11](#611-my-interests--watchlists-watchlists-interests)). Requires the `DATABASE_URL` and `RESEND_API_KEY` secrets — recipient emails come from a direct query against `users`, no separate identity-provider secret needed.
- Notification Pipeline (`.github/workflows/notification-pipeline.yml`) — runs hourly (`0 * * * *`). Runs `pnpm notifications:detect` then `pnpm notifications:email` in sequence, so a barrier/tariff/opportunity change is detected and (for users who've opted into the email channel) emailed within the hour. Requires the `DATABASE_URL` and `RESEND_API_KEY` secrets.
- Sync Real MFN Tariffs (`.github/workflows/sync-real-tariffs.yml`) — runs monthly at 04:00 UTC on the 1st, 340-minute timeout, `concurrency`-guarded so a manual trigger can't overlap a run already in progress. Overwrites MFN tariff rows for Kenya's actual major trading partners with real World Bank WITS/TRAINS rates — a single WITS request measured at ~5 seconds, times ~1,300 products × ~20 partner countries, means a full run genuinely takes hours. Resumable: skips product/country pairs already marked `rateSource: "real"` from a previous run, so re-triggering after a timeout or failure (or the next month's scheduled run) picks up where it left off rather than starting over — and a "no data" result is never permanently remembered as unfetchable, since WITS reporting lag means the same pair can genuinely gain coverage in a later run. Monthly rather than daily/weekly like the other jobs, since MFN tariff schedules themselves change on a roughly annual cadence, not daily. Requires the `DATABASE_URL` secret.

## 11. External Analytics: InsightGrid

InsightGrid is the organization's existing BI/analytics tool, and general trend dashboards, cross-cutting analytics, and visual reporting are deliberately not built inside this platform — building that here would duplicate work the organization already has a dedicated tool for. Instead, KTIP's database exposes a purpose-built integration surface for exactly this:

Seven read-only SQL views (`db/views/bi-views.sql`, applied with `pnpm db:views`) — plain views with zero storage cost, never materialized, so they always reflect live data:

- `vw_trade_transactions` — every transaction joined out to product, sector, country (with region/bloc-membership flags and an ISO-3 code for map-based tools), port, and source agency, with calendar month pre-extracted (independent of year) for seasonality analysis — the main fact table InsightGrid would query most heavily.
- `vw_market_opportunity` — every opportunity score joined to its product/sector/country, with all seven score dimensions as columns.
- `vw_tariffs` — every tariff rate joined to product, country, and the trade agreement (if any) it derives from, with a rate_source column distinguishing a real, WITS-sourced rate from an estimated one.
- `vw_trade_barriers` — every barrier joined to product, country, and the reporting agency.
- `vw_news_articles` — every article joined to its related product/country, with an is_mock flag so a chart never silently mixes seeded mock volume with real, live-ingested coverage.
- `vw_procedures` — every procedure joined to its sector and lead agency, with step count pre-computed.
- `vw_exporters` — every exporter joined to county, sector, and primary product, with certifications and export-readiness.

No joins are required on InsightGrid's side — every view is already fully denormalized with human-readable names (not just foreign keys), so it can be pointed at directly as a flat dataset.

The one deliberate exception to this boundary is the Market Opportunity Engine's scoring logic (`market_opportunity_scores`, [Section 7](#7-key-techniques--implementation-patterns)): rather than leaving it as a placeholder for InsightGrid to eventually compute, it was brought in-repo as real, documented SQL, because it's core product logic several of KTIP's own features (the Leaderboard, the Explorer, the AI Analyst) depend on directly — not general-purpose analytics. `vw_market_opportunity` still exposes the results of that computation to InsightGrid like any other view.

To connect InsightGrid, point it at the same `DATABASE_URL` used by this application (ideally via a read-only role) and configure its datasets against the `vw_*` views listed above rather than the underlying normalized tables.
