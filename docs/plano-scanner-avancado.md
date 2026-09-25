# Plano — scanner WebMCP avançado

## Objetivo

Complementar o scan rápido do `webmcp.inema.pro` com um worker em VPS capaz de
auditar páginas renderizadas, bundles JavaScript externos e, quando o navegador
permitir, ferramentas WebMCP imperativas em tempo de execução.

O scan atual da Vercel continua sendo a primeira camada. A VPS não o substitui:
ela executa o modo aprofundado de forma assíncrona.

## Por que usar uma VPS

- Fixar e atualizar conscientemente a versão do Chrome, Chrome for Testing ou
  Brave usada na auditoria.
- Executar scans mais longos, com limites próprios de CPU, memória e tempo.
- Percorrer um conjunto limitado de URLs do sitemap.
- Baixar e analisar scripts externos que não aparecem em `script.textContent`.
- Manter fila de trabalhos, screenshots, traces e evidências do resultado.
- Separar a navegação passiva da execução controlada de ferramentas.

Uma VPS, por si só, não garante suporte ao WebMCP. O suporte depende também do
navegador, da versão, das flags ou do origin trial e do contexto da página.

## Arquitetura proposta

1. `POST /api/scans` valida a URL e cria um trabalho.
2. Uma fila entrega o trabalho a um worker isolado.
3. O worker faz a auditoria estática e a auditoria no navegador.
4. O resultado é persistido com versão do scanner e do navegador.
5. `GET /api/scans/:id` devolve estado, pontuação e evidências.
6. A interface atual consulta o trabalho até sua conclusão.

### Camadas da auditoria

**Passiva rápida**

- HTTP, redirects, headers, robots, sitemap, metadados e HTML.
- Continua adequada à Vercel e não executa ferramentas.

**Estática aprofundada**

- Baixa bundles JavaScript de mesma origem.
- Procura registro de ferramentas, feature detection, `AbortSignal`, schemas e
  fallbacks.
- Registra o arquivo e o trecho que originaram cada evidência.

**Runtime WebMCP**

- Abre a página em navegador e contexto novos.
- Testa `document.modelContext` e `getTools()`.
- Coleta ferramentas declarativas e imperativas.
- Valida nomes, descrições, schemas, cancelamento e erros.

**Execução controlada**

- Desabilitada por padrão.
- Executa automaticamente apenas ferramentas inequivocamente somente leitura.
- Ferramentas mutáveis ou críticas exigem ambiente de teste e autorização
  explícita.

## Segurança obrigatória

- Bloquear localhost, redes privadas, link-local, metadados de nuvem e DNS
  rebinding antes e durante redirects.
- Usar contexto de navegador novo por scan e processo ou contêiner descartável.
- Limitar páginas, redirects, bytes, downloads, CPU, memória e duração.
- Não reutilizar cookies, credenciais ou armazenamento entre clientes.
- Restringir saída de rede e tipos de arquivo quando possível.
- Manter downloads desativados e não aceitar certificados inválidos.
- Redigir tokens, cookies e dados pessoais dos logs e traces.

## Critério de capacidade da VPS

Configuração inicial recomendada para um worker concorrente:

- Linux `x86_64` ou uma imagem de navegador compatível com a arquitetura usada.
- 2 vCPU.
- 4 GiB de RAM.
- 20 GiB livres em disco.
- Espaço adequado em `/dev/shm` ou configuração explícita do contêiner.
- Node.js LTS, Docker e HTTPS de saída funcionando.
- Chrome/Chrome for Testing na versão exigida pelo WebMCP testado.

Esses valores são ponto de partida, não prova de suporte. A prova é o teste de
runtime descrito abaixo.

## Como validar a VPS

### 1. Inventário sem alterar o servidor

Execute na VPS:

```bash
uname -a
uname -m
nproc
free -h
df -h / /dev/shm
node --version
docker --version
google-chrome --version || chromium --version || chromium-browser --version
curl -I https://www.inema.club/
```

Interpretação:

- Falta de Node, Docker ou Chrome significa apenas que o runtime ainda precisa
  ser instalado; não prova incompatibilidade da VPS.
- Menos de 4 GiB de RAM recomenda limitar a concorrência a um scan por vez.
- Um `/dev/shm` muito pequeno pode causar encerramentos inesperados do Chrome.
- O acesso HTTPS deve funcionar sem ignorar erros de certificado.

### 2. Teste funcional do navegador

No projeto que contém `playwright-core`, execute:

```bash
CHROME_PATH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
node scripts/validar-webmcp-browser.mjs https://www.inema.club/
```

O script faz duas passagens:

1. Chrome normal, que representa o comportamento real dos visitantes.
2. Chrome com `--enable-features=WebMCP`, que representa o laboratório local.

O resultado esperado para uma VPS apta é:

- `browser.launched: true` nas duas passagens.
- `page.secureContext: true`.
- Pelo menos a ferramenta declarativa `buscar_cursos` encontrada no DOM.
- `runtime.modelContext: true` na passagem experimental.
- `runtime.getTools: true` e ferramentas retornadas quando a implementação do
  navegador disponibilizar essa função.

Se o navegador abre, mas `modelContext` continua `false`, a infraestrutura da
VPS está apta e o bloqueio está na versão/configuração do navegador. WebMCP está
em origin trial no Chrome 149 e também pode ser habilitado localmente em
`chrome://flags/#enable-webmcp-testing`.

### 3. Matriz de aceite

| Infraestrutura | API normal | API experimental | Diagnóstico |
| --- | --- | --- | --- |
| Falha | — | — | Corrigir instalação, bibliotecas, sandbox ou recursos da VPS. |
| Passa | Não | Sim | VPS apta; suporte disponível apenas no modo experimental/origin trial. |
| Passa | Sim | Sim | VPS apta e site/navegador com suporte real habilitado. |
| Passa | Não | Não | VPS apta, mas navegador errado, antigo ou sem a feature. |

### 4. Resultado observado neste servidor em 30/08/2026

- Arquitetura: `aarch64` (ARM64).
- Chromium nativo: `151.0.7922.108`.
- Infraestrutura: aprovada; navegador iniciou em modo headless e carregou HTTPS.
- Modo normal: ferramenta declarativa `buscar_cursos` detectada;
  `document.modelContext` ausente.
- Modo experimental com `--enable-features=WebMCP`:
  `document.modelContext` e `getTools()` disponíveis; oito ferramentas do INEMA
  retornadas.
- O binário `@sparticuz/chromium` 149 presente no projeto é `x86-64` e não pode
  ser executado neste host ARM64. Na VPS ARM64, o worker deve usar o Chromium
  nativo ARM64 ou uma imagem de contêiner construída para ARM64.

Conclusão: este servidor tem capacidade para o scanner avançado. O requisito é
selecionar um navegador cuja arquitetura corresponda à VPS; não reutilizar
automaticamente o binário serverless x86-64 da Vercel.

## Fases de implementação

### Fase 1 — worker seguro e observabilidade

- API assíncrona, fila, worker isolado e relatório versionado.
- Proteção SSRF e limites de recursos.
- Screenshot, console, requests, redirects e tempos.

### Fase 2 — crawl e análise estática

- Descoberta limitada por sitemap e links internos.
- Download de bundles de mesma origem.
- Evidências rastreáveis para WebMCP, SEO, AEO e GEO.

### Fase 3 — runtime experimental

- Imagem de navegador fixada e matriz por versão.
- `document.modelContext`, `getTools()` e DevTools Protocol quando disponíveis.
- Comparação entre resultado estático, declarativo e runtime.

### Fase 4 — execução segura

- Ambiente de teste, classificação de risco e política de consentimento.
- Execução somente leitura por padrão.
- Auditoria completa de entradas, saídas e efeitos observados.

## Definição de pronto

- O scanner nunca acessa destinos privados ou metadados da infraestrutura.
- Cada finding aponta para evidência reproduzível.
- O relatório informa navegador, versão, flags, URL final e horário.
- A ausência de `document.modelContext` é diferenciada de falha da VPS.
- O scan rápido continua funcionando se a VPS estiver indisponível.
- Os testes usam páginas seguras conhecidas antes de aceitar URLs públicas.

## Referências oficiais

- [WebMCP no Chrome](https://developer.chrome.com/docs/ai/webmcp)
- [Status de implementação por navegador](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Especificação WebMCP](https://webmachinelearning.github.io/webmcp/)


## Aceite por tarefa — atualização de 24/09/2026

Além da existência e descoberta de ferramentas, o modo futuro de execução controlada deve verificar uma jornada completa em ambiente autorizado:

- Definir estado inicial, pedido, IDs esperados e efeitos permitidos.
- Encadear consulta, filtro, alteração reversível e consulta do estado final.
- Conferir que o retorno estruturado corresponde à interface; repetir a chamada para verificar duplicações.
- Registrar entradas, saídas, duração, erros, cancelamento e alterações parciais.
- Separar ensaio determinístico de callbacks, automação de controles e avaliação por modelo de IA. Só registrar tokens/custo quando medidos no provedor.
- Comparar a mesma tarefa e o mesmo estado inicial; não declarar ganho de desempenho apenas por contar ferramentas.

O laboratório da formação em `https://inematds.github.io/webmcp-2-builder/labs/jornada-estudos.html` oferece uma jornada fictícia e reversível. Seu roteiro local não é um agente nem prova suporte nativo.

O scanner passivo permanece sem executar ferramentas. O extrator estático preserva os quatro hints do draft de 17/09/2026 (`readOnlyHint`, `untrustedContentHint`, `consequentialHint`, `debugging`), como indícios heurísticos, não como garantia de comportamento ou autorização. A execução futura não pode confiar somente em `readOnlyHint` para autorizar chamadas.
