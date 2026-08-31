const STATUS_WEIGHT = { pass: 1, warning: 0.45, fail: 0, info: 0.7 };
const MUTATION_PATTERN = /(criar|enviar|comprar|confirmar|cancelar|excluir|deletar|remover|pagar|inscrever|atualizar|create|send|buy|confirm|cancel|delete|remove|pay|update)/i;
const CRITICAL_PATTERN = /(comprar|pagar|excluir|deletar|confirmar[_-]?(compra|pagamento)|buy|pay|delete)/i;

function finding(category, id, status, title, detail, recommendation = null, priority = "medium") {
  return { category, id, status, title, detail, recommendation, priority };
}

function score(findings) {
  const earned = findings.reduce((sum, item) => sum + (STATUS_WEIGHT[item.status] ?? 0), 0);
  return Math.round((earned / Math.max(findings.length, 1)) * 100);
}

export function grade(value) {
  if (value >= 85) return { label: "Estrutura forte", tone: "pass" };
  if (value >= 65) return { label: "Bom ponto de partida", tone: "warning" };
  if (value >= 40) return { label: "Precisa de ajustes", tone: "warning" };
  return { label: "Base insuficiente", tone: "fail" };
}

function webmcpFindings({ observed, headers, tools }) {
  const mutable = tools.filter((tool) => !tool.annotations?.readOnlyHint && MUTATION_PATTERN.test(`${tool.name} ${tool.description}`));
  const critical = tools.filter((tool) => CRITICAL_PATTERN.test(`${tool.name} ${tool.description}`));
  const unnamed = tools.filter((tool) => !tool.name);
  const weakDescriptions = tools.filter((tool) => !tool.description || tool.description.trim().length < 24);
  const missingFieldDescriptions = observed.declarativeForms.flatMap((tool) => tool.fields.filter((field) => !field.description));
  const validSchemas = observed.imperativeTools.filter((tool) => tool.inputSchema?.type === "object");
  const permissionsPolicy = headers["permissions-policy"] || "";
  const originAgentCluster = headers["origin-agent-cluster"] || "";
  const hasToolsPolicy = /(?:^|,)\s*tools\s*=/.test(permissionsPolicy);
  const oacDisabled = /^\s*\?0\s*$/i.test(originAgentCluster);

  const findings = [
    finding("webmcp", "secure-context", observed.secureContext ? "pass" : "fail", "Contexto seguro", observed.secureContext ? "A página foi carregada em contexto seguro." : "A página não está em contexto seguro.", observed.secureContext ? null : "Publique o site em HTTPS.", "high"),
    finding("webmcp", "model-context", observed.modelContextAvailable ? "pass" : observed.staticImperativeTools ? "info" : "warning", "API WebMCP no navegador", observed.modelContextAvailable ? "document.modelContext está disponível neste ambiente." : observed.staticImperativeTools ? `A API não está ativa neste Chromium, mas ${observed.staticImperativeTools} ferramenta(s) imperativa(s) foram identificadas estaticamente nos scripts.` : "document.modelContext não foi exposto pelo navegador usado no scan.", observed.modelContextAvailable || observed.staticImperativeTools ? null : "Mantenha feature detection; a disponibilidade depende do navegador configurado."),
    finding("webmcp", "tool-discovery", tools.length ? "pass" : "fail", "Ferramentas descobertas", tools.length ? `${tools.length} ferramenta(s): ${tools.map((tool) => tool.name || "sem nome").join(", ")}.` : "Nenhuma ferramenta declarativa ou imperativa foi encontrada.", tools.length ? null : "Exponha uma jornada útil com form[toolname] ou document.modelContext.registerTool().", "high"),
    finding("webmcp", "tool-quality", tools.length && !unnamed.length && !weakDescriptions.length ? "pass" : tools.length ? "warning" : "fail", "Nomes e descrições", tools.length ? `${unnamed.length} sem nome e ${weakDescriptions.length} com descrição ausente ou curta.` : "Não existe catálogo de ferramentas para avaliar.", "Use nomes verbais específicos e descreva efeito, limites e resultado.", "high"),
    finding("webmcp", "schemas", tools.length && !missingFieldDescriptions.length && (observed.imperativeTools.length === 0 || validSchemas.length === observed.imperativeTools.length) ? "pass" : tools.length ? "warning" : "fail", "Parâmetros estruturados", `${missingFieldDescriptions.length} campo(s) declarativo(s) sem descrição; ${validSchemas.length} de ${observed.imperativeTools.length} ferramenta(s) imperativa(s) com schema de objeto.`, "Descreva cada parâmetro e valide novamente no backend.", "high"),
    finding("webmcp", "risk-signals", critical.length && !observed.hasConfirmationLanguage ? "fail" : mutable.length ? "warning" : "pass", "Risco e confirmação humana", `${mutable.length} possível(is) mutação(ões) e ${critical.length} ação(ões) crítica(s). ${observed.hasConfirmationLanguage ? "Há linguagem visível de confirmação." : "Não há evidência visível de confirmação."}`, critical.length && !observed.hasConfirmationLanguage ? "Separe preparar e confirmar; exija autorização no backend e confirmação humana." : null, "high"),
    finding("webmcp", "cancel-and-fallback", observed.hasAbortSignal && observed.hasFeatureDetection && observed.hasFallbackLanguage ? "pass" : "warning", "Cancelamento e fallback", `AbortSignal: ${observed.hasAbortSignal ? "sim" : "não"}; feature detection: ${observed.hasFeatureDetection ? "sim" : "não"}; fallback visível: ${observed.hasFallbackLanguage ? "sim" : "não"}.`, "Inclua cancelamento, feature detection e um caminho manual explícito."),
    finding("webmcp", "origin-trial", observed.hasOriginTrial ? "pass" : "warning", "WebMCP Origin Trial", observed.hasOriginTrial ? "Token do Origin Trial encontrado em meta tag ou cabeçalho HTTP." : "Nenhum token do WebMCP Origin Trial foi encontrado; enquanto a API for experimental, visitantes comuns podem não receber document.modelContext.", observed.hasOriginTrial ? null : "Registre a origem no Chrome Origin Trials e publique o token sem incluí-lo em código reutilizado por outros domínios.", "high"),
    finding("webmcp", "origin-agent-cluster", oacDisabled ? "fail" : originAgentCluster ? "pass" : "warning", "Isolamento da origem", oacDisabled ? "Origin-Agent-Cluster: ?0 desativa o isolamento exigido pelo WebMCP." : originAgentCluster ? `Origin-Agent-Cluster: ${originAgentCluster}.` : "Origin-Agent-Cluster não foi declarado; o comportamento fica dependente do padrão e de políticas do navegador.", oacDisabled ? "Remova ?0 e envie Origin-Agent-Cluster: ?1 em todas as páginas com WebMCP." : originAgentCluster ? null : "Envie Origin-Agent-Cluster: ?1 explicitamente."),
    finding("webmcp", "permissions-policy", hasToolsPolicy ? "pass" : permissionsPolicy ? "warning" : "warning", "Política de permissões", permissionsPolicy ? `Permissions-Policy: ${permissionsPolicy}` : "O cabeçalho Permissions-Policy não foi observado.", hasToolsPolicy ? null : "Declare tools=(self) e apenas as demais capacidades e origens realmente necessárias.")
  ];
  return { findings, mutable, critical };
}

