import assert from "node:assert/strict";
import test from "node:test";
import { buildDiagnostic } from "../lib/audit-rules.mjs";

function fixture({ llmsFound = false } = {}) {
  return {
    observed: {
      title: "Guia técnico de WebMCP para aplicações modernas",
      finalUrl: "https://example.com/guia",
      secureContext: true,
      modelContextAvailable: true,
      declarativeForms: [{ name: "consultar_pedido", description: "Consulta um pedido sem alterar os dados.", fields: [{ name: "codigo", description: "Código público do pedido." }], annotations: {} }],
      imperativeTools: [],
      hasConfirmationLanguage: true,
      hasAbortSignal: true,
      hasFeatureDetection: true,
      hasFallbackLanguage: true,
      lang: "pt-BR",
      metaDescription: "Aprenda como preparar aplicações para agentes com WebMCP, segurança, schemas, exemplos práticos e critérios de produção.",
      robotsMeta: "index,follow",
      canonical: "https://example.com/guia",
      headings: { h1: ["Guia técnico de WebMCP"], total: 8, skippedLevels: 0 },
      images: { total: 2, missingAlt: 0 },
      links: { internal: 8, external: 3, about: true, contact: true },
      openGraph: { title: "Guia técnico", description: "WebMCP na prática", image: "https://example.com/capa.jpg" },
      structuredData: { total: 2, valid: 2, types: ["Organization", "Article", "FAQPage"] },
      content: { wordCount: 1400, paragraphs: 18, sections: 7, lists: 3, tables: 1, citations: 3, definitions: 3, questionHeadings: 4, directAnswers: 4, hasAuthor: true, hasDate: true, hasMain: true }
    },
    headers: { "permissions-policy": "camera=()" },
    files: {
      robots: { found: true, status: 200, blocksAll: false, declaresSitemap: true },
      sitemap: { found: true, status: 200, urlCount: 24, lastModifiedCount: 24 },
      llms: { found: llmsFound, status: llmsFound ? 200 : 404, lineCount: llmsFound ? 12 : 0 }
    },
    statusCode: 200,
    tools: [{ kind: "declarative", name: "consultar_pedido", description: "Consulta um pedido sem alterar os dados.", fields: [{ name: "codigo", description: "Código público do pedido." }], annotations: { readOnlyHint: true } }]
  };
}

test("gera quatro notas, correções, cursos e scanners planejados", () => {
  const report = buildDiagnostic(fixture());
  assert.deepEqual(Object.keys(report.categories), ["webmcp", "seo", "geo", "aeo"]);
  assert.ok(report.score >= 80);
  assert.equal(report.education.length, 3);
  assert.equal(report.advancedScanners.length, 4);
  assert.ok(report.advancedScanners.every((item) => item.status === "planejado"));
});

test("llms.txt é informativo e não altera a nota GEO", () => {
  const withoutLlms = buildDiagnostic(fixture({ llmsFound: false }));
  const withLlms = buildDiagnostic(fixture({ llmsFound: true }));
  assert.equal(withoutLlms.categories.geo.score, withLlms.categories.geo.score);
});
