# Auditoria externa — WebMCP Readiness, prompt de correção e relevância do INEMA.club

> Auditoria independente feita em 2 de setembro de 2026 sobre os nove documentos
> de `docs/`, o código do scanner, o site publicado em `webmcp.inema.pro` e o
> portal `www.inema.club`.
> Cada achado está marcado como **reproduzido** (executei e vi o resultado),
> **observado** (vi em uma resposta HTTP, página ou busca) ou **inferido**
> (conclusão a partir do código, sem execução).

## Resumo executivo

Três conclusões mandam em tudo o que segue.

1. **O scanner emite alertas falsos por causa do ambiente, não do site.**
   O mesmo `www.inema.club` recebe achados diferentes conforme o Chromium usado.
   Localmente, com `document.modelContext` ativo, o `getTools()` devolve o
   `inputSchema` como string JSON e o scanner conclui "0 de 8 ferramentas com
   schema de objeto". O relatório não registra versão do scanner, do navegador
   nem flags, então o usuário não tem como saber que o alerta é uma limitação.
2. **A fórmula da nota tem tetos e vieses escondidos.** GEO nunca chega a 100
   (máximo 96), adicionar `FAQPage` sobe a nota AEO apesar da regra "não pontue
   schema", e um site sem WebMCP fica preso perto de 83 na nota geral mesmo com
   SEO, GEO e AEO perfeitos.
3. **A autoridade do INEMA está dividida e a substância mora fora do portal.**
   A busca "curso WebMCP em português" devolve `inematds.github.io`, não
   `inema.club`. As páginas de curso do portal têm 165 a 245 palavras, FAQ
   gerada por template e o texto "Nível catalogado: Não informado na fonte".

Há também um problema operacional imediato: em 2 de setembro, um único `POST`
na API de produção devolveu HTTP 400 com `ERR_INSUFFICIENT_RESOURCES` em 780 ms.
O incidente descrito em `diagnostico-estabilidade-vercel.md` continua ativo.

## Ambiente e método

| Item | Valor |
|---|---|
| Data | 2026-09-02 |
| Código auditado | branch `main`, commit `3f1fd21`, mais os docs ainda não versionados |
| Testes automatizados | 17 testes, todos passando (`npm test`) |
| Chromium local | 151.0.7922.108 (snap), `document.modelContext` disponível sem flag |
| Chromium em produção | `@sparticuz/chromium` 149 sem flag; caminho estático |
| URLs escaneadas localmente | home, `/cursos/`, `/conhecimento/o-que-e-webmcp/`, curso 246 e `webmcp.inema.pro` |
| Produção | um `POST /api/readiness` com a home do INEMA.club |
| Buscas externas | quatro consultas web para presença de marca, categoria e concorrentes |

As imagens em `doc/` são artes de divulgação da formação e não foram usadas como
evidência.

### Notas obtidas localmente (reproduzido)

| URL | Geral | WebMCP | SEO | GEO | AEO | Palavras | Tools |
|---|---|---|---|---|---|---|---|
| `www.inema.club/` | 91 | 89 | 100 | 96 | 77 | 925 | 9 |
| `www.inema.club/cursos/` | 86 | 89 | 94 | 80 | 77 | 10.805 | 8 |
| `/conhecimento/o-que-e-webmcp/` | 89 | 89 | 94 | 88 | 82 | 234 | 8 |
| `/cursos/246-formacao-webmcp-…/` | 84 | 89 | 94 | 80 | 63 | 165 | 8 |
| `webmcp.inema.pro/` | 73 | 73 | 71 | 72 | 77 | 272 | 1 |

---

# Parte 1 — Sistema de diagnóstico

## 1.1 Defeitos confirmados

Cada linha traz evidência, menor correção e como verificar.

### D1. `inputSchema` de runtime chega como string (reproduzido)

No scan local da home, o `tools[1]` do JSON exportado tem
`"inputSchema": "{\"type\":\"object\",...}"`. A regra em `lib/audit-rules.mjs:27`
testa `tool.inputSchema?.type === "object"`, que falha para string. Resultado:
alerta "0 de 8 ferramenta(s) imperativa(s) com schema de objeto" em um site cujos
oito schemas são objetos válidos com `additionalProperties: false`.

