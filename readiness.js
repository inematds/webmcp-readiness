const form = document.querySelector("#readiness-form");
const submitButton = document.querySelector("#readiness-submit");
const emptyState = document.querySelector("#readiness-empty");
const loadingState = document.querySelector("#readiness-loading");
const errorState = document.querySelector("#readiness-error");
const resultState = document.querySelector("#readiness-result");
const statusRegion = document.querySelector("#readiness-status");

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
  report.findings.forEach((finding) => {
    const item = el("article", { class: `finding-${finding.status} flex gap-4 py-5 border-b border-dark-600 last:border-b-0` });
    const mark = el("span", { class: "finding-mark mt-2 w-2 h-2 rounded-full flex-shrink-0", "aria-hidden": "true" });
    const content = el("div", { class: "min-w-0" });
    const title = el("div", { class: "flex flex-wrap items-center gap-2 mb-1" });
    title.append(
      el("h3", { class: "font-semibold text-neutral-100" }, finding.title),
      el("span", { class: "text-xs text-neutral-400" }, findingLabel(finding.status))
    );
    content.append(title, el("p", { class: "text-sm text-neutral-300" }, finding.detail));
    if (finding.recommendation) {
      content.append(el("p", { class: "text-sm text-sky-400 mt-2" }, finding.recommendation));
    }
    item.append(mark, content);
    mount.append(item);
  });
}

function renderReport(report) {
  document.querySelector("#score-value").textContent = String(report.score);
  document.querySelector("#score-grade").textContent = report.grade.label;
  document.querySelector("#report-url").textContent = report.finalUrl;
  document.querySelector("#report-meta").textContent = `${report.summary.tools} ferramenta(s) · ${report.durationMs} ms · modo passivo`;
  document.querySelector("#stat-tools").textContent = String(report.summary.tools);
  document.querySelector("#stat-declarative").textContent = String(report.summary.declarative);
  document.querySelector("#stat-imperative").textContent = String(report.summary.imperative);
  document.querySelector("#stat-critical").textContent = String(report.summary.criticalCandidates);
  renderFindings(report);
  renderTools(report);
  resultState.dataset.report = JSON.stringify(report);
  show(resultState);
  resultState.classList.add("result-enter");
  resultState.focus({ preventScroll: true });
  statusRegion.textContent = `Análise concluída. Nota ${report.score} de 100: ${report.grade.label}.`;
}

async function analyze(url) {
  show(loadingState);
  submitButton.disabled = true;
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
  show(emptyState);
  form.querySelector("input[name=url]")?.focus();
});

window.addEventListener("toolactivated", (event) => {
  statusRegion.textContent = "A ferramenta WebMCP ativou o diagnóstico. Revise a URL antes da análise.";
  if (event.respondWith) {
    event.respondWith(Promise.resolve({ ok: true, message: "Diagnóstico iniciado em modo passivo." }));
  }
});
