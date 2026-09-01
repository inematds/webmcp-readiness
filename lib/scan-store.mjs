import { neon } from "@neondatabase/serverless";
import { createScanLogEntry } from "./scan-log.mjs";

const INSERT_SCAN = `
  INSERT INTO scan_results (
    site,
    overall_score,
    webmcp_score,
    seo_score,
    geo_score,
    aeo_score,
    analyzed_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
`;

function normalizeAnalyzedAt(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export async function persistScanResult(report, options = {}) {
  const entry = createScanLogEntry(report);
  if (!entry) return { stored: false, reason: "invalid_report" };

  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl && !options.query) {
    return { stored: false, reason: "database_not_configured" };
  }

  const sql = options.query ? null : neon(databaseUrl);
  const query = options.query || ((statement, values) => sql.query(statement, values));
  const { scores } = entry;
  await query(INSERT_SCAN, [
    entry.site,
    scores.geral,
    scores.webmcp,
    scores.seo,
    scores.geo,
    scores.aeo,
    normalizeAnalyzedAt(report.analyzedAt)
  ]);

  return { stored: true };
}