- Menor correção: no bloco `page.evaluate`, fazer `JSON.parse` quando o
  `inputSchema` for string, com `try/catch`.
- Verificação: fixture com tool cujo schema é string; a regra `schemas` deve passar.

### D2. Feature detection real não é reconhecida (reproduzido)

O bundle do portal faz `let e=document.modelContext;if(!e?.registerTool)return;`.
O regex em `lib/readiness.mjs:169` só aceita `typeof document.modelContext` ou
`"modelContext" in document`. O relatório marca "feature detection: não" em todas
as cinco páginas do portal.

- Menor correção: aceitar também `document.modelContext` seguido de checagem
  nula ou opcional (`?.`, `if(!`, `&&`).
- Verificação: fixture com o padrão minificado acima.

### D3. Só a primeira linha `Sitemap:` do robots é lida (reproduzido)

O `robots.txt` do portal declara `sitemap.xml` e `courses-sitemap.xml`. O scanner
lê só o primeiro. O sitemap principal tem 64 URLs e zero `lastmod`; o de cursos
tem 252 URLs com 211 `lastmod` e é ignorado. Ainda assim a regra `sitemap` passa.
O código em `lib/site-files.mjs:60` também não segue `<sitemapindex>`.

- Menor correção: ler todas as linhas `Sitemap:`, seguir um nível de índice,
  somar contagens e emitir alerta quando a proporção de `lastmod` for baixa.
- Verificação: fixture de robots com dois sitemaps e um índice.

### D4. Heurísticas de texto em português produzem falsos positivos (reproduzido)

| Regra | Regex | Efeito observado |
|---|---|---|
| `hasVisibleAuthor` | inclui `\bpor\b` | "Relatório gerado por robôs" conta como autoria. O próprio `webmcp.inema.pro` recebeu "Autoria: identificada" sem ter autor. |
| `hasFallbackLanguage` | inclui `fallback` | A home do portal passou em "fallback visível" porque a palavra aparece em um texto explicativo, não em um caminho manual. |
| `definitions` | `\b(é\|…)\b` sem flag `u` | `\b` não funciona ao redor de `é`. "WebMCP é uma proposta" devolve `false`. A página de conhecimento reportou 0 definições. |
| `hasDate` | `atualizado\|publicado` no corpo | Qualquer menção à palavra vale como data. |

- Menor correção: trocar `\b` por lookarounds Unicode com flag `u`, remover
  `por` isolado, e exigir que "fallback" esteja em um elemento interativo ou
  `<noscript>`, não em texto corrido.
- Verificação: uma fixture positiva e uma negativa por regra.

### D5. Ferramentas duplicadas contam duas vezes (reproduzido)

`buscar_cursos` aparece como declarativa e como imperativa e o resumo mostra
9 ferramentas. O prompt em `docs/` exige deduplicação; o código em
`lib/readiness.mjs:228` só concatena.

- Menor correção: deduplicar por nome, preservando os dois `kind` em um campo
  `sources`.

### D6. Proteção SSRF tem duas lacunas (reproduzido para a primeira)

`isPrivateAddress` em `lib/network-policy.mjs:13` trata `::ffff:10.0.0.1`
como público, porque só verifica prefixos `fc`, `fd`, `fe80:` e `::1`. Também
não cobre `100.64.0.0/10` (CGNAT) nem `::ffff:169.254.169.254`. O plano do
scanner avançado já registra o TOCTOU de DNS entre validação e fetch.

- Menor correção: normalizar IPv4 mapeado em IPv6 para IPv4 antes do teste, e
  adicionar `100.64/10`.
- Verificação: teste unitário com `::ffff:127.0.0.1` e `100.64.0.1`.

### D7. Relatório sem versão, navegador ou flags (observado)

O campo `browser` traz o texto fixo "Chromium via Playwright Core". Não há
`scannerVersion`, versão do Chromium, presença de `document.modelContext` no
ambiente, nem caminho usado (runtime ou estático). D1 e D2 só existem porque o
ambiente muda e ninguém consegue ver isso no relatório.

