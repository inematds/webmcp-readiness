import { analyzeReadiness } from "../lib/readiness.mjs";
import { recordScanLog } from "../lib/scan-log.mjs";
import { persistScanResult } from "../lib/scan-store.mjs";
import { InputError } from "../lib/errors.mjs";

export const maxDuration = 60;

function send(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  if (request.body && typeof request.body === "object") {
    if (Buffer.byteLength(JSON.stringify(request.body)) > 32_000) {
      throw new InputError("A solicitação excede o limite permitido.");
    }
    return request.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw new InputError("A solicitação excede o limite permitido.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    send(response, 405, { ok: false, error: "Método não permitido." });
    return;
  }

  try {
    const body = await readBody(request);
    const report = await analyzeReadiness(String(body.url || ""));
    try {
      await persistScanResult(report);
    } catch {
      console.error(JSON.stringify({ event: "scan_storage_error" }));
    }
    recordScanLog(report);
    send(response, 200, { ok: true, report });
  } catch (error) {
    const statusCode = error?.statusCode ?? (error instanceof SyntaxError ? 400 : 500);
    if (statusCode === 503) response.setHeader("retry-after", String(error.retryAfter || 15));
    if (statusCode >= 500) console.error(JSON.stringify({ event: "scan_error", statusCode, message: error?.message, cause: error?.cause?.message }));
    send(response, statusCode, {
      ok: false,
      retryable: statusCode === 503,
      error: statusCode === 500 ? "Analisador sobrecarregado. Tente novamente mais tarde." : error.message || "Falha inesperada."
    });
  }
}