function seoFindings({ observed, headers, files, statusCode }) {
  const metaNoIndex = /\bnoindex\b/i.test(`${observed.robotsMeta} ${headers["x-robots-tag"] || ""}`);
  const titleLength = observed.title.trim().length;
  const descriptionLength = observed.metaDescription.trim().length;
  const missingAltRatio = observed.images.total ? observed.images.missingAlt / observed.images.total : 0;
  const canonicalSameOrigin = observed.canonical && (() => { try { return new URL(observed.canonical, observed.finalUrl).origin === new URL(observed.finalUrl).origin; } catch { return false; } })();

  return [
    finding("seo", "indexability", statusCode < 400 && !metaNoIndex ? "pass" : "fail", "Acesso e indexação", `HTTP ${statusCode || "sem resposta"}; diretiva noindex: ${metaNoIndex ? "presente" : "ausente"}.`, statusCode >= 400 || metaNoIndex ? "Retorne HTTP 200 e remova noindex das páginas que devem aparecer nas buscas." : null, "high"),
    finding("seo", "title", titleLength >= 15 && titleLength <= 65 ? "pass" : titleLength ? "warning" : "fail", "Título da página", titleLength ? `${titleLength} caracteres: “${observed.title.slice(0, 90)}”.` : "A página não possui title.", "Use um título único, descritivo e coerente com o H1.", "high"),
    finding("seo", "description", descriptionLength >= 70 && descriptionLength <= 180 ? "pass" : descriptionLength ? "warning" : "fail", "Descrição nos resultados", descriptionLength ? `Meta description com ${descriptionLength} caracteres.` : "Meta description ausente.", "Resuma benefício, assunto e público da página em uma descrição específica."),
    finding("seo", "headings", observed.headings.h1.length === 1 && observed.headings.h1[0].length >= 8 ? "pass" : "warning", "Título principal e hierarquia", `${observed.headings.h1.length} H1; ${observed.headings.total} heading(s) no total; ${observed.headings.skippedLevels} salto(s) de nível.`, "Use um H1 claro e uma hierarquia progressiva de H2/H3."),
    finding("seo", "canonical", canonicalSameOrigin ? "pass" : observed.canonical ? "warning" : "fail", "URL canônica", observed.canonical ? `Canonical declarada: ${observed.canonical}.` : "Canonical ausente.", "Declare uma canonical absoluta apontando para a versão preferida da página."),
    finding("seo", "robots", files.robots.found && !files.robots.blocksAll ? "pass" : files.robots.blocksAll ? "fail" : "warning", "robots.txt", files.robots.found ? `${files.robots.status}; bloqueio global: ${files.robots.blocksAll ? "sim" : "não"}.` : "robots.txt não encontrado.", files.robots.blocksAll ? "Remova Disallow: / se o site deve ser rastreado." : "Publique robots.txt e declare o sitemap."),
    finding("seo", "sitemap", files.sitemap.found && files.sitemap.urlCount ? "pass" : "warning", "Sitemap", files.sitemap.found ? `${files.sitemap.urlCount} URL(s); ${files.sitemap.lastModifiedCount} com lastmod.` : "sitemap.xml não encontrado.", "Publique URLs canônicas no sitemap e mantenha lastmod correto."),
    finding("seo", "media-links", missingAltRatio <= 0.1 && observed.links.internal > 0 ? "pass" : "warning", "Imagens e links internos", `${observed.images.missingAlt} de ${observed.images.total} imagem(ns) sem alt; ${observed.links.internal} link(s) interno(s).`, "Descreva imagens informativas e conecte páginas relacionadas com links HTML."),
    finding("seo", "structured-social", observed.structuredData.valid > 0 && observed.openGraph.title && observed.openGraph.description ? "pass" : "warning", "Dados estruturados e compartilhamento", `${observed.structuredData.valid} bloco(s) JSON-LD válido(s); Open Graph ${observed.openGraph.title && observed.openGraph.description ? "completo" : "incompleto"}.`, "Adicione JSON-LD coerente com o conteúdo visível e complete og:title, og:description e og:image.")
  ];
}

