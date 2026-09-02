# Relatório Semrush e proposta de monitoramento em plataformas de IA

> Documento de memória do projeto WebMCP Readiness  
> Atualizado em: 1º de setembro de 2026

## Objetivo

Registrar o que foi observado no Semrush AI Visibility e definir como o WebMCP Readiness pode evoluir de um scanner técnico pontual para uma plataforma que também mede a presença real de uma marca nas respostas de sistemas de IA.

## Resumo executivo

O WebMCP Readiness e o Semrush AI Visibility resolvem problemas relacionados, mas diferentes:

- **WebMCP Readiness:** verifica se o site está tecnicamente e editorialmente preparado para WebMCP, SEO, AEO e GEO, apresenta evidências e recomenda correções.
- **Monitoramento de IA:** executa uma biblioteca controlada de perguntas em diferentes plataformas, observa as respostas e mede menções, citações, concorrentes, percepção e evolução.

O produto deve manter essa separação visível:

1. **Scan rápido — “Seu site está preparado?”**
2. **Monitoramento — “As IAs estão encontrando, citando e recomendando sua marca?”**

Não existe uma posição universal e estável nas plataformas de IA. As respostas variam com plataforma, modelo, data, idioma, país, sessão e formulação do prompt. Portanto, a medida deve ser apresentada como uma **estimativa observada em uma amostra controlada**, nunca como verdade absoluta.

## O que foi observado na sessão autenticada do Semrush

A navegação foi feita na sessão autenticada já aberta no Firefox, usando somente os relatórios de demonstração. Não foi iniciado trial e nenhuma configuração da conta foi alterada.

### Visibility Overview

O painel apresenta:

- nota de visibilidade de 0 a 100, acompanhada de classificação verbal;
- evolução histórica;
- filtros por país, plataforma de IA e data;
- distribuição de menções por LLM;
- páginas citadas;
- citações e países de origem;
- tópicos, fontes e oportunidades;
- recomendações de próximos passos.

### Competitor Research

Permite informar a marca e até quatro concorrentes para localizar:

- tópicos em que os concorrentes aparecem e a marca não;
- prompts fracos ou ausentes;
- diferenças de menções e citações;
- oportunidades editoriais e competitivas.

Na demonstração, a execução completa dessa área exigia trial.

### Prompt Research

Funciona como uma pesquisa de temas para a era da IA:

- perguntas relacionadas a um assunto;
- agrupamento semântico por tópico;
- estimativa de volume do tópico;
- dificuldade competitiva;
- intenção da consulta.

Uma pesquisa própria exigia trial, mas a estrutura da funcionalidade estava visível.

### Brand Performance

O relatório de demonstração mostrou:

- share of voice comparado com concorrentes;
- sentimento associado a cada marca;
- filtros por plataforma;
- recomendações estratégicas geradas a partir dos dados;
- ligação entre os insights e os relatórios de percepção e narrativa.

### Perception

Compara como as plataformas descrevem cada marca e apresenta:

- percepção por ChatGPT, Gemini, Perplexity e Google AI;
- pontos fortes e fracos da narrativa;
- diferenças entre plataformas;
- sugestões para corrigir mensagens imprecisas ou incompletas.

### Narrative Drivers

Mostra quais tópicos, respostas e fontes estão formando a narrativa da marca:

- share of voice por plataforma;
- temas dominados por cada concorrente;
- páginas e publicadores que funcionam como fonte;
- ações para a marca se tornar uma referência citável.

### Questions

Organiza as perguntas monitoradas por:

- tópico;
- intenção;
- distribuição de demanda;
- presença da marca e concorrentes;
- oportunidades de conteúdo.

### Aprendizado de produto

O ponto mais valioso da interface não é o gráfico isolado. Cada conjunto de métricas é convertido em uma explicação e em uma ação, por exemplo:

- torne-se a fonte de referência sobre determinado assunto;
- corrija uma percepção inconsistente;
- publique uma página para responder a uma pergunta ainda descoberta;
- supere um concorrente em um tópico específico.

