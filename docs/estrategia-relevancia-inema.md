# Estratégia — tornar o INEMA.club mais relevante para busca e IA

> Análise baseada na home, catálogo, páginas de curso, área de conhecimento,
> robots, sitemap e dados estruturados observados em setembro de 2026.

## Diagnóstico resumido

O INEMA.club já está forte em encontrabilidade e estrutura técnica. O próximo
salto é deixar de ser apenas recuperável e tornar-se uma fonte confiável,
citável e recomendável.

| Dimensão | Avaliação atual |
|---|---|
| Encontrabilidade | Forte |
| Rastreamento e indexabilidade | Forte |
| Dados estruturados | Boa base |
| Identidade da organização | Boa base, com inconsistências a corrigir |
| Profundidade das páginas de curso | Insuficiente |
| Conteúdo original e demonstrável | Grande oportunidade |
| Autoridade externa | Precisa ser fortalecida |
| Operabilidade WebMCP | Implementação indicada; runtime ainda precisa ser validado |

## Pontos fortes observados

- `robots.txt` permite crawlers relevantes;
- sitemap geral e sitemap de cursos;
- canonical;
- RSS;
- HTML com conteúdo visível;
- `EducationalOrganization`, `Course`, `BreadcrumbList` e `FAQPage`;
- autoria e datas;
- área de conhecimento;
- desambiguação entre INEMA.club e o órgão ambiental;
- catálogo amplo e legível;
- endpoint de Origin Trial WebMCP carregado no portal;
- tools encontradas estaticamente pelo scanner.

## Prioridade 1 — páginas de curso completas

As páginas atuais funcionam como fichas de encaminhamento. Cada curso deve ter:

- público-alvo;
- pré-requisitos;
- carga horária;
- módulos e aulas;
- resultados de aprendizagem;
- projeto final;
- tecnologias;
- nível justificado;
- gratuidade, preço ou condição de acesso;
- exemplos e demonstrações;
- autor e experiência relacionada;
- data e histórico de atualização;
- relação com a trilha anterior e seguinte;
- perguntas específicas, não genéricas.

A página do portal deve ser autossuficiente, mesmo quando o curso completo estiver
em uma aplicação GitHub Pages.

## Prioridade 2 — consolidar páginas superficiais

Auditar as páginas `faq-*` e unir variações semelhantes em guias completos. Evitar
uma página curta para cada formulação de busca.

Exemplo de consolidação:

```text
Guia para aprender agentes de IA em português
├── iniciante
├── gratuito
├── sem programação
├── com programação
├── ferramentas
├── projetos
└── trilha recomendada
```

## Prioridade 3 — conteúdo exclusivo

Publicar informação que somente o INEMA pode produzir:

- casos reais de implementação;
- erros e decisões técnicas;
- projetos de alunos;
- benchmarks;
- dados agregados do WebMCP Readiness;
- comparações antes/depois;
- laboratórios com código;
- vídeos com transcrição;
- metodologia própria;
- pesquisas sobre formação em IA no Brasil.

Ideias de estudos:

```text
Analisamos 500 sites brasileiros: quantos estão prontos para agentes?
```

```text
Implementamos WebMCP no INEMA.club: arquitetura, falhas e resultados.
```

## Prioridade 4 — identidade consistente

- escolher a denominação principal da marca;
- confirmar o LinkedIn oficial de Nei Maldaner;
- remover textos públicos marcados como pendentes;
- manter uma descrição institucional única;
- explicar claramente INEMA.club, INEMA.pro e INEMA.VIP;
- consolidar `sameAs`;
- publicar contato, responsabilidade editorial e política de atualização;
- alinhar site, GitHub, YouTube e redes sociais.

## Prioridade 5 — hubs de formação

Criar páginas centrais para WebMCP, agentes, Claude Code, Codex, automação e
outras áreas principais. Cada hub deve explicar progressão, cursos, resultados,
pré-requisitos, projetos e próximos passos.

## Prioridade 6 — validação externa legítima

- fazer os repositórios apontarem para páginas canônicas do portal;
- conectar vídeos, eventos, cursos e autor;
- incentivar projetos e relatos verificáveis de alunos;
- participar de publicações, entrevistas e comunidades relevantes;
- buscar menções editoriais reais, não links artificiais.

## Prioridade 7 — medir o resultado

- Search Console;
- relatório de recursos generativos do Google, quando disponível na propriedade;
- tráfego originado por plataformas de IA;
- páginas citadas;
- prompts com presença da marca;
- share of voice e concorrentes;
- conversão de artigo para curso, comunidade ou assinatura;
- evolução antes/depois de cada melhoria.

## Papel do WebMCP

WebMCP não torna automaticamente o portal mais relevante para uma busca web. Ele
torna a página mais operável quando um agente compatível está presente na aba.

```text
Conteúdo e reputação
→ encontrabilidade, citação e recomendação

WebMCP
→ descoberta e execução de capacidades da página
```

Para agentes externos, considerar também MCP de backend ou API persistente.

## Resultado desejado

```text
Hoje
→ “A IA encontrou um curso do INEMA.”

Objetivo
→ “A IA reconhece o INEMA.club como uma das principais fontes brasileiras
   de formação prática em inteligência artificial e recomenda a página certa.”
```

