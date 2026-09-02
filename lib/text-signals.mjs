// Heurísticas de texto avaliadas fora do navegador, para serem testáveis.
// Os limites de palavra usam lookarounds Unicode porque \b não reconhece
// letras acentuadas (ex.: "é").
const L = "(?<![\\p{L}\\p{N}_])";
const R = "(?![\\p{L}\\p{N}_])";
const word = (alternatives, flags = "iu") => new RegExp(`${L}(?:${alternatives})${R}`, flags);

const FEATURE_DETECTION = [
  /typeof\s+document\.modelContext/,
  /['"]modelContext['"]\s*in\s*document/,
  /!\s*document\.modelContext\b/,
  /document\.modelContext\s*(?:\?\.|&&|\|\||\?\?|\)|\?(?!\.)|===?\s*(?:undefined|null)|!==?\s*(?:undefined|null))/,
  /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.modelContext\b[\s\S]{0,120}?(?:!\s*\1\b|\1\s*(?:\?\.|&&|\|\||\?\?|===?|!==?))/
];

export const AUTHOR_PATTERN = word("autor|autora|escrito por|revisado por|publicado por|author|written by|by:");
export const DATE_WORD_PATTERN = word("atualizado|atualizada|publicado|publicada|updated|published");
export const DEFINITION_PATTERN = word("é|significa|refere-se|define-se|is defined as|means");
export const CONFIRMATION_PATTERN = /(confirmar|confirmação|confirmation|review before|revisar antes)/i;
export const FALLBACK_PATTERN = /(navegador não compatível|sem webmcp|modo manual|continue manualmente|continuar manualmente|fallback)/i;

export function hasFeatureDetection(scripts) {
  return FEATURE_DETECTION.some((pattern) => pattern.test(scripts || ""));
}

export function hasAbortSignal(scripts) {
  return /AbortSignal|AbortController|\bsignal\b/.test(scripts || "");
}

export function hasVisibleAuthor(bodyText) {
  return AUTHOR_PATTERN.test(bodyText || "");
}

// A palavra só vale como data quando há um número (dia ou ano) até 40 caracteres depois.
export function hasVisibleDate(bodyText) {
  const text = bodyText || "";
  for (const match of text.matchAll(new RegExp(DATE_WORD_PATTERN.source, "giu"))) {
    if (/\d/.test(text.slice(match.index, match.index + match[0].length + 40))) return true;
  }
  return false;
}

export function isDefinition(text) {
  return DEFINITION_PATTERN.test(text || "");
}

export function hasConfirmationLanguage(bodyText) {
  return CONFIRMATION_PATTERN.test(bodyText || "");
}

// Só texto de elementos interativos ou <noscript>, para não aceitar "fallback"
// mencionado em prosa explicativa.
export function hasFallbackLanguage(interactiveText) {
  return FALLBACK_PATTERN.test(interactiveText || "");
}

export function normalizeInputSchema(schema) {
  if (typeof schema !== "string") return schema ?? null;
  try {
    const parsed = JSON.parse(schema);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function schemaIsObject(schema) {
  const normalized = normalizeInputSchema(schema);
  return normalized?.type === "object";
}

export function classifyScanError(error) {
  const message = String(error?.message || error || "");
  if (/ERR_INSUFFICIENT_RESOURCES|Target (?:closed|crashed)|Failed to launch|ENOMEM|browser has been closed|Protocol error/i.test(message)) {
    return { statusCode: 503, retryable: true, message: "Analisador sobrecarregado. Tente novamente mais tarde." };
  }
  if (/Timeout|timeout/.test(message)) {
    return { statusCode: 503, retryable: false, message: "O site demorou demais para responder e a análise foi interrompida. Tente novamente mais tarde." };
  }
  return null;
}
