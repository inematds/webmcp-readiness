# WebMCP Readiness

Scanner passivo que abre um site público em Chromium descartável e entrega um diagnóstico rápido de WebMCP, SEO, GEO e AEO, acompanhado de evidências, correções priorizadas e caminhos de aprofundamento.

## O que analisa

- **WebMCP:** ferramentas declarativas e imperativas, schemas, mutações, confirmação humana, cancelamento, fallback e permissões;
- **SEO:** indexabilidade, title, description, canonical, headings, imagens, links, Open Graph e JSON-LD;
- **GEO:** identidade da entidade, conteúdo substancial, autoria, atualização, evidências e descoberta pública;
- **AEO:** perguntas reais, respostas diretas, definições, listas, tabelas e conteúdo extraível;
- **arquivos públicos:** `robots.txt`, `sitemap.xml` e `llms.txt`.

O scan aprofunda apenas a URL informada. O sitemap é inventariado, mas suas páginas não são rastreadas nesta modalidade. O scanner não executa ferramentas WebMCP e não promete indexação, ranking ou citação por IA.

## Relatório

O schema v2 inclui:

- nota geral e quatro notas independentes;
- evidências aprovadas, alertas e bloqueadores;
- até 12 correções priorizadas;
- cursos recomendados no INEMA.CLUB e INEMA PRO;
- próximos scanners avançados, identificados como planejados nas fases Builder, Integrator, Agent Developer e Expert;
- exportação integral em JSON.

## Executar na Vercel

1. Importe este repositório na Vercel, sem selecionar um framework.
2. Mantenha o diretório raiz como `./`.
3. Publique. A página estática e a função `/api/readiness` são detectadas automaticamente.

Também é possível usar a CLI:

```bash
npm install
npx vercel dev
npx vercel deploy --prod
```

## Segurança

URLs com credenciais, protocolos diferentes de HTTP/HTTPS e endereços privados são bloqueados. Redirecionamentos dos arquivos públicos são revalidados, as respostas têm limite de tamanho e cada análise usa um novo contexto de navegador.

Projeto associado à [Formação WebMCP](https://inematds.github.io/webmcp-1-formacao/).
