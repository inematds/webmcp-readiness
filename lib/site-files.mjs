import { validateTarget } from "./network-policy.mjs";

const MAX_REDIRECTS = 4;
const MAX_BYTES = 750_000;
const REQUEST_TIMEOUT_MS = 7_000;

async function readLimited(response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Arquivo público excede o limite do diagnóstico rápido.");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function fetchPublicText(rawUrl) {
  let current = new URL(rawUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await validateTarget(current.href);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "user-agent": "WebMCP-Readiness/2.0 (+https://webmcp.inema.pro/)" }
    });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      current = new URL(response.headers.get("location"), current);
      continue;
    }
    return {
      found: response.ok,
      status: response.status,
      url: current.href,
      contentType: response.headers.get("content-type") || "",
      text: response.ok ? await readLimited(response) : ""
    };
  }
  throw new Error("O arquivo público excedeu o limite de redirecionamentos.");
}

function unavailable(url, error) {
  return { found: false, status: 0, url, contentType: "", text: "", error: error?.message || "indisponível" };
}

function sitemapFromRobots(robots, origin) {
  const match = robots.text.match(/^\s*sitemap:\s*(\S+)/im);
  if (!match) return new URL("/sitemap.xml", origin).href;
  try {
    return new URL(match[1], origin).href;
  } catch {
    return new URL("/sitemap.xml", origin).href;
  }
}

export async function inspectPublicFiles(pageUrl) {
  const origin = new URL(pageUrl).origin;
  const robotsUrl = new URL("/robots.txt", origin).href;
  const llmsUrl = new URL("/llms.txt", origin).href;
  const robots = await fetchPublicText(robotsUrl).catch((error) => unavailable(robotsUrl, error));
  const sitemapUrl = sitemapFromRobots(robots, origin);
  const [sitemap, llms] = await Promise.all([
    fetchPublicText(sitemapUrl).catch((error) => unavailable(sitemapUrl, error)),
    fetchPublicText(llmsUrl).catch((error) => unavailable(llmsUrl, error))
  ]);

  const sitemapLocations = sitemap.found
    ? [...sitemap.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim()).slice(0, 50_000)
    : [];
  const sitemapLastModified = sitemap.found
    ? [...sitemap.text.matchAll(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi)].map((match) => match[1].trim()).slice(0, 50_000)
    : [];

  return {
    robots: {
      ...robots,
      blocksAll: /user-agent:\s*\*[\s\S]*?disallow:\s*\/(?:\s|$)/i.test(robots.text),
      declaresSitemap: /^\s*sitemap:/im.test(robots.text)
    },
    sitemap: {
      ...sitemap,
      urlCount: sitemapLocations.length,
      sampleUrls: sitemapLocations.slice(0, 5),
      lastModifiedCount: sitemapLastModified.length
    },
    llms: {
      ...llms,
      lineCount: llms.found ? llms.text.split(/\r?\n/).filter(Boolean).length : 0
    }
  };
}
