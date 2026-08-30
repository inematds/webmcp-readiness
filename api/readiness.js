import { analyzeReadiness } from "../lib/readiness.mjs";

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
      throw new Error("A solicitação excede o limite permitido.");
    }
    return request.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_000) throw new Error("A solicitação excede o limite permitido.");
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
    send(response, 200, { ok: true, report });
  } catch (error) {
    send(response, 400, { ok: false, error: error.message || "Falha inesperada." });
  }
}
