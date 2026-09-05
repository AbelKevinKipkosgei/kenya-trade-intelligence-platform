-- Computes market_opportunity_scores for real, from the actual data in
-- trade_transactions/tariffs/trade_barriers/exporters, instead of the
-- random placeholder values the seed pipeline used to generate. Run after
-- any reseed of trade_transactions (pnpm db:score).
--
-- IMPORTANT DATA-AVAILABILITY CAVEAT: KTIP only holds Kenya's own bilateral
-- trade records — there's no third-country/global trade dataset here (e.g.
-- UN Comtrade). That means "competitiveness" and "competition" can't be
-- measured against rival exporting countries the way a real Market
-- Opportunity Engine ideally would. Every score below is a genuine,
-- data-derived proxy — not invented — but the specific proxy chosen for
-- each dimension is documented inline so it's clear what it actually
-- measures versus what the concept doc's dimension name implies.

-- NOTE: the TRUNCATE is issued separately by run.ts, as its own committed
-- statement, before this file runs — not bundled into the same implicit
-- transaction as the INSERT below. Doing both atomically would make
-- Postgres hold space for the old (not-yet-reclaimed) and new rows at the
-- same time until commit, a transient ~2x spike against Neon's size cap.

WITH quarterly_exports AS (
  -- Kenya's export value to this country for this product, by quarter.
  SELECT
    product_id,
    country_id,
    date_trunc('quarter', transaction_date)::date AS period,
    SUM(value_usd) AS export_value
  FROM trade_transactions
  WHERE flow_type = 'export'
  GROUP BY product_id, country_id, date_trunc('quarter', transaction_date)
),
growth AS (
  -- Quarter-over-quarter change for this exact product+country pair.
  -- Computed over full history (not yet scope-limited) so the oldest kept
  -- quarter below still gets an accurate comparison against its real
  -- predecessor, not a false "no prior data" default.
  SELECT
    *,
    LAG(export_value) OVER (PARTITION BY product_id, country_id ORDER BY period) AS prev_value
  FROM quarterly_exports
),
recent_periods AS (
  -- Match the Opportunities page's own period picker (last 12 quarters) —
  -- scoring further back than the UI ever surfaces is wasted storage
  -- against Neon's project size cap.
  SELECT DISTINCT period FROM quarterly_exports ORDER BY period DESC LIMIT 12
),
ranked AS (
  SELECT
    g.*,
    -- Demand proxy: how large this opportunity is in absolute terms,
    -- relative to every other product-country pair Kenya traded that
    -- same quarter (cross-sectional size, not true global import demand).
    percent_rank() OVER (PARTITION BY period ORDER BY export_value) AS demand_pct,
    -- Competitiveness proxy: how well this product performs in THIS
    -- country specifically, relative to Kenya's other products sold into
    -- the same country that quarter (i.e. "is this one of Kenya's
    -- stronger product lines in this particular market"), not competitive
    -- standing against other exporting nations (data we don't have).
    percent_rank() OVER (PARTITION BY period, country_id ORDER BY export_value) AS competitiveness_pct
  FROM growth g
  WHERE g.period IN (SELECT period FROM recent_periods)
),
best_tariff AS (
  -- Best (lowest) rate Kenya's exporters actually face for this pair —
  -- the real market_access driver: MFN vs any preferential agreement.
  SELECT product_id, country_id, MIN(rate_percent) AS best_rate
  FROM tariffs
  GROUP BY product_id, country_id
),
barrier_penalty AS (
  -- Active non-tariff friction Kenya's own agencies have flagged for this
  -- pair, weighted by severity.
  SELECT
    product_id,
    country_id,
    SUM(CASE impact_level WHEN 'high' THEN 30 WHEN 'medium' THEN 15 WHEN 'low' THEN 5 ELSE 0 END) AS penalty
  FROM trade_barriers
  WHERE status = 'active'
  GROUP BY product_id, country_id
),
capacity AS (
  -- Domestic capacity proxy: registered, export-ready supply for this
  -- product (capacity to supply is product-specific, not country-specific
  -- in this data model, so this doesn't vary by destination market).
  SELECT
    primary_product_id AS product_id,
    COUNT(*) FILTER (WHERE export_ready) AS ready_count,
    COALESCE(SUM(annual_capacity) FILTER (WHERE export_ready), 0) AS ready_capacity
  FROM exporters
  GROUP BY primary_product_id
),
capacity_ranked AS (
  SELECT
    product_id,
    percent_rank() OVER (ORDER BY ready_capacity * (1 + ready_count)) AS capacity_pct
  FROM capacity
),
scored AS (
  SELECT
    r.product_id,
    r.country_id,
    r.period,
    (r.demand_pct * 100) AS demand_score,
    GREATEST(0, LEAST(100,
      50 + COALESCE((r.export_value - r.prev_value) / NULLIF(r.prev_value, 0) * 100, 0)
    )) AS growth_score,
    (r.competitiveness_pct * 100) AS competitiveness_score,
    -- Market access: 0% tariff -> 100, 35%+ tariff -> 0. No tariff record
    -- for the pair falls back to a neutral midpoint rather than 0 or 100.
    GREATEST(0, 100 - LEAST(COALESCE(bt.best_rate, 17.5), 35) / 35 * 100) AS market_access_score,
    -- "Competition" proxy: absence of flagged trade friction. This measures
    -- barrier-driven friction, not rival-supplier competition (unmeasurable
    -- without third-country data) — see the file header caveat.
    GREATEST(0, 100 - COALESCE(bp.penalty, 0)) AS competition_score,
    -- Logistics proxy: regional trade-bloc proximity as a stand-in for
    -- real transit-time/freight-cost data, which KTIP doesn't hold. EAC
    -- members are typically reachable overland; COMESA members get a
    -- partial bonus; everyone else assumes sea/air freight.
    (CASE WHEN c.is_eac_member THEN 85 WHEN c.is_comesa_member THEN 65 ELSE 40 END)::numeric AS logistics_score,
    -- No exporters registered for a product yet isn't proof capacity is
    -- impossible, just unregistered — default to a low-but-not-zero score.
    COALESCE(cr.capacity_pct * 100, 20) AS domestic_capacity_score
  FROM ranked r
  JOIN countries c ON c.id = r.country_id
  LEFT JOIN best_tariff bt ON bt.product_id = r.product_id AND bt.country_id = r.country_id
  LEFT JOIN barrier_penalty bp ON bp.product_id = r.product_id AND bp.country_id = r.country_id
  LEFT JOIN capacity_ranked cr ON cr.product_id = r.product_id
)
INSERT INTO market_opportunity_scores (
  product_id, country_id, period,
  demand_score, growth_score, competitiveness_score, market_access_score,
  competition_score, logistics_score, domestic_capacity_score, overall_score
)
SELECT
  product_id,
  country_id,
  period,
  ROUND(demand_score::numeric, 2),
  ROUND(growth_score::numeric, 2),
  ROUND(competitiveness_score::numeric, 2),
  ROUND(market_access_score::numeric, 2),
  ROUND(competition_score::numeric, 2),
  ROUND(logistics_score::numeric, 2),
  ROUND(domestic_capacity_score::numeric, 2),
  ROUND((
    (demand_score + growth_score + competitiveness_score + market_access_score
     + competition_score + logistics_score + domestic_capacity_score) / 7
  )::numeric, 2)
FROM scored;