O WebMCP Readiness deve seguir esse princípio: **evidência → diagnóstico → impacto → correção sugerida**.

## Parte 2 — Como medir nas plataformas de IA

### 1. Unidade básica: uma observação

Cada execução de um prompt em uma plataforma gera uma observação imutável:

```text
projeto + prompt + plataforma + modelo/modo + país + idioma
+ data/hora + repetição + resposta + citações + métricas extraídas
```

Exemplo:

```json
{
  "domain": "inema.club",
  "platform": "chatgpt-search",
  "prompt": "Qual é a melhor formação de WebMCP em português?",
  "locale": "pt-BR",
  "country": "BR",
  "observedAt": "2026-09-01T15:00:00Z",
  "brandMentioned": true,
  "mentionOrder": 2,
  "domainCited": true,
  "citedUrls": ["https://inema.club/..."],
  "sentiment": 0.72,
  "competitorsMentioned": ["concorrente.example"]
}
```

O sistema deve guardar também a resposta original, os trechos que justificam cada métrica e a versão do extrator. Assim o resultado pode ser auditado e recalculado.

### 2. Biblioteca de prompts

Para cada domínio, o sistema gera e permite revisar uma biblioteca com cinco grupos:

1. **Marca:** “O que é INEMA?”, “O INEMA é confiável?”
2. **Descoberta:** “Onde aprender WebMCP em português?”
3. **Problema/intenção:** “Como preparar meu site para agentes de IA?”
4. **Comparação:** “Quais são as melhores formações de WebMCP?”
5. **Conversão/local:** “Qual curso devo fazer para implementar WebMCP no meu site?”

O scan atual pode sugerir esses prompts usando títulos, headings, schema.org, entidades, produtos, serviços, localização e perguntas já existentes no site. O usuário aprova o conjunto antes do monitoramento.

### 3. Execução controlada

Para permitir comparação ao longo do tempo, cada campanha fixa:

- plataforma e modo de pesquisa;
- país e idioma;
- prompt exato e categoria;
- frequência de execução;
- número de repetições;
- concorrentes monitorados;
- janela temporal do relatório.

Uma resposta isolada é fraca como evidência. Para um MVP, recomenda-se executar cada prompt duas ou três vezes por plataforma e usar a taxa de ocorrência. O histórico deve mostrar média e dispersão, não somente o último resultado.

### 4. Métricas fundamentais

#### Taxa de presença

```text
observações em que a marca foi mencionada
───────────────────────────────────────── × 100
total de observações válidas
```

Responde: **com que frequência a IA conhece ou recomenda a marca?**

#### Taxa de citação

```text
observações que citaram uma URL do domínio
────────────────────────────────────────── × 100
total de observações válidas
```

Responde: **com que frequência o site é usado explicitamente como fonte?**

Menção e citação devem permanecer separadas. Uma IA pode citar o conteúdo sem mencionar a marca ou mencionar a marca sem fornecer link.

#### Cobertura de tópicos

```text
tópicos com pelo menos uma menção da marca
─────────────────────────────────────────── × 100
total de tópicos monitorados
```

Responde: **em quantas áreas importantes a marca está presente?**

#### Consistência

```text
repetições com menção para o mesmo prompt
────────────────────────────────────────── × 100
repetições válidas desse prompt
```

Responde: **a presença se repete ou foi um resultado ocasional?**

#### Share of voice

```text
menções da marca
──────────────────────────────── × 100
menções de todas as marcas monitoradas
```

Deve ser calculado por tópico e plataforma antes de qualquer visão agregada.

#### Share of citations

```text
citações do domínio
────────────────────────────────── × 100
citações dos domínios monitorados
```

Responde: **quanto da autoridade citada pertence ao site?**

#### Proeminência

Como respostas de IA não possuem a mesma lista ordenada dos buscadores, a proeminência pode combinar:

- ordem em que a marca aparece entre as marcas citadas;
- posição do primeiro trecho que menciona a marca;
- presença na recomendação principal ou apenas em uma lista secundária;
- ordem da primeira citação do domínio;
- quantidade de espaço dedicado à marca.

Essa métrica deve ser chamada de **proeminência observada**, não de posição orgânica.

#### Sentimento e percepção

Cada trecho relacionado à marca recebe:

- polaridade de -1 a +1;
- classificação positiva, neutra ou negativa;
- temas associados;
- afirmações factuais detectadas;
- evidência textual;
- confiança da classificação.

Além do sentimento, o sistema pode comparar afirmações da resposta com fatos oficiais cadastrados pela marca e sinalizar informações incorretas ou desatualizadas.

### 5. Nota de visibilidade proposta

Uma nota própria pode ser calculada, desde que a fórmula seja pública:

```text
30% cobertura de tópicos
25% consistência de menções
20% share of voice
15% taxa de citação
10% proeminência
```

O resultado é normalizado de 0 a 100. Os pesos podem evoluir depois da validação com dados reais.

Regras importantes:

- mostrar primeiro as notas individuais de cada plataforma;
- nunca esconder a quantidade de prompts e execuções usadas;
- exibir intervalo, variação e data da amostra;
- não comparar campanhas com bibliotecas de prompts muito diferentes;
- manter sentimento fora da nota de visibilidade, pois uma marca pode ser muito visível e mal percebida.

### 6. Como coletar em cada plataforma

#### ChatGPT com pesquisa web

A OpenAI oferece pesquisa web na Responses API. Ela retorna uma resposta baseada em pesquisa e permite extrair as fontes. É adequada para uma medição automatizada e auditável.

Entretanto, uma execução pela API não deve ser apresentada como reprodução exata da interface pública do ChatGPT. O relatório deve identificar o ambiente como “OpenAI API com web search”, incluindo modelo e data.

#### Gemini com Google Search

A Gemini API oferece Grounding with Google Search e devolve anotações de citação estruturadas. Isso permite medir menções, URLs citadas e recorrência com boa rastreabilidade.

Também aqui a medição deve registrar “Gemini API com Google Search”, sem afirmar que o resultado é idêntico ao aplicativo Gemini para consumidores.

#### Perplexity

A Perplexity oferece Sonar para respostas com pesquisa e citações, além de uma Search API para resultados web estruturados. Para visibilidade em respostas, o Sonar é a referência mais próxima; para posição em resultados de pesquisa, usa-se a Search API.

O relatório deve separar “resposta Sonar” de “resultado da Search API”.

#### Google AI Mode e AI Overviews

O Google informa que AI Mode e AI Overviews podem usar técnicas e modelos diferentes, e que AI Overviews nem sempre são acionados. O Search Console agrega o desempenho dessas experiências ao tipo de pesquisa “Web”; ele não fornece ao proprietário uma posição universal isolada para cada resposta de IA.

Há três caminhos possíveis:

1. observação autorizada da interface, com país, conta e dispositivo controlados;
2. contratação de um provedor especializado em resultados de busca/AI Overview;
3. uso do Search Console para tráfego agregado, sem fingir que ele identifica todas as citações individuais.

Para o MVP, Google AI Mode/Overview pode ser marcado como integração avançada, evitando automação frágil ou incompatível com termos de uso.

### 7. APIs não são interfaces de consumidor

Esse é o principal limite metodológico do produto:

```text
API com pesquisa ≠ interface pública da plataforma
```

As APIs oferecem repetibilidade, campos estruturados e integração segura, mas podem usar modelos, contexto e mecanismos de recuperação diferentes. O produto deve mostrar claramente a origem de cada observação.

Quando for necessário medir a interface pública, deve-se usar somente um mecanismo permitido, com autorização da conta e respeito aos termos da plataforma. A coleta nunca deve tentar burlar autenticação, limites ou mecanismos antibot.

### 8. Arquitetura recomendada

