import test from "node:test";
import assert from "node:assert/strict";
import { createScanLogEntry, recordScanLog } from "../lib/scan-log.mjs";

const categories = {
  webmcp: { score: 62.4 },
  seo: { score: 81.8 },
  geo: { score: 70 },
  aeo: { score: 76.2 }
};

test("registra a origem normalizada e as cinco pontuações", () => {
  const entry = createScanLogEntry({
    requestedUrl: "https://example.com/entrada?token=segredo",
    finalUrl: "https://www.example.com/curso/aula?utm_source=teste#topo",
    score: 73.4,
    categories,
    title: "Este campo não pode aparecer"
  });

  assert.deepEqual(entry, {
    site: "https://www.example.com",
    scores: {
      geral: 73,
      webmcp: 62,
      seo: 82,
      geo: 70,
      aeo: 76
    }
  });
});

test("escreve uma única linha JSON sem detalhes do relatório", () => {
  const lines = [];
  const recorded = recordScanLog({
    finalUrl: "https://example.com/privado?id=123",
    score: 88,
    categories,
    findings: [{ title: "não registrar" }]
  }, (line) => lines.push(line));

  assert.equal(recorded, true);
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]), {
    site: "https://example.com",
    scores: {
      geral: 88,
      webmcp: 62,
      seo: 82,
      geo: 70,
      aeo: 76
    }
  });
  assert.equal(lines[0].includes("privado"), false);
  assert.equal(lines[0].includes("findings"), false);
});

test("não registra dados inválidos", () => {
  assert.equal(createScanLogEntry({ finalUrl: "não é uma URL", score: 50, categories }), null);
  assert.equal(createScanLogEntry({ finalUrl: "https://example.com", score: 101, categories }), null);
  assert.equal(createScanLogEntry({ finalUrl: "https://example.com", score: 50 }), null);
  assert.equal(recordScanLog(null, () => assert.fail("não deveria escrever")), false);
});
