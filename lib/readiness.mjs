import serverlessChromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";
import { validateTarget } from "./network-policy.mjs";
import { inspectPublicFiles } from "./site-files.mjs";
import { buildDiagnostic } from "./audit-rules.mjs";
import { discoverStaticWebMcpTools } from "./static-webmcp.mjs";
import { classifyScanError, hasAbortSignal, hasConfirmationLanguage, hasFallbackLanguage, hasFeatureDetection, hasVisibleAuthor, hasVisibleDate, isDefinition, normalizeInputSchema } from "./text-signals.mjs";
import { InputError, ScanUnavailableError } from "./errors.mjs";
import { createRequire } from "node:module";
const packageInfo = createRequire(import.meta.url)("../package.json");

const RETRY_BUDGET_MS = 25_000;

async function launchBrowser() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const executablePath = process.env.CHROMIUM_PATH || (isServerless
    ? await serverlessChromium.executablePath()
    : "/snap/bin/chromium");
  return playwrightChromium.launch({
    executablePath,
    headless: true,
    args: isServerless ? serverlessChromium.args : []
  });
}

// Deduplica por nome: a mesma jornada pode aparecer como form[toolname] e como
// registerTool(). Mantém a primeira definição e registra as fontes.
export function mergeTools(declarativeForms, imperativeTools) {
  const byName = new Map();
  for (const tool of [...declarativeForms, ...imperativeTools]) {
    const key = tool.name || `__sem_nome_${byName.size}`;
    const existing = byName.get(key);
    if (existing) {
      existing.sources.push(tool.kind);
      if (!existing.description && tool.description) existing.description = tool.description;
      if (!existing.inputSchema && tool.inputSchema) existing.inputSchema = tool.inputSchema;
      existing.annotations = { ...tool.annotations, ...existing.annotations };
      continue;
    }
    byName.set(key, { ...tool, sources: [tool.kind] });
  }
  return [...byName.values()];
}

export async function analyzeReadiness(rawUrl) {
  const startedAt = Date.now();
  let target;
  try {
    ({ target } = await validateTarget(rawUrl));
  } catch (error) {
    throw new InputError(error.message);
  }
  let attempts = 0;
  while (true) {
    attempts += 1;
    try {
      return await scanOnce(target, rawUrl, startedAt, attempts);
    } catch (error) {
      const classified = classifyScanError(error);
      if (!classified) throw error;
      if (classified.retryable && attempts === 1 && Date.now() - startedAt < RETRY_BUDGET_MS) continue;
      throw new ScanUnavailableError(classified.message, error);
    }
  }
}