function geoFindings({ observed, files }) {
  const entityTypes = new Set(observed.structuredData.types);
  const hasEntity = ["Organization", "LocalBusiness", "Person", "Product", "Course", "WebSite"].some((type) => entityTypes.has(type));
  const hasIdentityPath = observed.links.about || observed.links.contact;
  const enoughContent = observed.content.wordCount >= 250 && observed.content.paragraphs >= 3;
  const evidence = observed.content.citations + observed.links.external;
  return [
    finding("geo", "entity", hasEntity || hasIdentityPath ? "pass" : "warning", "Entidade identificável", `Schema de entidade: ${hasEntity ? "sim" : "não"}; link Sobre: ${observed.links.about ? "sim" : "não"}; contato: ${observed.links.contact ? "sim" : "não"}.`, "Explique quem publica o conteúdo e use Organization, Person, Product ou Course quando aplicável.", "high"),
    finding("geo", "substance", enoughContent ? "pass" : "warning", "Conteúdo substancial", `${observed.content.wordCount} palavras, ${observed.content.paragraphs} parágrafo(s) e ${observed.content.sections} seção(ões).`, "Inclua experiência própria, exemplos, limites e informação que não seja apenas uma descrição genérica.", "high"),
    finding("geo", "authorship", observed.content.hasAuthor && observed.content.hasDate ? "pass" : "warning", "Autoria e atualização", `Autoria: ${observed.content.hasAuthor ? "identificada" : "não identificada"}; data: ${observed.content.hasDate ? "identificada" : "não identificada"}.`, "Identifique o responsável e informe publicação ou última atualização."),
    finding("geo", "evidence", evidence >= 2 ? "pass" : "warning", "Fontes e evidências", `${observed.content.citations} citação(ões) semântica(s) e ${observed.links.external} link(s) externo(s).`, "Apoie afirmações verificáveis com fontes e deixe claro o que vem de experiência própria."),
    finding("geo", "semantic-content", observed.content.hasMain && observed.lang ? "pass" : "warning", "Estrutura compreensível", `Elemento main: ${observed.content.hasMain ? "sim" : "não"}; idioma: ${observed.lang || "ausente"}; headings: ${observed.headings.total}.`, "Use HTML semântico, idioma declarado e seções com títulos específicos."),
    finding("geo", "public-discovery", files.sitemap.found && !files.robots.blocksAll ? "pass" : "warning", "Descoberta por sistemas generativos", `Sitemap: ${files.sitemap.found ? "encontrado" : "ausente"}; bloqueio global: ${files.robots.blocksAll ? "sim" : "não"}.`, "Mantenha conteúdo público, rastreável e ligado por URLs canônicas."),
    finding("geo", "llms", "info", "llms.txt (informativo)", files.llms.found ? `Arquivo encontrado com ${files.llms.lineCount} linha(s).` : "Arquivo não encontrado; ele é opcional e não melhora ranking no Google.", null, "low")
  ];
}

