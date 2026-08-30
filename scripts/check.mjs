import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../readiness.js", import.meta.url), "utf8");
const api = await readFile(new URL("../api/readiness.js", import.meta.url), "utf8");

const checks = {
  form: html.includes('id="readiness-form"'),
  endpoint: script.includes('fetch("/api/readiness"'),
  handler: api.includes("export default async function handler"),
  passiveCopy: html.includes("Nenhuma ferramenta do site é executada"),
  securityCopy: html.includes("Redes privadas ficam bloqueadas"),
  courseLink: html.includes("webmcp-1-formacao"),
  categoryScores: html.includes('id="category-score-list"') && script.includes("renderCategoryScores"),
  recommendations: html.includes('id="recommendation-list"') && script.includes("renderRecommendations"),
  advancedScanners: html.includes('id="advanced-scanner-list"') && script.includes("renderAdvancedScanners")
};

const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (missing.length) {
  console.error(`Estrutura incompleta: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("WebMCP Readiness: estrutura Vercel OK");
