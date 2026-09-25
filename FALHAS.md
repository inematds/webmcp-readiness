| 2026-09-24 | Extrator estático retornava hints de MCP e omitia três annotations atuais de WebMCP | Preservar untrustedContentHint, consequentialHint e debugging; teste de regressão | infra |
# Changelog de falhas

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 2026-09-02 | Handler devolvia 400 para qualquer exceção; ERR_INSUFFICIENT_RESOURCES do Chromium culpava a URL do usuário (D8) | erros tipados: InputError=400, ScanUnavailableError=503 com retry-after e um relançamento do browser | infra |
| 2026-09-02 | Relatório sem versão do scanner, do Chromium nem caminho de descoberta; local e produção davam notas diferentes sem rastro (D7) | campo `environment` no relatório (scannerVersion, browserVersion, modelContextAvailable, discovery) | prompt |
| 2026-09-02 | `::ffff:10.0.0.1` e 100.64/10 passavam como públicos no SSRF (D6) | desembrulhar IPv4 mapeado antes do teste; adicionar CGNAT | infra |
| 2026-09-02 | Ferramenta presente como form e como registerTool contava duas vezes (D5) | `mergeTools` deduplica por nome e guarda `sources` | prompt |
| 2026-09-02 | `\b(é\|...)\b` sem flag `u` nunca casava "é"; `por` isolado valia autoria; "fallback" em prosa valia caminho manual (D4) | lookarounds Unicode, remover `por`, data exige número próximo, fallback só em elementos interativos | prompt |
| 2026-09-02 | Só a primeira linha `Sitemap:` do robots era lida e `<sitemapindex>` não era seguido (D3) | ler todas as linhas, seguir um nível de índice, alerta com lastmod < 50% | prompt |
| 2026-09-02 | Regex de feature detection não reconhecia `let e=document.modelContext;if(!e?.registerTool)` (D2) | aceitar `?.`, `&&`, `!x`, variável intermediária | prompt |
| 2026-09-02 | `inputSchema` de runtime chegava como string e a regra `schemas` reprovava sites corretos (D1) | `JSON.parse` com try/catch antes da regra | prompt |