function aeoFindings({ observed }) {
  const answerRatio = observed.content.questionHeadings ? observed.content.directAnswers / observed.content.questionHeadings : 0;
  const hasFaq = observed.structuredData.types.includes("FAQPage");
  return [
    finding("aeo", "questions", observed.content.questionHeadings >= 2 ? "pass" : "warning", "Perguntas do público", `${observed.content.questionHeadings} heading(s) em formato de pergunta.`, "Transforme dúvidas reais do público em seções específicas, sem criar FAQ artificial."),
    finding("aeo", "direct-answers", observed.content.questionHeadings && answerRatio >= 0.6 ? "pass" : "warning", "Respostas diretas", `${observed.content.directAnswers} de ${observed.content.questionHeadings} pergunta(s) têm resposta curta logo depois.`, "Comece cada seção com uma resposta objetiva e aprofunde nos parágrafos seguintes.", "high"),
    finding("aeo", "extractable", observed.content.lists + observed.content.tables >= 2 ? "pass" : "warning", "Informação extraível", `${observed.content.lists} lista(s) e ${observed.content.tables} tabela(s).`, "Use listas para etapas e tabelas para comparações quando esses formatos ajudarem a resposta."),
    finding("aeo", "faq-schema", hasFaq ? "pass" : "info", "FAQ estruturada", hasFaq ? "FAQPage foi encontrada no JSON-LD." : "FAQPage não foi encontrada; ela só é útil quando existe uma FAQ visível e verdadeira.", hasFaq ? null : "Não adicione schema apenas para pontuar; primeiro crie respostas úteis e visíveis.", "low"),
    finding("aeo", "answer-context", observed.content.definitions > 0 && observed.headings.total >= 3 ? "pass" : "warning", "Definições e contexto", `${observed.content.definitions} definição(ões) detectada(s); ${observed.headings.total} heading(s).`, "Defina termos, condições, limites e exceções em linguagem inequívoca."),
    finding("aeo", "visible-answer", observed.content.wordCount >= 200 && observed.content.hasMain ? "pass" : "warning", "Resposta disponível no HTML", `${observed.content.wordCount} palavras visíveis; conteúdo principal semântico: ${observed.content.hasMain ? "sim" : "não"}.`, "Não esconda a resposta principal apenas em vídeo, imagem ou interação." )
  ];
}