- Menor correção: incluir `scanner.version` (do `package.json`),
  `browser.version` (via `browser.version()`), `browser.modelContext: true|false`
  e `discovery: runtime|static|none`.

### D8. Erro de infraestrutura vira erro do usuário (reproduzido)

`POST https://webmcp.inema.pro/api/readiness` com a home do INEMA.club devolveu
HTTP 400, "Não foi possível abrir o site: page.goto: net::ERR_INSUFFICIENT_RESOURCES",
em 780 ms. A mensagem da interface culpa a URL. O handler em `api/readiness.js:50`
converte toda exceção em 400.

- Menor correção: mapear `ERR_INSUFFICIENT_RESOURCES`, `Target closed` e
  `Timeout` para 503 com `retry-after`, e uma tentativa de relançar o browser.
  O resto do plano P0 de `memoria-e-roadmap-do-produto.md` continua válido.

## 1.2 Desenho da nota

A nota de cada dimensão é a média dos pesos `pass=1`, `info=0.7`,
`warning=0.45`, `fail=0` em `lib/audit-rules.mjs:9`. Isso tem três efeitos
que os documentos não registram.

| Efeito | Aritmética | Consequência |
|---|---|---|
| GEO nunca chega a 100 | `llms.txt` é sempre `info`; 6 pass + 0,7 = 6,7 de 7 = 96 | O INEMA.club obteve exatamente 96 com tudo aprovado. |
| Schema sobe a nota | `FAQPage` ausente = 0,7; presente = 1,0 | Contradiz a recomendação "não adicione schema apenas para pontuar". |
| WebMCP domina a geral | Site HTTPS sem WebMCP: 2 pass (contexto seguro, risco) + 5 warning + 3 fail = 4,25 de 10 = 43. Com 30% de peso, SEO/GEO/AEO perfeitos rendem no máximo cerca de 83. | Um site excelente é rotulado "Bom ponto de partida" por não adotar uma API em origin trial. |

Outros pontos do desenho:

- **Contagem de palavras** usa `innerText` do `body`, incluindo menu e rodapé.
  A home do portal soma 925 palavras, e o catálogo 10.805.
- **Evidências GEO** somam `cite`, `blockquote`, `q` e qualquer link externo.
  Ícones de redes sociais no rodapé contam como fontes.
- **Ponto cego de renderização.** O scanner só vê o DOM renderizado pelo
  Chromium. GPTBot, ClaudeBot e PerplexityBot não executam JavaScript
  (conhecimento geral do setor, não verificado nesta auditoria). Um site
  que injeta conteúdo por JS pode pontuar bem no scanner e ser invisível para os
  crawlers de IA. Isso é o oposto do que o produto promete medir.

Recomendação de desenho, alinhada ao que `nota-validacao-runtime-webmcp-inema.md`
já propõe:

1. Publicar três resultados: **prontidão de conteúdo** (SEO, GEO, AEO),
   **WebMCP** como eixo separado com estado `confirmado`, `indício estático`,
   `ausente` ou `não verificável`, e **confiança da análise**.
2. Tirar `info` da média. Achados informativos ficam fora do denominador.
3. Comparar HTML bruto com DOM renderizado e emitir o achado "conteúdo que
   depende de JavaScript", com a diferença em palavras e headings.
4. Publicar a fórmula na interface, como o roadmap P1 já pede.

## 1.3 O scanner reprovado por si mesmo (reproduzido)

`webmcp.inema.pro` pontua 73 no próprio scanner. Faltam canonical, `robots.txt`,
`sitemap.xml`, JSON-LD, Open Graph completo, `Origin-Agent-Cluster` e
`Permissions-Policy: tools=(self)`. Os cabeçalhos observados em produção são
apenas `camera=(), microphone=(), geolocation=()`. É a primeira coisa que um
visitante cético vai testar. Correção de uma hora em `vercel.json` e `index.html`.

## 1.4 Mercado (observado em busca web, 2 de setembro de 2026)