async function scanOnce(target, rawUrl, startedAt, attempt) {
  const browser = await launchBrowser();
  const browserVersion = browser.version();

  try {
    const context = await browser.newContext({
      javaScriptEnabled: true,
      ignoreHTTPSErrors: false,
      serviceWorkers: "block",
      acceptDownloads: false,
      viewport: { width: 1365, height: 768 }
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(20_000);
    page.setDefaultTimeout(8_000);

    const approvedHosts = new Map();
    await page.route("**/*", async (route) => {
      const requestUrl = route.request().url();
      if (/^(data|blob|about):/.test(requestUrl)) return route.continue();
      try {
        const parsed = new URL(requestUrl);
        if (!approvedHosts.has(parsed.hostname)) {
          approvedHosts.set(parsed.hostname, validateTarget(parsed.origin));
        }
        await approvedHosts.get(parsed.hostname);
        return route.continue();
      } catch {
        return route.abort("blockedbyclient");
      }
    });

    let mainResponse;
    try {
      mainResponse = await page.goto(target.href, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
    } catch (error) {
      if (classifyScanError(error)) throw error;
      throw new InputError(`Não foi possível abrir o site: ${error.message}`);
    }

    const observed = await page.evaluate(async () => {
      const declarativeForms = [...document.querySelectorAll("form[toolname]")].map((form) => {
        const fields = [...form.elements]
          .filter((field) => field.name)
          .map((field) => ({
            name: field.name,
            type: field.type || field.tagName.toLowerCase(),
            required: Boolean(field.required),
            description: field.getAttribute("toolparamdescription") || ""
          }));
        return {
          kind: "declarative",
          name: form.getAttribute("toolname") || "",
          description: form.getAttribute("tooldescription") || "",
          autoSubmit: form.hasAttribute("toolautosubmit"),
          fields
        };
      });

      let imperativeTools = [];
      let discoveryError = null;
      const modelContextAvailable = typeof document.modelContext !== "undefined";
      if (modelContextAvailable && typeof document.modelContext.getTools === "function") {
        try {
          const tools = await document.modelContext.getTools();
          imperativeTools = [...tools].map((tool) => ({
            kind: "imperative",
            name: tool.name || "",
            title: tool.title || "",
            description: tool.description || "",
            inputSchema: tool.inputSchema || null,
            annotations: tool.annotations || {}
          }));
        } catch (error) {
          discoveryError = String(error?.message || error);
        }
      }

      const bodyText = document.body?.innerText || "";
      const inlineScripts = [...document.scripts].map((script) => script.textContent || "").join("\n");
      const sameOriginScriptUrls = [...new Set([...document.scripts]
        .map((script) => script.src)
        .filter((src) => {
          if (!src) return false;
          try { return new URL(src, location.href).origin === location.origin; }
          catch { return false; }
        }))].slice(0, 16);
      const externalScripts = await Promise.all(sameOriginScriptUrls.map(async (url) => {
        try {
          const response = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
          if (!response.ok || !response.body) return "";
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let text = "";
          while (text.length < 500_000) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
          if (text.length >= 500_000) await reader.cancel();
          return text.slice(0, 500_000);
        } catch { return ""; }
      }));
      const scripts = `${inlineScripts}\n${externalScripts.join("\n")}`.slice(0, 3_000_000);
      const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content?.trim() || "";
      const property = (name) => document.querySelector(`meta[property="${name}"]`)?.content?.trim() || "";
      const headingNodes = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];
      const headingLevels = headingNodes.map((node) => Number(node.tagName.slice(1)));
      const skippedLevels = headingLevels.reduce((count, level, index) => index && level > headingLevels[index - 1] + 1 ? count + 1 : count, 0);
      const pageOrigin = location.origin;
      const anchors = [...document.querySelectorAll("a[href]")].map((anchor) => {
        try { return { url: new URL(anchor.href, location.href), text: anchor.textContent?.trim() || "" }; }
        catch { return null; }
      }).filter(Boolean);
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')];
      const structuredTypes = [];
      let validJsonLd = 0;
      const collectTypes = (value) => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) return value.forEach(collectTypes);
        const type = value["@type"];
        if (Array.isArray(type)) structuredTypes.push(...type.map(String));
        else if (type) structuredTypes.push(String(type));
        Object.values(value).forEach(collectTypes);
      };
      jsonLd.forEach((node) => {
        try { const parsed = JSON.parse(node.textContent || "{}"); validJsonLd += 1; collectTypes(parsed); }
        catch { /* JSON-LD inválido é contado pela diferença entre total e válido. */ }
      });
      const questionHeadings = headingNodes.filter((node) => /\?$/.test(node.textContent?.trim() || ""));
      const directAnswers = questionHeadings.filter((heading) => {
        let next = heading.nextElementSibling;
        while (next && /^H[1-6]$/.test(next.tagName)) next = next.nextElementSibling;
        const text = next?.textContent?.trim() || "";
        return text.length >= 30 && text.length <= 600;
      }).length;
      const authorMeta = meta("author");
      const hasAuthorMarkup = Boolean(authorMeta || document.querySelector("[rel='author'], .author, [itemprop='author']"));
      const hasDateMarkup = Boolean(document.querySelector("time[datetime], meta[property='article:published_time'], meta[property='article:modified_time']"));
      const definitionCandidates = [...document.querySelectorAll("p,dd")].map((node) => (node.textContent || "").slice(0, 400));
      const interactiveText = [...document.querySelectorAll("noscript,button,a,summary,details,label,[role='button'],[role='alert'],[role='status']")]
        .map((node) => node.textContent || "").join("\n").slice(0, 100_000);
      const images = [...document.images];
      const words = bodyText.trim().split(/\s+/).filter(Boolean);
      return {
        title: document.title,
        finalUrl: location.href,
        secureContext: window.isSecureContext,
        modelContextAvailable,
        discoveryError,
        declarativeForms,
        imperativeTools,
        scriptSource: scripts,
        bodyText: bodyText.slice(0, 200_000),
        interactiveText,
        definitionCandidates,
        hasAuthorMarkup,
        hasDateMarkup,
        scriptsScanned: sameOriginScriptUrls.length,
        hasOriginTrialMeta: Boolean(document.querySelector('meta[http-equiv="origin-trial" i][content]')),
        forms: document.forms.length,
        lang: document.documentElement.lang || "",
        metaDescription: meta("description"),
        robotsMeta: meta("robots"),
        canonical: document.querySelector('link[rel="canonical"]')?.href || "",
        headings: {
          h1: [...document.querySelectorAll("h1")].map((node) => node.textContent?.trim() || ""),
          total: headingNodes.length,
          skippedLevels
        },
        images: {
          total: images.length,
          missingAlt: images.filter((image) => !image.hasAttribute("alt")).length
        },
        links: {
          internal: anchors.filter((item) => item.url.origin === pageOrigin && ["http:", "https:"].includes(item.url.protocol)).length,
          external: anchors.filter((item) => item.url.origin !== pageOrigin && ["http:", "https:"].includes(item.url.protocol)).length,
          about: anchors.some((item) => /(sobre|about|quem somos)/i.test(`${item.text} ${item.url.pathname}`)),
          contact: anchors.some((item) => /(contato|contact|fale conosco)/i.test(`${item.text} ${item.url.pathname}`))
        },
        openGraph: {
          title: property("og:title"),
          description: property("og:description"),
          image: property("og:image")
        },
        structuredData: {
          total: jsonLd.length,
          valid: validJsonLd,
          types: [...new Set(structuredTypes)]
        },
        content: {
          wordCount: words.length,
          paragraphs: document.querySelectorAll("p").length,
          sections: document.querySelectorAll("section,article").length,
          lists: document.querySelectorAll("ul,ol").length,
          tables: document.querySelectorAll("table").length,
          citations: document.querySelectorAll("cite,blockquote,q").length,
          questionHeadings: questionHeadings.length,
          directAnswers,
          hasMain: Boolean(document.querySelector("main"))
        }
      };
    });

    const headers = mainResponse?.headers() || {};
    const staticImperativeTools = discoverStaticWebMcpTools(observed.scriptSource);
    observed.hasFeatureDetection = hasFeatureDetection(observed.scriptSource);
    observed.hasAbortSignal = hasAbortSignal(observed.scriptSource);
    observed.hasConfirmationLanguage = hasConfirmationLanguage(observed.bodyText);
    observed.hasFallbackLanguage = hasFallbackLanguage(observed.interactiveText);
    observed.content.definitions = observed.definitionCandidates.filter(isDefinition).length;
    observed.content.hasAuthor = observed.hasAuthorMarkup || hasVisibleAuthor(observed.bodyText);
    observed.content.hasDate = observed.hasDateMarkup || hasVisibleDate(observed.bodyText);
    delete observed.scriptSource;
    delete observed.bodyText;
    delete observed.interactiveText;
    delete observed.definitionCandidates;
    const runtimeTools = observed.imperativeTools.map((tool) => ({ ...tool, inputSchema: normalizeInputSchema(tool.inputSchema) }));
    const imperativeByName = new Map(staticImperativeTools.map((tool) => [tool.name, tool]));
    for (const tool of runtimeTools) imperativeByName.set(tool.name, tool);
    observed.imperativeTools = [...imperativeByName.values()];
    observed.staticImperativeTools = staticImperativeTools.length;
    observed.hasOriginTrial = observed.hasOriginTrialMeta || Boolean(headers["origin-trial"]);
    const tools = mergeTools(observed.declarativeForms, observed.imperativeTools);
    const discovery = observed.modelContextAvailable && runtimeTools.length ? "runtime" : staticImperativeTools.length ? "static" : "none";
    const files = await inspectPublicFiles(observed.finalUrl);
    const diagnostic = buildDiagnostic({
      observed,
      headers,
      files,
      statusCode: mainResponse?.status() || 0,
      tools
    });
    const publicFiles = Object.fromEntries(Object.entries(files).map(([key, value]) => {
      const { text: _rawText, ...metadata } = value;
      return [key, metadata];
    }));
    return {
      schemaVersion: 2,
      mode: "quick-passive",
      requestedUrl: rawUrl,
      finalUrl: observed.finalUrl,
      title: observed.title,
      analyzedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      browser: "Chromium via Playwright Core",
      environment: {
        scannerVersion: packageInfo.version,
        browserVersion,
        modelContextAvailable: observed.modelContextAvailable,
        discovery,
        attempt
      },
      score: diagnostic.score,
      grade: diagnostic.grade,
      categories: diagnostic.categories,
      summary: {
        tools: tools.length,
        declarative: observed.declarativeForms.length,
        imperative: observed.imperativeTools.length,
        imperativeStatic: observed.staticImperativeTools,
        scriptsScanned: observed.scriptsScanned,
        ...diagnostic.riskSummary,
        sitemapUrls: files.sitemap.urlCount,
        pageWords: observed.content.wordCount
      },
      tools,
      publicFiles,
      findings: diagnostic.findings,
      recommendations: diagnostic.recommendations,
      education: diagnostic.education,
      advancedScanners: diagnostic.advancedScanners,
      limitations: [
        "O diagnóstico rápido analisa profundamente apenas a URL informada; o sitemap é inventariado, não rastreado página por página.",
        "A análise é passiva e não executa ferramentas WebMCP.",
        "Heurísticas não provam autorização, idempotência ou segurança do backend.",
        "Ferramentas registradas após interações específicas podem não aparecer nesta captura.",
        "A disponibilidade de document.modelContext depende do navegador configurado.",
        "SEO, GEO e AEO medem sinais observáveis; não garantem indexação, ranking ou citação por sistemas de IA."
      ]
    };
  } finally {
    await browser.close();
  }
}
