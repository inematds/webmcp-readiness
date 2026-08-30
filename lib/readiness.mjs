import serverlessChromium from "@sparticuz/chromium";
import { chromium as playwrightChromium } from "playwright-core";
import { validateTarget } from "./network-policy.mjs";

const MUTATION_PATTERN = /(criar|enviar|comprar|confirmar|cancelar|excluir|deletar|remover|pagar|inscrever|atualizar|create|send|buy|confirm|cancel|delete|remove|pay|update)/i;
const CRITICAL_PATTERN = /(comprar|pagar|excluir|deletar|confirmar[_-]?(compra|pagamento)|buy|pay|delete)/i;

function finding(id, status, title, detail, recommendation = null) {
  return { id, status, title, detail, recommendation };
}

function scoreFindings(findings) {
  const weights = { pass: 1, warning: 0.45, fail: 0, info: 0.7 };
  const earned = findings.reduce((sum, item) => sum + (weights[item.status] ?? 0), 0);
  return Math.round((earned / Math.max(findings.length, 1)) * 100);
}

function grade(score) {
  if (score >= 85) return { label: "Pronto para piloto", tone: "pass" };
  if (score >= 65) return { label: "Base promissora", tone: "warning" };
  if (score >= 40) return { label: "Preparação necessária", tone: "warning" };
  return { label: "Ainda não preparado", tone: "fail" };
}

