import assert from "node:assert/strict";
import test from "node:test";
import { classifyScanError, hasFallbackLanguage, hasFeatureDetection, hasVisibleAuthor, hasVisibleDate, isDefinition, normalizeInputSchema, schemaIsObject } from "../lib/text-signals.mjs";

test("D1: inputSchema em string JSON é reconhecido como objeto", () => {
  assert.equal(schemaIsObject('{"type":"object","properties":{},"additionalProperties":false}'), true);
  assert.equal(schemaIsObject({ type: "object" }), true);
  assert.equal(schemaIsObject('{"type":"string"}'), false);
  assert.equal(schemaIsObject("nao é json"), false);
  assert.equal(normalizeInputSchema(null), null);
});

test("D2: feature detection minificada é reconhecida", () => {
  assert.equal(hasFeatureDetection("let e=document.modelContext;if(!e?.registerTool)return;e.registerTool(t)"), true);
  assert.equal(hasFeatureDetection("if (typeof document.modelContext !== 'undefined') {}"), true);
  assert.equal(hasFeatureDetection('if ("modelContext" in document) {}'), true);
  assert.equal(hasFeatureDetection("document.modelContext?.registerTool(t)"), true);
  assert.equal(hasFeatureDetection("if(!document.modelContext)return;"), true);
  assert.equal(hasFeatureDetection("if (document.modelContext) { go(); }"), true);
  assert.equal(hasFeatureDetection("document.modelContext ? a() : b()"), true);
});

test("D2: chamada sem proteção não conta como feature detection", () => {
  assert.equal(hasFeatureDetection("document.modelContext.registerTool(tool);"), false);
  assert.equal(hasFeatureDetection("const x = 1;"), false);
});

test("D4: definição com 'é' acentuado é detectada", () => {
  assert.equal(isDefinition("WebMCP é uma proposta para expor ferramentas."), true);
  assert.equal(isDefinition("Cafés e pães na padaria."), false);
  assert.equal(isDefinition("O termo significa algo."), true);
});

test("D4: 'por' isolado não vale como autoria", () => {
  assert.equal(hasVisibleAuthor("Relatório gerado por robôs"), false);
  assert.equal(hasVisibleAuthor("Escrito por Maria Silva"), true);
  assert.equal(hasVisibleAuthor("Autor: João"), true);
});

test("D4: data exige número próximo", () => {
  assert.equal(hasVisibleDate("Conteúdo atualizado com frequência."), false);
  assert.equal(hasVisibleDate("Atualizado em 12 de agosto de 2026"), true);
  assert.equal(hasVisibleDate("Published 2026-09-01"), true);
});

test("D4: 'fallback' só vale em elementos interativos", () => {
  assert.equal(hasFallbackLanguage("Continuar manualmente"), true);
  assert.equal(hasFallbackLanguage("Enviar"), false);
});

test("D8: erros de infraestrutura viram 503", () => {
  assert.equal(classifyScanError(new Error("page.goto: net::ERR_INSUFFICIENT_RESOURCES"))?.statusCode, 503);
  assert.equal(classifyScanError(new Error("Target closed"))?.statusCode, 503);
  assert.equal(classifyScanError(new Error("page.goto: Timeout 20000ms exceeded")).retryable, false);
  assert.equal(classifyScanError(new Error("net::ERR_NAME_NOT_RESOLVED")), null);
});
