# Memória e roadmap do WebMCP Readiness

> Consolidação das decisões tomadas durante a criação e avaliação do scanner.  
> Atualizado em 2 de setembro de 2026.

## Visão do produto

O WebMCP Readiness deve ser uma ferramenta pública e independente para responder
duas perguntas diferentes:

1. O site está tecnicamente e editorialmente preparado para WebMCP, SEO, AEO e GEO?
2. Depois das correções, a marca está sendo encontrada, mencionada, citada e recomendada pelas plataformas de IA?

O produto começa com um scan rápido e evolui para diagnóstico multipágina,
validação WebMCP em runtime e monitoramento recorrente em plataformas de IA.

## Posicionamento decidido

```text
WebMCP Readiness
→ projeto independente
→ repositório, deploy, banco e roadmap próprios

Formação WebMCP
→ ensina os conceitos e a implementação
→ utiliza o scanner como laboratório
→ aponta para o projeto, sem incorporá-lo ao curso
```

Local de trabalho:

```text
/home/nmaldaner/projetos/webmcp-readiness
```

Repositório:

```text
git@github.com:inematds/webmcp-readiness.git
```

Produção:

```text
https://webmcp.inema.pro/
```

## O que existe hoje

- formulário público para informar uma URL;
- Chromium isolado por análise;
- proteção contra redes privadas e protocolos inseguros;
- análise profunda de uma URL;
- inventário de `robots.txt`, `sitemap.xml` e `llms.txt`;
- descoberta de formulários WebMCP declarativos;
- descoberta estática limitada de tools imperativas em bundles próprios;
- nota geral e notas WebMCP, SEO, GEO e AEO;
- evidências, bloqueadores, alertas e recomendações;
- relatório JSON para download;
- log mínimo com domínio e cinco notas;
- persistência opcional em Postgres/Neon;
- indicação das formações e scanners avançados.

## Princípios definidos

### Evidência antes da nota

Cada avaliação deve mostrar:

```text
evidência
→ diagnóstico
→ impacto
→ correção sugerida
```

### Não prometer o que o scan não prova

O scanner não deve prometer indexação, ranking, citação ou recomendação por IA.
Também não deve afirmar que uma tool é executável apenas porque sua definição
apareceu em um bundle.

### Ausência de evidência não é sempre falha

Para verificações runtime, usar:

- `confirmado`;
- `ausente ou inválido`;
- `não verificável`;
- `inferência`, quando necessário.

Um navegador sem WebMCP não encontrar `document.modelContext` deve diminuir a
confiança da análise, não produzir automaticamente nota zero.

### Scan rápido e scan avançado são produtos diferentes

```text
Scan rápido
→ barato, passivo, uma URL, Vercel

Scan avançado
→ fila, Chromium controlado, sitemap, runtime, VPS/worker
```

## Roadmap priorizado

### P0 — Estabilizar o produto atual

- limitar concorrência de Chromium por instância;
- bloquear imagens, vídeos, fontes e analytics durante o scan;
- implementar retry único para `ERR_INSUFFICIENT_RESOURCES`;
- devolver HTTP 503 para saturação, não HTTP 400;
- mostrar “scanner ocupado, tente novamente”;
- adicionar rate limit;
- registrar duração, tipo de falha e fase em que ocorreu;
- garantir fechamento de página, contexto e navegador;
- avaliar aumento de memória da função;
- manter fallback para análise HTML quando o navegador falhar.

### P1 — Tornar o relatório mais honesto e útil

- separar indício estático de confirmação runtime;
- exibir confiança por categoria;
- publicar a fórmula de cada nota;
- mostrar ambiente, navegador e versão do scanner;
- distinguir problema do site de limitação do scanner;
- agrupar correções por impacto e esforço;
- incluir exemplos de implementação;
- gerar resumo executivo e plano de ação;
- preservar evidências suficientes para auditoria.

### P1 — Melhorar o prompt de correção

- usar `document.modelContext`, não `navigator.modelContext`;
- exigir feature detection;
- distinguir WebMCP de MCP;
- distinguir agente externo de agente da aba;
- preservar jornada humana e formulários;
- impedir duplicação artificial de conteúdo ou tools para aumentar nota;
- classificar achados como confirmado, ausente, não verificável ou inferido;
- pedir comparação antes/depois;
- exigir testes de schema, erros, cancelamento e segurança.

### P2 — Crawler multipágina

