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
      headers: { "user-agent": "WebMCP-Readiness/2.2.2 (+https://webmcp.inema.pro/)" }
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

const MAX_SITEMAPS_FROM_ROBOTS = 5;
const MAX_INDEX_CHILDREN = 10;

export function sitemapsFromRobots(robotsText, origin) {
  const urls = [];
  for (const match of (robotsText || "").matchAll(/^\s*sitemap:\s*(\S+)/gim)) {
    try {
      const href = new URL(match[1], origin).href;
      if (!urls.includes(href)) urls.push(href);
    } catch { /* linha inválida é ignorada */ }
    if (urls.length >= MAX_SITEMAPS_FROM_ROBOTS) break;
  }
  return urls.length ? urls : [new URL("/sitemap.xml", origin).href];
}

export function parseSitemap(text) {
  const source = text || "";
  const isIndex = /<sitemapindex[\s>]/i.test(source);
  const locations = [...source.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim()).slice(0, 50_000);
  const lastModified = [...source.matchAll(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi)].map((match) => match[1].trim()).slice(0, 50_000);
  return { isIndex, locations, lastModified };
}

async function fetchSitemap(url) {
  const file = await fetchPublicText(url).catch((error) => unavailable(url, error));
  const parsed = file.found ? parseSitemap(file.text) : { isIndex: false, locations: [], lastModified: [] };
  const { text: _text, ...metadata } = file;
  return { ...metadata, ...parsed };
}

// Lê todas as linhas Sitemap: do robots e segue um nível de <sitemapindex>.
export async function inspectSitemaps(robotsText, origin) {
  const roots = await Promise.all(sitemapsFromRobots(robotsText, origin).map(fetchSitemap));
  const children = await Promise.all(roots
    .filter((root) => root.isIndex)
    .flatMap((root) => root.locations.slice(0, MAX_INDEX_CHILDREN))
    .map(fetchSitemap));
  const leaves = [...roots.filter((root) => !root.isIndex), ...children].filter((item) => item.found);
  const locations = leaves.flatMap((item) => item.locations);
  const primary = roots[0];
  return {
    found: roots.some((root) => root.found),
    status: primary.status,
    url: primary.url,
    contentType: primary.contentType,
    error: primary.error,
    sitemapCount: leaves.length,
    sitemaps: [...roots, ...children].map(({ url, found, status, isIndex, locations: locs, lastModified }) => ({ url, found, status, isIndex, urlCount: locs.length, lastModifiedCount: lastModified.length })),
    urlCount: locations.length,
    sampleUrls: locations.slice(0, 5),
    lastModifiedCount: leaves.reduce((sum, item) => sum + item.lastModified.length, 0)
  };
}

export async function inspectPublicFiles(pageUrl) {
  const origin = new URL(pageUrl).origin;
  const robotsUrl = new URL("/robots.txt", origin).href;
  const llmsUrl = new URL("/llms.txt", origin).href;
  const robots = await fetchPublicText(robotsUrl).catch((error) => unavailable(robotsUrl, error));
  const [sitemap, llms] = await Promise.all([
    inspectSitemaps(robots.text, origin),
    fetchPublicText(llmsUrl).catch((error) => unavailable(llmsUrl, error))
  ]);

  return {
    robots: {
      ...robots,
      blocksAll: /user-agent:\s*\*[\s\S]*?disallow:\s*\/(?:\s|$)/i.test(robots.text),
      declaresSitemap: /^\s*sitemap:/im.test(robots.text)
    },
    sitemap,
    llms: {
      ...llms,
      lineCount: llms.found ? llms.text.split(/\r?\n/).filter(Boolean).length : 0
    }
  };
}
