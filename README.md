# WebMCP Readiness

Scanner passivo que abre um site público em Chromium descartável e entrega um diagnóstico rápido de WebMCP, SEO, GEO e AEO, acompanhado de evidências, correções priorizadas e caminhos de aprofundamento.

## Posicionamento

O WebMCP Readiness é um **projeto independente** do ecossistema INEMA. Ele tem
repositório, implantação, banco, documentação e ciclo de evolução próprios.

A Formação WebMCP pode utilizá-lo como laboratório e indicar seus relatórios,
mas o scanner não faz parte do código ou do ciclo de publicação dos cursos.
Essa separação permite corrigir, testar e publicar o produto sem depender de uma
nova versão da formação.

## O que analisa

- **WebMCP:** ferramentas declarativas e imperativas, descoberta estática limitada
  em scripts próprios, schemas, mutações, confirmação humana, cancelamento,
  fallback, Origin Trial, `Origin-Agent-Cluster` e permissões;
- **SEO:** indexabilidade, title, description, canonical, headings, imagens, links, Open Graph e JSON-LD;
- **GEO:** identidade da entidade, conteúdo substancial, autoria, atualização, evidências e descoberta pública;
- **AEO:** perguntas reais, respostas diretas, definições, listas, tabelas e conteúdo extraível;
- **arquivos públicos:** `robots.txt`, `sitemap.xml` e `llms.txt`.

O scan aprofunda apenas a URL informada. O sitemap é inventariado, mas suas
páginas não são rastreadas nesta modalidade. O scanner não executa ferramentas
WebMCP. Ferramentas encontradas em bundles são marcadas como descoberta estática:
isso comprova que há uma definição legível, não que ela esteja registrada ou
executável no navegador de todo visitante. O scanner não promete indexação,
ranking ou citação por IA.

## Relatório

O schema v2 inclui:

- nota geral e quatro notas independentes;
- evidências aprovadas, alertas e bloqueadores;
- até 12 correções priorizadas;
- cursos recomendados no INEMA.CLUB e INEMA PRO;
- próximos scanners avançados, identificados como planejados nas fases Builder, Integrator, Agent Developer e Expert;
- exportação integral em JSON.

## Documentação e roadmap

As pesquisas, decisões e propostas de evolução estão organizadas na
[base de conhecimento do projeto](./docs/README.md). Ela inclui:

- memória e roadmap consolidado;
- estudo do Semrush AI Visibility;
- proposta de monitoramento em plataformas de IA;
- validação runtime WebMCP;
- estratégia de relevância do INEMA.club;
- diagnóstico de estabilidade no Vercel;
- plano do scanner avançado e prompts reutilizáveis.

## Log mínimo de análises

Cada análise concluída escreve uma linha JSON nos logs da função da Vercel, contendo
somente a origem normalizada do site, a nota geral e as quatro notas por dimensão:

```json
{"site":"https://exemplo.com","scores":{"geral":73,"webmcp":62,"seo":82,"geo":70,"aeo":76}}
```

Caminho, parâmetros da URL, endereço IP, título e conteúdo do relatório não são
registrados. Análises que terminam com erro também não entram no log. A retenção e a
consulta seguem as configurações de logs do projeto na Vercel.

## Histórico persistente em Postgres

Quando `DATABASE_URL` está configurada, cada análise concluída também é gravada na
tabela `scan_results`. O banco armazena somente:

- origem normalizada do site;
- nota geral;
- notas WebMCP, SEO, GEO e AEO;
- data da análise.

Para configurar com Neon Postgres:

1. No projeto da Vercel, abra **Storage** e instale a integração **Neon**.
2. Crie ou conecte um banco. A integração adicionará `DATABASE_URL` ao projeto.
3. Execute o conteúdo de `db/schema.sql` uma vez no editor SQL do Neon.
4. Faça um novo deploy para disponibilizar a variável à função.

Se o banco estiver indisponível, o relatório continua sendo entregue ao usuário e a
falha é registrada no log operacional sem expor a conexão.

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

Projeto independente do ecossistema INEMA, utilizado como laboratório pela
[Formação WebMCP](https://inematds.github.io/webmcp-1-formacao/).
