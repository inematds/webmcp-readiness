const form = document.querySelector("#readiness-form");
const submitButton = document.querySelector("#readiness-submit");
const emptyState = document.querySelector("#readiness-empty");
const loadingState = document.querySelector("#readiness-loading");
const errorState = document.querySelector("#readiness-error");
const resultState = document.querySelector("#readiness-result");
const statusRegion = document.querySelector("#readiness-status");
const urlInput = form?.querySelector("input[name=url]");
const exampleButtons = [...document.querySelectorAll("[data-example-url]")];

const statePanels = [emptyState, loadingState, errorState, resultState];

function show(panel) {
  statePanels.forEach((item) => item?.classList.add("hidden"));
  panel?.classList.remove("hidden");
}

function el(tag, attrs = {}, text = null) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  });
  if (text !== null) node.textContent = text;
  return node;
}

function findingLabel(status) {
  return { pass: "Aprovado", warning: "Atenção", fail: "Bloqueador", info: "Informação" }[status] || "Informação";
}

function categoryLabel(category) {
  return { webmcp: "WebMCP", seo: "SEO", geo: "GEO", aeo: "AEO" }[category] || category.toUpperCase();
}

function renderCategoryScores(report) {
  const mount = document.querySelector("#category-score-list");
  mount.replaceChildren();
  Object.values(report.categories).forEach((category) => {
    const row = el("div", { class: "grid grid-cols-[5rem_1fr_auto] gap-4 items-center py-4 border-b border-dark-600 last:border-b-0" });
    const meter = el("div", { class: "h-2 rounded-full bg-dark-700 overflow-hidden", role: "meter", "aria-label": `Nota ${category.label}`, "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(category.score) });
    const fill = el("span", { class: `score-fill score-${category.grade.tone}` });
    fill.style.transform = `scaleX(${category.score / 100})`;
    meter.append(fill);
    const value = el("div", { class: "text-right" });
    value.append(el("strong", { class: "text-lg" }, String(category.score)), el("span", { class: "text-xs text-neutral-400" }, "/100"));
    row.append(el("strong", { class: "text-sm" }, category.label), meter, value);
    mount.append(row);
  });
}

function renderTools(report) {
  const mount = document.querySelector("#tool-list");
  mount.replaceChildren();
  if (!report.tools.length) {
    mount.append(el("p", { class: "text-sm text-neutral-400" }, "Nenhuma ferramenta foi encontrada nesta captura."));
    return;
  }
  report.tools.forEach((tool) => {
    const item = el("article", { class: "py-4 border-b border-dark-600 last:border-b-0" });
    const top = el("div", { class: "flex flex-wrap items-center gap-2 mb-2" });
    top.append(
      el("code", { class: "text-sm text-sky-400" }, tool.name || "sem_nome"),
      el("span", { class: "px-2 py-1 rounded-full bg-dark-700 text-xs text-neutral-300" }, tool.kind === "declarative" ? "Declarativa" : "Imperativa")
    );
    item.append(top, el("p", { class: "text-sm text-neutral-400" }, tool.description || "Sem descrição."));
    mount.append(item);
  });
}

function renderFindings(report) {
  const mount = document.querySelector("#finding-list");
  mount.replaceChildren();
  Object.values(report.categories).forEach((category) => {
    const section = el("section", { class: "pt-5 first:pt-2" });
    const heading = el("div", { class: "flex items-baseline justify-between gap-3 pb-2 border-b border-dark-600" });
    heading.append(el("h3", { class: "font-bold" }, category.label), el("span", { class: "text-sm text-neutral-400" }, `${category.score}/100`));
    section.append(heading);
    category.findings.forEach((finding) => {
      const item = el("article", { class: `finding-${finding.status} flex gap-4 py-4 border-b border-dark-600 last:border-b-0` });
      const mark = el("span", { class: "finding-mark mt-2 w-2 h-2 rounded-full flex-shrink-0", "aria-hidden": "true" });
      const content = el("div", { class: "min-w-0" });
      const title = el("div", { class: "flex flex-wrap items-center gap-2 mb-1" });
      title.append(
        el("h4", { class: "font-semibold text-neutral-100" }, finding.title),
        el("span", { class: "text-xs text-neutral-400" }, findingLabel(finding.status))
      );
      content.append(title, el("p", { class: "text-sm text-neutral-300 break-words" }, finding.detail));
      if (finding.recommendation) content.append(el("p", { class: "text-sm text-sky-400 mt-2" }, finding.recommendation));
      item.append(mark, content);
      section.append(item);
    });
    mount.append(section);
  });
}

function renderRecommendations(report) {
  const mount = document.querySelector("#recommendation-list");
  mount.replaceChildren();
  if (!report.recommendations.length) {
    mount.append(el("li", { class: "py-4 text-sm text-neutral-300" }, "Nenhuma correção prioritária foi encontrada neste scan."));
    return;
  }
  report.recommendations.forEach((item, index) => {
    const row = el("li", { class: "grid grid-cols-[2rem_1fr] gap-3 py-4 border-b border-dark-600 last:border-b-0" });
    const content = el("div", { class: "min-w-0" });
    const meta = el("p", { class: "text-xs text-neutral-400 mb-1" }, `${categoryLabel(item.category)} · ${findingLabel(item.status)}`);
    content.append(meta, el("h3", { class: "font-semibold" }, item.title), el("p", { class: "text-sm text-neutral-300 mt-1" }, item.recommendation));
    row.append(el("span", { class: "text-sm font-bold text-sky-400" }, String(index + 1).padStart(2, "0")), content);
    mount.append(row);
  });
}

function renderEducation(report) {
  const mount = document.querySelector("#education-list");
  mount.replaceChildren();
  report.education.forEach((course) => {
    const row = el("a", { class: "block py-4 border-b border-dark-600 last:border-b-0 group", href: course.url, target: "_blank", rel: "noreferrer" });
    const top = el("div", { class: "flex flex-wrap items-center justify-between gap-2" });
    top.append(el("h3", { class: "font-semibold group-hover:text-sky-400" }, course.title), el("span", { class: "text-xs text-sky-400" }, course.provider));
    row.append(top, el("p", { class: "text-sm text-neutral-300 mt-2" }, course.reason));
    mount.append(row);
  });
}

function renderAdvancedScanners(report) {
  const mount = document.querySelector("#advanced-scanner-list");
  mount.replaceChildren();
  report.advancedScanners.forEach((scanner) => {
    const row = el("div", { class: "grid sm:grid-cols-[8rem_1fr] gap-2 sm:gap-4 py-4 border-b border-dark-600 last:border-b-0" });
    row.append(el("strong", { class: "text-sm text-amber-400" }, scanner.phase), el("p", { class: "text-sm text-neutral-300" }, scanner.title));
    mount.append(row);
  });
}

function renderReport(report) {
  document.querySelector("#scanner-layout")?.classList.add("report-ready");
  document.querySelector("#score-value").textContent = String(report.score);
  document.querySelector("#score-grade").textContent = report.grade.label;
  document.querySelector("#report-url").textContent = report.finalUrl;
  document.querySelector("#report-meta").textContent = `${report.durationMs} ms · ${report.summary.pageWords} palavras · ${report.summary.sitemapUrls} URL(s) no sitemap`;
  document.querySelector("#stat-blockers").textContent = String(report.summary.blockers);
  document.querySelector("#stat-warnings").textContent = String(report.summary.warnings);
  document.querySelector("#stat-passed").textContent = String(report.summary.passed);
  document.querySelector("#stat-tools").textContent = String(report.summary.tools);
  renderCategoryScores(report);
  renderRecommendations(report);
  renderFindings(report);
  renderTools(report);
  renderEducation(report);
  renderAdvancedScanners(report);
  resultState.dataset.report = JSON.stringify(report);
  show(resultState);
  resultState.classList.add("result-enter");
  resultState.focus({ preventScroll: true });
  statusRegion.textContent = `Análise concluída. Nota geral ${report.score} de 100. WebMCP ${report.categories.webmcp.score}, SEO ${report.categories.seo.score}, GEO ${report.categories.geo.score} e AEO ${report.categories.aeo.score}.`;
}

async function analyze(url) {
  show(loadingState);
  submitButton.disabled = true;
  exampleButtons.forEach((button) => { button.disabled = true; });
  submitButton.setAttribute("aria-busy", "true");
  statusRegion.textContent = "Abrindo o site em um navegador isolado e reunindo evidências.";
  try {
    const response = await fetch("/api/readiness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "A análise não pôde ser concluída.");
    renderReport(payload.report);
  } catch (error) {
    document.querySelector("#error-message").textContent = error.message;
    show(errorState);
    statusRegion.textContent = `Falha na análise: ${error.message}`;
  } finally {
    submitButton.disabled = false;
    exampleButtons.forEach((button) => { button.disabled = false; });
    submitButton.removeAttribute("aria-busy");
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const url = String(data.get("url") || "").trim();
  if (!url) return;
  analyze(url);
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const url = button.dataset.exampleUrl;
    if (!url || !urlInput) return;
    urlInput.value = url;
    statusRegion.textContent = `Exemplo selecionado: ${url}. Iniciando a análise.`;
    analyze(url);
  });
});

document.querySelector("#download-report")?.addEventListener("click", () => {
  const report = resultState.dataset.report;
  if (!report) return;
  const blob = new Blob([report], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `webmcp-readiness-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

document.querySelector("#new-analysis")?.addEventListener("click", () => {
  document.querySelector("#scanner-layout")?.classList.remove("report-ready");
  show(emptyState);
  urlInput?.focus();
});

window.addEventListener("toolactivated", (event) => {
  statusRegion.textContent = "A ferramenta WebMCP ativou o diagnóstico. Revise a URL antes da análise.";
  if (event.respondWith) {
    event.respondWith(Promise.resolve({ ok: true, message: "Diagnóstico iniciado em modo passivo." }));
  }
});
