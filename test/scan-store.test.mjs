import test from "node:test";
import assert from "node:assert/strict";
import { persistScanResult } from "../lib/scan-store.mjs";

const report = {
  finalUrl: "https://example.com/curso?utm_source=teste",
  analyzedAt: "2026-08-31T12:30:00.000Z",
  score: 73,
  categories: {
    webmcp: { score: 62 },
    seo: { score: 82 },
    geo: { score: 70 },
    aeo: { score: 76 }
  }
};

test("grava domínio, cinco notas e data usando parâmetros SQL", async () => {
  const calls = [];
  const result = await persistScanResult(report, {
    query: async (statement, values) => calls.push({ statement, values })
  });

  assert.deepEqual(result, { stored: true });
  assert.equal(calls.length, 1);
  assert.match(calls[0].statement, /INSERT INTO scan_results/);
  assert.deepEqual(calls[0].values, [
    "https://example.com",
    73,
    62,
    82,
    70,
    76,
    "2026-08-31T12:30:00.000Z"
  ]);
});

test("informa quando o banco ainda não foi conectado", async () => {
  const result = await persistScanResult(report, { databaseUrl: "" });
  assert.deepEqual(result, {
    stored: false,
    reason: "database_not_configured"
  });
});

test("recusa relatório incompleto antes de consultar o banco", async () => {
  const result = await persistScanResult({ finalUrl: "https://example.com", score: 50 }, {
    query: async () => assert.fail("não deveria consultar o banco")
  });
  assert.deepEqual(result, { stored: false, reason: "invalid_report" });
});
