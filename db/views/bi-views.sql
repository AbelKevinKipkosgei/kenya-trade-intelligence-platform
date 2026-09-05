-- Flattened, denormalized views over the star-schema tables, for BI
-- tools (Superset-style) to point at as a single "dataset" without every
-- chart needing its own joins. These are plain SQL views — zero storage
-- cost — never materialized, so they always reflect live data and never
-- count against Neon's project size cap.

CREATE OR REPLACE VIEW vw_trade_transactions AS
SELECT
  tt.id,
  tt.transaction_date,
  date_trunc('year', tt.transaction_date)::date AS transaction_year,
  tt.flow_type,
  p.id AS product_id,
  p.hs_code,
  p.description AS product_description,
  s.name AS sector_name,
  c.id AS country_id,
  c.name AS country_name,
  c.region AS country_region,
  c.is_eac_member,
  c.is_comesa_member,
  pt.name AS port_name,
  pt.type AS port_type,
  tt.value_usd,
  tt.quantity,
  tt.unit,
  a.name AS source_agency
FROM trade_transactions tt
JOIN products p ON p.id = tt.product_id
JOIN sectors s ON s.id = p.sector_id
JOIN countries c ON c.id = tt.country_id
LEFT JOIN ports pt ON pt.id = tt.port_id
JOIN agencies a ON a.id = tt.source_agency_id;

CREATE OR REPLACE VIEW vw_market_opportunity AS
SELECT
  mos.id,
  mos.period,
  p.id AS product_id,
  p.hs_code,
  p.description AS product_description,
  s.name AS sector_name,
  c.id AS country_id,
  c.name AS country_name,
  c.region AS country_region,
  mos.demand_score,
  mos.growth_score,
  mos.competitiveness_score,
  mos.market_access_score,
  mos.competition_score,
  mos.logistics_score,
  mos.domestic_capacity_score,
  mos.overall_score
FROM market_opportunity_scores mos
JOIN products p ON p.id = mos.product_id
JOIN sectors s ON s.id = p.sector_id
JOIN countries c ON c.id = mos.country_id;

CREATE OR REPLACE VIEW vw_tariffs AS
SELECT
  t.id,
  p.hs_code,
  p.description AS product_description,
  s.name AS sector_name,
  c.name AS country_name,
  c.region AS country_region,
  ta.code AS agreement_code,
  ta.name AS agreement_name,
  t.rate_percent,
  t.rate_type,
  t.effective_from,
  t.effective_to,
  ag.name AS source_agency
FROM tariffs t
JOIN products p ON p.id = t.product_id
JOIN sectors s ON s.id = p.sector_id
JOIN countries c ON c.id = t.country_id
LEFT JOIN trade_agreements ta ON ta.id = t.agreement_id
JOIN agencies ag ON ag.id = t.source_agency_id;

CREATE OR REPLACE VIEW vw_trade_barriers AS
SELECT
  tb.id,
  p.hs_code,
  p.description AS product_description,
  s.name AS sector_name,
  c.name AS country_name,
  c.region AS country_region,
  tb.barrier_type,
  tb.description,
  tb.status,
  tb.impact_level,
  tb.reported_date,
  tb.resolved_date,
  ag.name AS source_agency
FROM trade_barriers tb
LEFT JOIN products p ON p.id = tb.product_id
LEFT JOIN sectors s ON s.id = p.sector_id
JOIN countries c ON c.id = tb.country_id
JOIN agencies ag ON ag.id = tb.source_agency_id;

CREATE OR REPLACE VIEW vw_procedures AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.category,
  s.name AS sector_name,
  p.summary,
  p.steps,
  jsonb_array_length(p.steps) AS step_count,
  p.estimated_total_days,
  a.name AS lead_agency,
  p.last_updated
FROM procedures p
LEFT JOIN sectors s ON s.id = p.sector_id
JOIN agencies a ON a.id = p.lead_agency_id;

CREATE OR REPLACE VIEW vw_exporters AS
SELECT
  e.id,
  e.name,
  co.name AS county_name,
  co.region AS county_region,
  s.name AS sector_name,
  p.hs_code AS primary_product_hs_code,
  p.description AS primary_product_description,
  e.employees_count,
  e.annual_capacity,
  e.capacity_unit,
  e.certifications,
  e.export_ready,
  ag.name AS registered_with_agency
FROM exporters e
JOIN counties co ON co.id = e.county_id
JOIN sectors s ON s.id = e.sector_id
JOIN products p ON p.id = e.primary_product_id
LEFT JOIN agencies ag ON ag.id = e.registered_with_agency_id;