```text
Scanner do domínio
       ↓
Entidades, tópicos, perguntas e concorrentes sugeridos
       ↓
Biblioteca de prompts aprovada
       ↓
Agendador de campanhas
       ↓
Adaptadores das plataformas
       ↓
Respostas e citações brutas
       ↓
Extrator de marca, fontes, sentimento e proeminência
       ↓
Banco de observações
       ↓
Notas por plataforma + histórico + recomendações
```

Tabelas mínimas:

- `ai_projects`
- `ai_competitors`
- `ai_prompt_sets`
- `ai_prompts`
- `ai_runs`
- `ai_observations`
- `ai_brand_mentions`
- `ai_citations`
- `ai_narratives`

Credenciais das plataformas nunca devem ficar nessas tabelas em texto aberto. Devem ser armazenadas como variáveis secretas do ambiente ou em um cofre apropriado.

### 9. Escopo de implantação

#### Fase 2A — Snapshot experimental

- gerar de 12 a 20 prompts a partir do scan;
- usuário revisa os prompts e concorrentes;
- executar em OpenAI, Gemini e Perplexity por APIs oficiais;
- fazer duas repetições por prompt;
- entregar presença, citações, páginas citadas e evidências;
- identificar claramente o resultado como amostra experimental.

Com 20 prompts, três plataformas e duas repetições, uma análise produz 120 observações.

#### Fase 2B — Monitoramento

- campanhas de 30 a 100 prompts;
- execução diária ou semanal;
- histórico e alertas de ganho/perda;
- share of voice por concorrente;
- sentimento, percepção e narrativa;
- exportação em PDF/CSV/JSON.

#### Fase 2C — Benchmark coletivo

- agregar somente métricas não sensíveis de sites analisados;
- criar referências por setor, idioma e país;
- apresentar percentis, por exemplo “seu domínio está entre os 20% mais citados da categoria”;
- permitir opt-out e respeitar privacidade.

## Como a parte 2 se conecta ao scanner atual

O scan rápido continua sendo a porta de entrada:

```text
1. O site está acessível e compreensível?
2. Que entidades, assuntos, serviços e perguntas ele representa?
3. Que prompts um usuário faria sobre esses assuntos?
4. As plataformas mencionam ou citam o domínio nesses prompts?
5. Quais mudanças técnicas e editoriais podem melhorar o resultado?
6. O resultado melhorou após a mudança?
```

Assim, o WebMCP Readiness deixa de ser apenas uma fotografia e forma um ciclo completo:

```text
DIAGNOSTICAR → CORRIGIR → MEDIR → COMPARAR → MONITORAR
```

## Fontes e validação

- [Origem dos dados e metodologia do AI Visibility Toolkit — Semrush](https://www.semrush.com/kb/1607-semrush-ai-visibility-data)
- [Guia do AI Visibility Toolkit — Semrush](https://www.semrush.com/kb/1496-getting-started-with-ai-visibility-toolkit)
- [Métricas do Visibility Overview — Semrush](https://www.semrush.com/kb/1596-visibility-overview-report)
- [Prompt Tracking — Semrush](https://www.semrush.com/kb/1503-prompt-tracking)
- [Metodologia do AI Visibility Index — Semrush](https://ai-visibility-index.semrush.com/methodology)
- [Web search na OpenAI API](https://platform.openai.com/docs/quickstart/make-your-first-api-request)
- [Grounding with Google Search na Gemini API](https://ai.google.dev/gemini-api/docs/google-search)
- [AI Mode e AI Overviews para proprietários de sites — Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)
- [APIs de pesquisa e respostas com citações — Perplexity](https://docs.perplexity.ai/docs/getting-started/quickstart)

## Decisão recomendada

Implementar primeiro a Fase 2A como um módulo opcional chamado **“Presença nas IAs — análise experimental”**. Ela aproveita o scan existente para gerar a biblioteca inicial, usa integrações oficiais e mantém total transparência sobre plataforma, modelo, amostra e limitações.

Depois de coletar dados suficientes e validar a estabilidade das métricas, evoluir para campanhas recorrentes e comparação competitiva.
