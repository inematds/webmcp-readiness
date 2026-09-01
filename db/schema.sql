CREATE TABLE IF NOT EXISTS scan_results (
  id BIGSERIAL PRIMARY KEY,
  site TEXT NOT NULL,
  overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  webmcp_score SMALLINT NOT NULL CHECK (webmcp_score BETWEEN 0 AND 100),
  seo_score SMALLINT NOT NULL CHECK (seo_score BETWEEN 0 AND 100),
  geo_score SMALLINT NOT NULL CHECK (geo_score BETWEEN 0 AND 100),
  aeo_score SMALLINT NOT NULL CHECK (aeo_score BETWEEN 0 AND 100),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_results_analyzed_at_idx
  ON scan_results (analyzed_at DESC);

CREATE INDEX IF NOT EXISTS scan_results_site_idx
  ON scan_results (site);