| Concorrente | O que oferece | Referência |
|---|---|---|
| WebMCP Scan | checker gratuito, promete prontidão para ChatGPT, Claude, Perplexity e Gemini | https://webmcpscan.com/ |
| WebMCP Verify | 15 verificações em 4 categorias | https://webmcpverify.com/ |
| WebMCP Checker | auditoria em 15 segundos com **código de correção pronto para colar** | https://webmcp-checker.com/ |
| Web-MCP.net CLI | scan, lint e teste pelo terminal | https://web-mcp.net/cli |
| WebMCP Ready Checker | extensão Chrome; ainda monitora `navigator.modelContext`, deprecado no Chrome 150 | https://chromewebstore.google.com/detail/webmcp-ready-checker/gnjfbpnfgmllkpjhhohednepgffkmhhk |
| SiteSpeakAI | scanner de prontidão para agentes com `llms.txt` e dados estruturados | https://sitespeak.ai/tools/ai-agent-readiness-scanner |

Contexto de plataforma: o origin trial do WebMCP vai do Chrome 149 ao 156 e a
API migrou de `navigator` para `document`, com deprecação de
`navigator.modelContext` no Chrome 150. Fontes:
https://developer.chrome.com/docs/ai/webmcp e
https://ppc.land/chrome-149-origin-trial-puts-webmcp-in-developers-hands-at-last/.

O diferencial defensável do WebMCP Readiness não é a nota, que todos têm. É a
combinação de estados honestos, quatro dimensões e, sobretudo, transformar o
relatório em um **prompt executável** por agente de código. Nenhum concorrente
encontrado entrega isso; o mais próximo é o snippet de código do WebMCP Checker.

## 1.5 Cobertura de testes e persistência

- Os 17 testes cobrem regras de nota, log, store, política de rede e descoberta
  estática. Nenhum cobre o bloco `page.evaluate` nem as heurísticas de texto,
  onde estão D1, D2 e D4.
- Recomendação: pasta `test/fixtures/` com páginas HTML salvas e um teste por
  `finding.id` com caso positivo e negativo. O scan pode rodar sobre
  `file://` ou um servidor local com `ALLOW_PRIVATE_TARGETS=1`.
- O Postgres guarda só cinco notas. Antes/depois, benchmark por setor e o estudo
  "Analisamos N sites" (P5) precisam dos `findings` em JSONB e do
  `scannerVersion`. Sem isso, cada mudança de regra invalida o histórico.

---

# Parte 2 — Sistema de prompt para corrigir e melhorar sites

## 2.1 O que existe

Dois prompts monolíticos de 12 e 13 etapas, em português e inglês, cobrindo
auditoria de repositório, canonical, SEO técnico, AEO/GEO, WebMCP, headers,
observabilidade, validação e entrega. O conteúdo técnico é bom e cauteloso.
Os pontos fortes são os três estados (detectado, registrado, executável), a
proibição de inventar token de origin trial e a regra "a meta não é a nota".

## 2.2 Problemas

| Problema | Evidência | Efeito |
|---|---|---|
| O prompt não recebe o scan | O campo "Relatório, se existir" é um caminho de arquivo opcional | O agente refaz o diagnóstico com critérios próprios e diverge do scanner |
| Sem ordem por lacuna medida | As 12 etapas são executadas sempre, na mesma ordem | Sites com SEO pronto gastam o mesmo esforço que sites sem nada |
| Sem critério de verificação por achado | "Compare as pontuações antes e depois" | O agente não sabe qual evidência precisa aparecer para cada correção |
| Conflito com regra do usuário | "Aguarde o deploy aparecer no domínio" e "Confirme que a versão publicada contém as alterações" | Contradiz a regra global de nunca consultar ou esperar o Vercel |
| Autor fixo | `inematds <inematds@gmail.com>` | A regra correta é: autor segue a conta de destino, com `inematds` como padrão |
| Sem versão | Os dois arquivos não têm número nem changelog | PT e EN já divergem (o EN tem 13 etapas e "Local scanner") |
| Falta o ponto cego de JS | Nenhuma etapa manda comparar HTML bruto com renderizado | O agente pode "corrigir" algo invisível para crawlers de IA |