export async function analyzeReadiness(rawUrl) {
  const startedAt = Date.now();
  const { target } = await validateTarget(rawUrl);
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const executablePath = process.env.CHROMIUM_PATH || (isServerless
    ? await serverlessChromium.executablePath()
    : "/snap/bin/chromium");
  const browser = await playwrightChromium.launch({
    executablePath,
    headless: true,
    args: isServerless ? serverlessChromium.args : []
  });

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
      throw new Error(`Não foi possível abrir o site: ${error.message}`);
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
      const scripts = [...document.scripts].map((script) => script.textContent || "").join("\n");
      return {
        title: document.title,
        finalUrl: location.href,
        secureContext: window.isSecureContext,
        modelContextAvailable,
        discoveryError,
        declarativeForms,
        imperativeTools,
        hasFeatureDetection: /typeof\s+document\.modelContext|['\"]modelContext['\"]\s+in\s+document/.test(scripts),
        hasAbortSignal: /AbortSignal|AbortController|\bsignal\b/.test(scripts),
        hasConfirmationLanguage: /(confirmar|confirmação|confirmation|review before|revisar antes)/i.test(bodyText),
        hasFallbackLanguage: /(navegador não compatível|fallback|sem webmcp|modo manual|continue manualmente)/i.test(bodyText),
        forms: document.forms.length,
        lang: document.documentElement.lang || ""
      };
    });

    const headers = mainResponse?.headers() || {};
    const tools = [...observed.declarativeForms, ...observed.imperativeTools];
    const findings = [];

    findings.push(finding(
      "secure-context",
      observed.secureContext ? "pass" : "fail",
      "Contexto seguro",
      observed.secureContext ? "A página foi carregada em um contexto seguro." : "A página não está em um contexto seguro.",
      observed.secureContext ? null : "Publique em HTTPS ou use localhost durante o desenvolvimento."
    ));

    findings.push(finding(
      "model-context",
      observed.modelContextAvailable ? "pass" : "warning",
      "API WebMCP no navegador",
      observed.modelContextAvailable
        ? "document.modelContext está disponível neste ambiente."
        : "document.modelContext não foi exposto pelo navegador usado na análise.",
      observed.modelContextAvailable ? null : "Fixe uma versão compatível do navegador e mantenha feature detection e fallback."
    ));

    findings.push(finding(
      "tool-discovery",
      tools.length ? "pass" : "fail",
      "Ferramentas descobertas",
      tools.length ? `${tools.length} ferramenta(s) encontrada(s): ${tools.map((tool) => tool.name || "sem nome").join(", ")}.` : "Nenhuma ferramenta declarativa ou imperativa foi encontrada.",
      tools.length ? null : "Instrumente uma jornada pequena com form[toolname] ou document.modelContext.registerTool()."
    ));

    const unnamed = tools.filter((tool) => !tool.name);
    const weakDescriptions = tools.filter((tool) => !tool.description || tool.description.trim().length < 24);
    findings.push(finding(
      "tool-quality",
      tools.length && !unnamed.length && !weakDescriptions.length ? "pass" : tools.length ? "warning" : "fail",
      "Nomes e descrições",
      tools.length ? `${unnamed.length} sem nome e ${weakDescriptions.length} com descrição ausente ou curta.` : "Não há catálogo para avaliar.",
      unnamed.length || weakDescriptions.length ? "Use nomes verbais específicos e descreva efeito, limites e resultado de cada ferramenta." : null
    ));

    const missingFieldDescriptions = observed.declarativeForms.flatMap((tool) => tool.fields.filter((field) => !field.description));
    const schemas = observed.imperativeTools.filter((tool) => tool.inputSchema && tool.inputSchema.type === "object");
    findings.push(finding(
      "schemas",
      tools.length && !missingFieldDescriptions.length && (observed.imperativeTools.length === 0 || schemas.length === observed.imperativeTools.length) ? "pass" : tools.length ? "warning" : "fail",
      "Parâmetros estruturados",
      `${missingFieldDescriptions.length} campo(s) declarativo(s) sem descrição; ${schemas.length} de ${observed.imperativeTools.length} ferramenta(s) imperativa(s) com schema de objeto.`,
      "Descreva cada parâmetro e valide novamente no código ou backend."
    ));

    const mutable = tools.filter((tool) => !tool.annotations?.readOnlyHint && MUTATION_PATTERN.test(`${tool.name} ${tool.description}`));
    const critical = tools.filter((tool) => CRITICAL_PATTERN.test(`${tool.name} ${tool.description}`));
    findings.push(finding(
      "risk-signals",
      critical.length && !observed.hasConfirmationLanguage ? "fail" : mutable.length ? "warning" : "pass",
      "Risco e confirmação humana",
      `${mutable.length} possível(is) mutação(ões), ${critical.length} possível(is) ação(ões) crítica(s). ${observed.hasConfirmationLanguage ? "A interface contém linguagem de confirmação." : "Não foi encontrada evidência visível de confirmação."}`,
      critical.length && !observed.hasConfirmationLanguage ? "Separe preparar e confirmar; exija confirmação humana e autorização no backend." : null
    ));

    findings.push(finding(
      "cancel-and-fallback",
      observed.hasAbortSignal && observed.hasFeatureDetection && observed.hasFallbackLanguage ? "pass" : "warning",
      "Cancelamento e fallback",
      `AbortSignal: ${observed.hasAbortSignal ? "detectado" : "não detectado"}; feature detection: ${observed.hasFeatureDetection ? "detectada" : "não detectada"}; fallback visível: ${observed.hasFallbackLanguage ? "detectado" : "não detectado"}.`,
      "Inclua AbortSignal, feature detection e um caminho manual explícito."
    ));

    findings.push(finding(
      "permissions-policy",
      headers["permissions-policy"] ? "pass" : "warning",
      "Política de permissões",
      headers["permissions-policy"] ? `Permissions-Policy observada: ${headers["permissions-policy"]}` : "O cabeçalho Permissions-Policy não foi observado.",
      headers["permissions-policy"] ? null : "Revise a exposição cross-origin e declare apenas origens confiáveis."
    ));

    const score = scoreFindings(findings);
    return {
      schemaVersion: 1,
      mode: "passive",
      requestedUrl: rawUrl,
      finalUrl: observed.finalUrl,
      title: observed.title,
      analyzedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      browser: "Chromium via Playwright Core",
      score,
      grade: grade(score),
      summary: {
        tools: tools.length,
        declarative: observed.declarativeForms.length,
        imperative: observed.imperativeTools.length,
        mutableCandidates: mutable.length,
        criticalCandidates: critical.length
      },
      tools,
      findings,
      limitations: [
        "A análise é passiva e não executa ferramentas.",
        "Heurísticas não provam autorização, idempotência ou segurança do backend.",
        "Ferramentas registradas após interações específicas podem não aparecer nesta captura.",
        "A disponibilidade de document.modelContext depende do navegador configurado."
      ]
    };
  } finally {
    await browser.close();
  }
}