- selecionar amostra representativa do sitemap;
- respeitar canonical, robots e limites;
- analisar home, páginas institucionais, cursos, produtos e artigos;
- detectar páginas órfãs, duplicadas e superficiais;
- comparar templates e conteúdo único;
- avaliar entidades e links internos em nível de domínio;
- produzir relatório consolidado e por página.

### P2 — Worker independente

Arquitetura desejada:

```text
Vercel
├── interface pública
├── API de criação e consulta de jobs
└── relatórios

Worker/VPS
├── fila
├── Chromium
├── concorrência controlada
├── crawler multipágina
└── testes runtime

Postgres
├── jobs
├── observações
├── relatórios
└── histórico de notas
```

### P3 — Laboratório WebMCP runtime

- abrir o site em Chrome compatível;
- verificar `document.modelContext`;
- executar `getTools()`;
- validar nomes, descrições, schemas e anotações;
- executar inicialmente apenas tools de leitura;
- validar retorno, erro, cancelamento e permissões;
- testar tools condicionadas a rota, login e estado;
- executar evals de seleção de tool por linguagem natural;
- comparar catálogo esperado e catálogo observado.

### P4 — Presença nas plataformas de IA

Usar o scan para gerar uma biblioteca de prompts e monitorar:

- OpenAI com pesquisa web;
- Gemini com Google Search grounding;
- Perplexity/Sonar;
- Google AI Mode e AI Overviews em integração avançada.

Métricas:

- taxa de presença;
- taxa de citação;
- cobertura de tópicos;
- consistência entre repetições;
- share of voice;
- share of citations;
- proeminência observada;
- sentimento;
- percepção e narrativa;
- páginas citadas;
- concorrentes mencionados.

Detalhamento: [Relatório Semrush e monitoramento em plataformas de IA](./relatorio-semrush-e-monitoramento-ia.md).

### P5 — Benchmark coletivo

- criar referências por setor, idioma e país;
- calcular percentis sem expor conteúdo sensível;
- mostrar padrões técnicos mais frequentes;
- identificar sites exemplares;
- permitir opt-out;
- transformar dados agregados em estudos originais do INEMA.

## Modelo de evolução

```text
DIAGNOSTICAR
→ CORRIGIR
→ VALIDAR EM RUNTIME
→ MEDIR NAS IAS
→ COMPARAR
→ MONITORAR
```

## O que aprendemos com o Semrush

O Semrush separa diagnóstico técnico, pesquisa de prompts, competição, percepção,
narrativa e monitoramento. O aprendizado mais importante para o nosso produto é
que cada gráfico precisa gerar uma recomendação concreta.

O WebMCP Readiness não deve tentar ser uma cópia do Semrush. Seu diferencial é:

> avaliar WebMCP, SEO, AEO e GEO juntos, explicar limitações e transformar o
> diagnóstico em um plano técnico e editorial executável.

O monitoramento de IA será uma segunda camada, não uma substituição do scan.

## O que aprendemos com o INEMA.club

O portal já é muito recuperável e possui robots, sitemap, dados estruturados,
canonical, páginas de conhecimento e catálogo legível. O caso demonstrou que:

- encontrabilidade não comprova WebMCP;
- uma busca web não testa tools ligadas à aba;
- WebMCP melhora operabilidade, não substitui SEO/AEO/GEO;
- agentes externos precisam de MCP/backend ou API;
- validação WebMCP exige ambiente compatível e teste runtime.

## Critérios de sucesso

- taxa de scans concluídos;
- duração p50, p95 e p99;
- falhas por motivo;
- taxa de falso positivo e falso negativo;
- porcentagem de achados com evidência auditável;
- número de correções aplicadas após o relatório;
- evolução antes/depois dos sites;
- sites monitorados ao longo do tempo;
- menções e citações conquistadas;
- utilidade declarada pelos usuários.

## Não objetivos

- garantir ranking ou citação;
- executar ações destrutivas em sites analisados;
- burlar autenticação ou proteção antibot;
- tratar `llms.txt` como requisito universal;
- criar páginas, schemas ou tools artificiais apenas para pontuar;
- esconder limitações metodológicas;
- combinar plataformas de IA diferentes em uma nota opaca.

## Documentos relacionados

- [Índice da documentação](./README.md)
- [Relatório Semrush e monitoramento em IA](./relatorio-semrush-e-monitoramento-ia.md)
- [Validação runtime do INEMA.club](./nota-validacao-runtime-webmcp-inema.md)
- [Estratégia de relevância do INEMA.club](./estrategia-relevancia-inema.md)
- [Estabilidade no Vercel](./diagnostico-estabilidade-vercel.md)
- [Plano do scanner avançado](./plano-scanner-avancado.md)

