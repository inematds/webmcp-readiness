# WebMCP Readiness

Scanner passivo que abre um site público em um Chromium descartável, descobre sinais de WebMCP e entrega uma pontuação acompanhada de evidências e recomendações.

## O que analisa

- contexto seguro e URL final;
- formulários declarativos com `toolname`;
- ferramentas expostas por `document.modelContext.getTools()`;
- nomes, descrições, schemas e anotações;
- sinais de mutação, confirmação humana, cancelamento e fallback;
- cabeçalhos de política de permissões.

O scanner não executa ferramentas. O relatório é uma avaliação técnica inicial, não uma certificação de segurança.

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

URLs com credenciais, protocolos diferentes de HTTP/HTTPS e endereços privados são bloqueados. Cada análise usa um novo contexto de navegador, bloqueia downloads e não executa ferramentas WebMCP.

Projeto associado à [Formação WebMCP](https://inematds.github.io/webmcp-1-formacao/).
