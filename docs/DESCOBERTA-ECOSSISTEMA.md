# Descoberta do WebMCP Readiness — 2026-09-19

O produto publica `sitemap.xml`, `robots.txt`, `llms.txt` e `inema.json`. A home aponta aos índices de descoberta e mantém JSON-LD com a identidade canônica da organização INEMA.

O manifesto não declara ferramentas WebMCP próprias: analisar outros sites não equivale a oferecer uma ferramenta no navegador. O scanner continua passivo e não ganhou rastreamento completo de sitemap ou consumo automático de manifestos nesta entrega.

A interface permanece em PT; as homes PT/EN/ES relacionadas pertencem a portal, News e Eventos. O sitemap deste produto inclui apenas sua home.

Verificação: `npm test`, `npm run check`, leitura dos arquivos e do JSON-LD. Publicação por git + push. Versão desta entrega: 2.2.1.

## Contrato e manutenção

`inema.json` é um manifesto próprio do INEMA, schema 1.0. Descreve identidade, idiomas, acesso, índices e relações. Não é padrão WebMCP nem comprovação de execução. `runtime_verified: false` significa que esta publicação não certifica o runtime das ferramentas.

`llms.txt` orienta a leitura; sitemap lista páginas públicas canônicas. Não colocar APIs, login, parâmetros de busca ou acervo restrito no sitemap. Manter traduções apenas quando a rota existe. Nunca usar o horário do build como atualização do conteúdo.

O catálogo central do ecossistema e a comparação automática de manifestos pelo scanner continuam planejados. Nesta entrega são publicadas as fontes de descoberta que poderão alimentá-los.

## Referências

- [Google: construção de sitemaps e lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Proposta llms.txt e descoberta por links](https://llmstxt.org/).
- [Chrome: ferramentas WebMCP registradas](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools).