## 2.3 Proposta: três camadas em vez de um bloco

```text
Camada A — política (estável, versionada)
  estados confirmado/ausente/não verificável/inferência
  document.modelContext, nunca navigator
  segurança, SSRF, sem token inventado, sem duplicar conteúdo
  autor e publicação seguem as regras do repositório de destino

Camada B — receitas por achado (geradas pelo scanner)
  uma receita por finding.id que falhou ou alertou
  cada receita: o que o scan viu → o que mudar → evidência esperada depois
  ordenadas por prioridade e esforço, com o framework detectado

Camada C — verificação (curta)
  rodar lint/test/build, git diff --check
  rodar o scan de novo e comparar finding por finding, não só notas
  relatar limitações do scanner separadas de pendências do site
```

O scanner passa a emitir, no JSON e na interface, um botão "Copiar prompt de
correção" que junta A + B + C já preenchidos com a URL, o framework detectado
(Next.js, HTML estático, WordPress) e os achados reais. Isso resolve o item
"prompt não recebe o scan", cria o diferencial contra os concorrentes e
transforma cada scan em uma tarefa executável no Claude Code ou Codex.

Exemplo de receita para `webmcp/origin-agent-cluster`:

```text
Achado: Origin-Agent-Cluster não foi declarado (warning).
Mudar: enviar `Origin-Agent-Cluster: ?1` nas páginas com WebMCP.
  Next.js: headers() em next.config; Vercel estático: vercel.json.
Evidência esperada: cabeçalho presente na resposta da URL publicada;
  a regra origin-agent-cluster passa no novo scan.
Não fazer: enviar ?0; enviar apenas em desenvolvimento.
```

## 2.4 Ajustes de conteúdo nos prompts atuais

1. Substituir a etapa 11 por "publicar = commit e push autorizados; deploy é do
   webhook; não esperar nem consultar o provedor".
2. Trocar o autor fixo por "seguir a regra do repositório de destino".
3. Acrescentar em SEO técnico: "confirmar que título, H1, texto principal e
   JSON-LD estão no HTML bruto, sem JavaScript".
4. Acrescentar em WebMCP: "se `getTools()` devolver `inputSchema` como string,
   isso é o comportamento da API atual; não é defeito do site".
5. Numerar os prompts (`v1.1`), manter PT e EN com o mesmo número e registrar
   mudanças no fim do arquivo.

---

# Parte 3 — Elevar o INEMA.club como referência nas buscas e nas IAs

## 3.1 Diagnóstico externo

O que está bom, observado em 2 de setembro de 2026:

- `robots.txt` libera todos os crawlers e lista OAI-SearchBot, Claude-SearchBot,
  ClaudeBot, PerplexityBot, Googlebot e Bingbot.
- `llms.txt` bem feito, com páginas principais, perguntas, APIs JSON e RSS.
- Cabeçalhos `Origin-Agent-Cluster: ?1` e `Permissions-Policy: tools=(self)`.
- JSON-LD de `EducationalOrganization`, `WebSite`, `Course`, `Article`,
  `BreadcrumbList` e `FAQPage`, com `sameAs` e fundador.
- Oito tools WebMCP somente leitura, com schemas fechados, ligadas a APIs
  públicas reais (`/api/courses/`, `/api/knowledge/`, `/api/updates/`).
- A busca de marca ("INEMA.club cursos inteligência artificial Nei Maldaner")
  devolve o portal, o LinkedIn, o Sisnema e vídeos do YouTube.

O que está limitando:

| Achado | Evidência (observado) | Por que pesa |
|---|---|---|
| A substância mora no github.io | "curso WebMCP em português" devolveu `inematds.github.io/webmcp-1-formacao/`, não `inema.club` | O domínio que acumula autoridade e citações não é o do portal |
| Páginas de curso rasas | Curso 246: 165 palavras no scan, "Nível catalogado: Não informado na fonte", "carga horária, pré-requisitos e módulos devem ser confirmados na aplicação oficial" | Padrão observado em uma página e inferido para as outras 251 do sitemap de cursos, por ser template |
| FAQ por template | "O que é o curso X?" respondido com a própria meta description, na página observada | Google restringiu rich results de FAQ em 2023 (conhecimento geral, não verificado aqui); repetir a descrição sinaliza conteúdo automatizado |
| Home com H1 fraco | `INEMA.CLUB Portal INEMA`, três H2 | A página mais forte do domínio não declara o que é |
| Sitemap principal sem `lastmod` | 64 URLs, zero `lastmod`; o de cursos tem 211 | Crawlers de IA priorizam frescor declarado |
| Marca dividida | `inema.club`, `inema.pro`, `inema.vip`, `eventos.inema.pro`, `webmcp.inema.pro`, `inematds.github.io` | Cada superfície dilui entidade e links |
| Colisão de entidade | "INEMA" é também o órgão ambiental da Bahia | A IA precisa de co-ocorrência forte com "INEMA.club" e "Nei Maldaner" |

## 3.2 Plano por ordem de impacto

### Prioridade 1 — trazer a substância para o portal

- Cada página de curso passa a ter: público, pré-requisitos, carga horária,
  lista de módulos com uma linha por módulo, resultados, projeto final,
  tecnologias, gratuidade ou preço, autor, data e cursos anterior e seguinte.
  Mínimo de 600 palavras próprias, não copiadas da aplicação.
- O botão "Abrir o curso" continua, mas a página do portal vira a canônica e
  a aplicação no GitHub Pages aponta de volta com `rel="canonical"` ou, no
  mínimo, com link textual na primeira dobra.
- Publicar as aplicações de curso em um subdomínio próprio, por exemplo
  `cursos.inema.club`, usando domínio personalizado do GitHub Pages. Mantém o
  fluxo de deploy atual e consolida a autoridade sob a marca.

### Prioridade 2 — limpar o que sinaliza automação

- Remover o `FAQPage` gerado por template das páginas de curso. Manter FAQ só
  onde há perguntas reais e respostas específicas.
- Corrigir o H1 da home para uma frase que descreva a entidade
  ("Formação prática em IA, agentes e automação, em português").
- Adicionar `lastmod` real ao `sitemap.xml` principal.
- Consolidar as 62 páginas de `/conhecimento/`: as que respondem variações da
  mesma pergunta viram um guia completo, como
  `estrategia-relevancia-inema.md` já propõe.

### Prioridade 3 — distribuição para os índices que alimentam as IAs

- Bing Webmaster Tools e IndexNow: o ChatGPT com busca se apoia no índice do
  Bing (conhecimento geral, não verificado nesta auditoria). Sem isso, a
  otimização para OAI-SearchBot fica pela metade.
- Google Search Console com o relatório de recursos generativos.
- Descrições de vídeos no YouTube e READMEs dos repositórios `inematds/*`
  apontando para a URL canônica do portal, com uma frase descritiva, não só
  o link.
- Transcrições dos vídeos publicadas como texto no portal.
- Resumos públicos do que acontece na comunidade Skool, que hoje é invisível.

### Prioridade 4 — conteúdo que só o INEMA pode publicar

- O estudo "Analisamos N sites brasileiros: quantos estão prontos para
  agentes?" já tem matéria-prima na tabela `scan_results`. Precisa do
  `findings` em JSONB (Parte 1.5) para sair com dados por regra.
- Relato técnico "Implementamos WebMCP no INEMA.club": oito tools, schemas,
  APIs, o que falhou, o que o scanner não enxerga. É citável por ser
  primário e específico.
- Página de hub "WebMCP em português" reunindo definição, comparação com MCP,
  as cinco formações, o scanner e os artigos, com links internos em ambos os
  sentidos.

### Prioridade 5 — medir

Executar a Fase 2A de `relatorio-semrush-e-monitoramento-ia.md` com 20 prompts
em três plataformas e duas repetições. As quatro buscas desta auditoria servem
como linha de base informal:

| Prompt | Resultado observado em 2026-09-02 |
|---|---|
| Marca: "INEMA.club cursos inteligência artificial Nei Maldaner" | Portal presente, com LinkedIn, Sisnema e YouTube |
| Categoria: "curso WebMCP em português formação" | Presente via `inematds.github.io` e `eventos.inema.pro`; `inema.club` ausente |
| Produto: "WebMCP Readiness scanner" | `webmcp.inema.pro` presente, entre seis concorrentes |
| Tecnologia: "WebMCP Chrome origin trial" | Nenhuma superfície INEMA; só Chrome, ppc.land, blogs internacionais |

O objetivo de seis meses é a categoria e a tecnologia devolverem `inema.club`.

## 3.3 Papel do WebMCP nessa estratégia

O portal já tem WebMCP implementado com qualidade acima da média do mercado.
Isso não melhora a busca web e o próprio produto diz isso. O que melhora a
busca é a Prioridade 1. O WebMCP serve para duas coisas aqui: ser o caso de
estudo público (Prioridade 4) e, com a validação runtime da nota de 1º de
setembro, virar a prova de que a formação entrega o que ensina.

---

# Prioridades consolidadas

| Prioridade | Ação | Parte | Esforço |
|---|---|---|---|
| P0 | Devolver 503 em saturação, retry único e limite de concorrência (D8) | 1 | horas |
| P0 | Corrigir `inputSchema` string e feature detection (D1, D2) | 1 | 1 hora |
| P0 | Registrar versão do scanner, do navegador e caminho de descoberta (D7) | 1 | 1 hora |
| P0 | `webmcp.inema.pro` passar no próprio scanner (1.3) | 1 | 1 hora |
| P1 | Ler todos os sitemaps e índices; alertar `lastmod` baixo (D3) | 1 | horas |
| P1 | Corrigir regex Unicode, `por`, `fallback`; deduplicar tools (D4, D5) | 1 | horas |
| P1 | Fechar IPv4 mapeado em IPv6 e CGNAT (D6) | 1 | 1 hora |
| P1 | Tirar `info` da média; WebMCP como eixo separado; publicar fórmula (1.2) | 1 | dias |
| P1 | Fixtures HTML com teste por `finding.id` (1.5) | 1 | dias |
| P1 | Prompt em três camadas e botão "Copiar prompt de correção" (2.3) | 2 | dias |
| P1 | Páginas de curso completas e FAQ por template removida (3.2 P1, P2) | 3 | semanas |
| P2 | HTML bruto vs renderizado como achado (1.2) | 1 | dias |
| P2 | `findings` em JSONB com versão (1.5) | 1 | horas |
| P2 | `cursos.inema.club` para o GitHub Pages; Bing e IndexNow (3.2 P1, P3) | 3 | dias |
| P2 | Fase 2A de monitoramento com 20 prompts (3.2 P5) | 3 | semanas |
| P3 | Estudo com dados agregados e relato técnico do WebMCP no portal (3.2 P4) | 3 | semanas |

# O que não foi verificado

- O caminho estático em produção não pôde ser observado: a API devolveu 400
  por saturação na única tentativa. As diferenças entre local e produção
  vêm da leitura do código, não de um relatório de produção.
- Nenhuma tool WebMCP foi executada; a validação runtime da nota de 1º de
  setembro continua pendente.
- As buscas foram feitas em um único mecanismo, uma vez, sem controle de país
  ou sessão. Servem como linha de base informal, não como medição.
- As imagens de `doc/` não foram analisadas por serem material de divulgação.
- Search Console, Bing Webmaster e analytics do portal não foram consultados.

# Documentos relacionados

- [Memória e roadmap do produto](./memoria-e-roadmap-do-produto.md)
- [Diagnóstico de estabilidade no Vercel](./diagnostico-estabilidade-vercel.md)
- [Validação runtime do WebMCP no INEMA.club](./nota-validacao-runtime-webmcp-inema.md)
- [Estratégia de relevância do INEMA.club](./estrategia-relevancia-inema.md)
- [Relatório Semrush e monitoramento em IA](./relatorio-semrush-e-monitoramento-ia.md)
- [Prompt reutilizável em português](./prompt-aplicar-webmcp-seo-aeo-geo.md)
