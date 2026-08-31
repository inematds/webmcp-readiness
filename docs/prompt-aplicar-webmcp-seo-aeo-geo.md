# Prompt reutilizável — WebMCP, SEO, AEO e GEO

Substitua os valores entre colchetes antes de usar. Se ainda não existir um
relatório, deixe o respectivo campo vazio para que a auditoria seja produzida
antes da implementação.

```text
Quero preparar e otimizar o site [URL_DO_SITE] para WebMCP, SEO, AEO e GEO.

Repositório local:
[CAMINHO_DO_REPOSITORIO]

Relatório de diagnóstico, se existir:
[CAMINHO_DO_RELATORIO]
Caso não exista, produza primeiro um diagnóstico equivalente.

Domínio preferido:
[COM_WWW / SEM_WWW / AUDITAR_ANTES]

Origin Trial WebMCP:
[TOKEN_JA_CONFIGURADO / PRECISA_REGISTRAR / NAO_APLICAVEL]

Execute o trabalho de ponta a ponta seguindo estas regras:

1. Comece auditando o repositório
- Leia instruções como AGENTS.md, CLAUDE.md e README.
- Identifique framework, comandos, arquitetura, hospedagem e domínio canônico.
- Verifique git status, branch, remotos e alterações existentes.
- Preserve integralmente alterações que já existirem.
- Não sobrescreva nem reverta trabalho de terceiros.
- Antes de editar, confira também o site publicado.

2. Estabeleça a URL canônica
- Determine se o domínio oficial será com ou sem www.
- Verifique redirects HTTP, HTTPS, www e domínio raiz.
- Use uma única origem canônica em canonical, sitemap, JSON-LD, Open Graph,
  APIs e URLs geradas.
- Não altere a preferência de domínio sem apresentar evidências.

3. Implemente SEO técnico
- Título e descrição específicos.
- Canonical absoluta.
- Open Graph e Twitter Cards.
- robots.txt e sitemap.
- Sitemap adicional quando houver muitos cursos, produtos ou páginas.
- JSON-LD coerente com o conteúdo visível.
- Hierarquia correta de H1, H2 e H3.
- URLs estáticas e indexáveis para conteúdos importantes.
- Alt em imagens e links internos HTML.
- Feed RSS e llms.txt quando fizer sentido.

4. Implemente AEO e GEO
- Respostas diretas para perguntas importantes.
- Seções de perguntas frequentes sem conteúdo artificial.
- Entidade publicadora, autoria, contato e data de atualização.
- Páginas sobre, metodologia, fontes e limitações.
- Conteúdo factual acessível em HTML, não apenas dentro de JavaScript.
- APIs públicas somente leitura para cursos, projetos, artigos, produtos ou
  outros dados relevantes.
- Dados estruturados coerentes com essas informações.
- Nunca invente credenciais, números, avaliações, autoria ou fontes.

5. Implemente WebMCP como progressive enhancement
- Audite os fluxos reais do site e transforme apenas ações úteis em ferramentas.
- Crie ferramentas imperativas com nomes verbais, descrições claras,
  inputSchema e retorno estruturado.
- Faça feature detection de document.modelContext.
- Implemente AbortSignal ou cancelamento quando aplicável.
- Preserve sempre um caminho manual visível.
- Não registre ferramentas destrutivas ou críticas sem confirmação humana.
- Diferencie ferramentas readOnly de ferramentas mutáveis.
- Evite registrar ferramentas duplicadas.
- Não quebre navegadores sem suporte WebMCP.
- Enquanto WebMCP estiver experimental, verifique na documentação oficial se a
  origem precisa participar do Chrome Origin Trial.
- Se precisar, nunca invente nem copie token de outro domínio. Prepare uma
  variável server-only, documente a emissão para a origem exata e trate token
  ausente ou expirado como pendência operacional.
- Não confunda “código registrado”, “ferramenta detectada estaticamente” e
  “ferramenta executável por um visitante comum”; reporte os três estados.

6. Crie pelo menos uma ferramenta declarativa
- Use um formulário real e útil para visitantes.
- Adicione toolname, tooldescription e descrições dos parâmetros.
- Garanta que o formulário continue funcionando normalmente sem WebMCP.
- Use a ferramenta declarativa também como fallback observável por scanners que
  não expõem document.modelContext.

7. Cabeçalhos e segurança
- Configure Permissions-Policy apropriada.
- Para WebMCP, verifique `Permissions-Policy: tools=(self)` e não aceite a mera
  presença de qualquer Permissions-Policy como aprovação.
- Envie `Origin-Agent-Cluster: ?1` explicitamente nas páginas WebMCP; trate
  `Origin-Agent-Cluster: ?0` como bloqueador.
- Mantenha HTTPS e contexto seguro.
- Não permita certificados inválidos.
- Não exponha tokens, segredos ou dados pessoais.
- Confirme que ferramentas WebMCP críticas exigem interação humana.
- Não reduza proteções de segurança apenas para aumentar pontuação.

8. Observabilidade e teste WebMCP
- Registre duração, sucesso/erro e nome das chamadas sem enviar dados ao servidor
  por padrão.
- Redija e-mails, tokens, credenciais e dados pessoais antes de qualquer log.
- Limite e permita limpar o histórico da sessão.
- Quando a API oferecer `getTools` e `executeTool`, crie um autoteste que execute
  somente ferramentas read-only com entradas sintéticas e seguras.
- Nunca inclua ferramentas mutáveis no autoteste.

9. Compatibilidade com aplicações modernas e scanners
- Se o site usar Next.js, React ou bundles externos, não presuma que scanners
  passivos conseguem ler o código das ferramentas imperativas.
- Disponibilize sinais declarativos e fallbacks em HTML.
- Não duplique textos ou controles apenas para enganar o scanner.
- Garanta que tudo acrescentado tenha utilidade real para o usuário.
- Em bundles externos, leia estaticamente apenas scripts permitidos e com limites
  de quantidade, tamanho e tempo; não execute ferramentas durante o scan.
- Deduplicate ferramentas dinâmicas, declarativas e encontradas estaticamente.
- Marque claramente descoberta estática como heurística e preserve a limitação
  “zero encontrado não prova ausência”.
- Verifique token de Origin Trial em meta tag ou cabeçalho, HTTPS,
  `Origin-Agent-Cluster`, `Permissions-Policy` e feature detection.
- Não transforme sugestões heurísticas em fatos. Antes de recomendar uma nova
  ferramenta, compare intenção, parâmetros e resultado com as já existentes.

10. Validação local
- Execute lint, testes, typecheck e build disponíveis.
- Corrija erros introduzidos pela implementação.
- Faça inspeção desktop e mobile das interfaces alteradas.
- Confira HTML renderizado, redirects, headers, APIs, robots, sitemap e dados
  estruturados.
- Execute git diff --check.
- Relate avisos preexistentes separadamente.
- Valide as ferramentas em três camadas: HTML declarativo, análise estática dos
  scripts e navegador compatível/polyfill controlado.
- Teste ausência e expiração do Origin Trial sem quebrar o fallback humano.

11. Publicação e validação real
- Não faça push antes de eu autorizar explicitamente.
- Depois da autorização, publique apenas os arquivos relacionados.
- Preserve o autor correto dos commits:
  inematds <inematds@gmail.com>
- Aguarde o deploy aparecer no domínio.
- Confirme que a versão publicada contém as alterações.
- Execute o scanner:
  POST https://webmcp.inema.pro/api/readiness
  Body JSON: {"url":"[URL_DO_SITE]"}
- Compare as pontuações antes e depois.
- Apresente o resultado por categoria: WebMCP, SEO, AEO, GEO e geral.
- Explique cada warning restante.
- Não apresente pontuação prevista como se fosse medição real.
- Após o deploy, confirme no HTML/headers publicados o token first-party, OAC e
  Permissions-Policy; build local não prova configuração de produção.
- Se a emissão do token exigir conta externa do proprietário, deixe a integração
  pronta e apresente a ação humana exata, sem alegar conclusão.

12. Entrega
Apresente:
- Diagnóstico inicial.
- Alterações implementadas por etapa.
- Arquivos modificados.
- Testes executados.
- Resultado do scanner antes e depois.
- Limitações do scanner.
- Pendências reais.
- Matriz de prontidão: detectada estaticamente / registrada no navegador /
  executável por visitante comum.
- Status e validade do Origin Trial, sem revelar o token.
- Commit criado e estado final do repositório.

Importante:
A meta não é apenas aumentar a nota do scanner. A implementação deve melhorar o
acesso de pessoas, mecanismos de busca e agentes, com conteúdo verdadeiro,
segurança e fallback funcional.
```

## Informações mínimas para cada execução

```text
URL: https://exemplo.com
Repositório: /caminho/do/repositorio
Relatório: /caminho/do/diagnostico.md
Domínio preferido: com www / sem www / auditar antes
```