function learningRecommendations(categories) {
  const weakest = Object.entries(categories).sort((a, b) => a[1].score - b[1].score).map(([key]) => key);
  const courses = [
    {
      category: "webmcp",
      title: "Formação WebMCP — Sites e Agentes do Zero ao Expert",
      provider: "INEMA.CLUB",
      url: "https://inematds.github.io/webmcp-1-formacao/",
      reason: "Para transformar as correções WebMCP em uma implementação progressiva e segura."
    },
    {
      category: "geo",
      title: "AIV 2026 — AI Visibility como serviço",
      provider: "INEMA.CLUB",
      url: "https://inematds.github.io/aiv2026/guia/",
      reason: "Para aprofundar SEO, AEO, GEO, evidências e presença nas respostas de IA."
    },
    {
      category: weakest[0],
      title: "Curadoria de cursos e projetos INEMA",
      provider: "INEMA PRO",
      url: "https://www.inema.pro/",
      reason: "Para localizar a próxima formação pelo problema e pelo resultado desejado."
    }
  ];
  return courses.sort((a, b) => weakest.indexOf(a.category) - weakest.indexOf(b.category));
}

export function buildDiagnostic({ observed, headers, files, statusCode, tools }) {
  const webmcp = webmcpFindings({ observed, headers, tools });
  const groups = {
    webmcp: webmcp.findings,
    seo: seoFindings({ observed, headers, files, statusCode }),
    geo: geoFindings({ observed, files }),
    aeo: aeoFindings({ observed })
  };
  const labels = { webmcp: "WebMCP", seo: "SEO", geo: "GEO", aeo: "AEO" };
  const categories = Object.fromEntries(Object.entries(groups).map(([key, findings]) => {
    const value = score(findings);
    return [key, { key, label: labels[key], score: value, grade: grade(value), findings }];
  }));
  const overall = Math.round(categories.webmcp.score * 0.3 + categories.seo.score * 0.3 + categories.geo.score * 0.2 + categories.aeo.score * 0.2);
  const findings = Object.values(groups).flat();
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const recommendations = findings
    .filter((item) => item.recommendation && (item.status === "fail" || item.status === "warning"))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 12);
  return {
    score: overall,
    grade: grade(overall),
    categories,
    findings,
    recommendations,
    education: learningRecommendations(categories),
    advancedScanners: [
      { phase: "Builder", status: "planejado", title: "Validador profundo de ferramentas e schemas", destination: "webmcp-2-builder" },
      { phase: "Integrator", status: "planejado", title: "Crawler multipágina de sitemap, frameworks e integrações", destination: "webmcp-3-integrator" },
      { phase: "Agent Developer", status: "planejado", title: "Laboratório controlado de descoberta e execução por agentes", destination: "webmcp-4-agent-developer" },
      { phase: "Expert", status: "planejado", title: "Auditoria de segurança, evals, observabilidade e governança", destination: "webmcp-5-expert" }
    ],
    riskSummary: {
      blockers: findings.filter((item) => item.status === "fail").length,
      warnings: findings.filter((item) => item.status === "warning").length,
      passed: findings.filter((item) => item.status === "pass").length,
      mutableCandidates: webmcp.mutable.length,
      criticalCandidates: webmcp.critical.length
    }
  };
}
