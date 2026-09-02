# Nota futura — validação runtime do WebMCP no INEMA.club

> Memória para retomarmos o trabalho no portal, no prompt e no scanner.  
> Registrado em 1º de setembro de 2026.

## Conclusão

O INEMA.club comprova boa encontrabilidade, conteúdo recuperável, fallback humano e intenção editorial de oferecer WebMCP. Isso não comprova, sozinho, que as tools estejam registradas e executáveis em runtime.

Também não se deve esperar que um agente externo fazendo busca web descubra tools WebMCP. Pela arquitetura atual, elas são efêmeras, ligadas à aba aberta e descobertas por um agente de navegador compatível.

## Correção técnica

A API atual está associada a `document`:

```js
document.modelContext
```

Não usar `navigator.modelContext` como evidência principal.

O teste mínimo é:

```js
const tools = await document.modelContext.getTools();
console.log(tools);
```

E a execução manual de uma tool descoberta:

```js
const [tool] = await document.modelContext.getTools();

const result = await document.modelContext.executeTool(
  tool,
  JSON.stringify({ tema: "agentes" })
);
```

## Quatro conceitos que não devem ser confundidos

### Existe

A implementação está presente no código ou no deploy.

### É registrada

A página executou o registro e a tool entrou no `ModelContext` da aba atual.

### É descobrível no ambiente correto

Um navegador/agente WebMCP compatível consegue executar `getTools()` e receber nome, descrição e schema.

### É utilizável

A tool aceita argumentos válidos, executa a ação, respeita permissões e devolve um resultado compreensível.

## Agente externo versus agente de navegador

O teste por busca web segue este caminho:

```text
pergunta
→ índice ou recuperação web
→ conteúdo público
→ resposta
```

O teste WebMCP segue outro caminho:

```text
usuário abre o site
→ página registra tools
→ navegador compatível expõe o catálogo
→ agente da aba descobre uma tool
→ agente executa a tool
→ resultado volta dentro da experiência aberta
```

Logo, o fato de uma interface do ChatGPT encontrar os cursos, mas não as tools, não mede a descobribilidade WebMCP. Mede apenas a ótima recuperabilidade do catálogo e a ausência de uma ponte WebMCP naquele ambiente.

Se quisermos que agentes externos encontrem capacidades sem uma aba aberta, será necessária uma camada persistente, como MCP de backend ou API. A arquitetura pode ser híbrida:

```text
MCP/backend
→ agentes externos, cloud e automações persistentes

WebMCP
→ agente presente na aba, com DOM, cookies, sessão e estado atual
```

## Estados que o scanner deverá usar

### Confirmado

```text
✅ Ambiente compatível, tool descoberta e execução validada.
```

### Ausente ou inválido

```text
❌ Ambiente compatível, mas nenhuma tool foi registrada,
o contrato é inválido ou a execução falhou.
```

### Não verificável

```text
◐ O ambiente não oferece WebMCP, a API não estava habilitada
ou o estado necessário não estava acessível.
```

“Não verificável” deve diminuir a confiança, não virar nota zero automaticamente.

## Trabalho futuro no INEMA.club

1. Localizar o código efetivamente usado no deploy.
2. Procurar `document.modelContext`, `registerTool` e implementação declarativa.
3. Verificar se o registro depende da disponibilidade da API, rota, login ou estado.
4. Abrir o portal em Chrome compatível com WebMCP, origin trial ou flag de teste.
5. Usar o Model Context Tool Inspector.
6. Executar `getTools()` e salvar o catálogo observado.
7. Validar schema, retorno, cancelamento, erros, permissões e efeitos colaterais.
8. Começar pelas tools somente de leitura:
   - `search_courses`;
   - `get_course`;
   - `recommend_course`;
   - `list_free_courses`;
   - `search_projects`.
9. Testar se um modelo escolhe a tool correta para intenções reais.
10. Preservar o catálogo público e a jornada manual como fallback.

## Melhorias futuras no prompt

O prompt de análise deverá:

- distinguir evidência estática de runtime;
- nunca provar WebMCP apenas pela presença da palavra “WebMCP”;
- nunca provar ausência apenas porque o código não apareceu no HTML ou GitHub;
- usar `document.modelContext`;
- registrar navegador, versão, flag/origin trial e suporte da API;
- classificar conclusões como `confirmado`, `ausente`, `não verificável` ou `inferência`;
- exigir evidência de nome, descrição, schema, retorno e efeito da tool;
- distinguir agente de busca, agente externo e agente integrado ao navegador;
- explicar que WebMCP não substitui SEO, AEO ou GEO.

## Melhorias futuras no scanner

### Scan rápido

Continuar avaliando HTTP, indexabilidade, sitemap, HTML semântico, dados estruturados, conteúdo citável, fallback humano e indícios estáticos de WebMCP.

O scan rápido pode dizer “indício encontrado”, mas não “tool confirmada”.

### Scan runtime avançado

```text
abrir página em ambiente compatível
→ confirmar document.modelContext
→ executar getTools()
→ validar contratos
→ executar tools seguras
→ guardar evidências
→ testar seleção pelo agente
```

### Pontuação

Separar três resultados:

- prontidão estática;
- implementação WebMCP confirmada;
- confiança da análise.

Quando o runtime não puder ser executado, mostrar a nota estática e marcar a camada runtime como “não verificada”.

## Princípio de produto

```text
SEO encontra.
AEO responde.
GEO ajuda a IA a compreender, usar e citar.
WebMCP permite ao agente de navegador executar capacidades da página.
MCP disponibiliza capacidades persistentes a agentes externos.
```

## Referências

- [Especificação atual do WebMCP](https://webmachinelearning.github.io/webmcp/)
- [WebMCP no Chrome](https://developer.chrome.com/docs/ai/webmcp)
- [API imperativa e descoberta de tools](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Quando usar WebMCP e MCP](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)
- [INEMA.club](https://www.inema.club/)
- [Catálogo de cursos do INEMA.club](https://www.inema.club/cursos/)
