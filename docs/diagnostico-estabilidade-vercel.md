# Diagnóstico — estabilidade do scanner no Vercel

> Incidente reproduzido em 1º de setembro de 2026.  
> Correção ainda não implementada.

## Sintoma

O formulário envia corretamente a solicitação, mas algumas análises terminam com:

```text
page.goto: net::ERR_INSUFFICIENT_RESOURCES
```

Em outra reprodução, o processo retornou:

```text
page.waitForTimeout: Target page, context or browser has been closed
```

## Evidências coletadas

- a página pública respondeu HTTP 200;
- JavaScript e CSS responderam HTTP 200;
- o formulário enviou `POST /api/readiness`;
- a API inicialmente analisou `https://www.inema.club/` em aproximadamente quatro segundos;
- os três exemplos públicos também responderam com sucesso;
- após análises próximas ou simultâneas, o Chromium serverless começou a falhar por recursos insuficientes;
- uma nova chamada direta passou a reproduzir o mesmo erro;
- localmente, o mesmo código analisou o INEMA.club em aproximadamente três segundos;
- os 17 testes automatizados passaram;
- a gravação no banco está isolada e não impede a entrega do relatório.

## Diagnóstico

A interface e as regras do scanner estão operacionais. A falha ocorre na camada
de navegador dentro da função serverless.

Cada requisição inicia um Chromium completo. Não há fila, limite global de
concorrência ou tratamento específico para saturação. Invocações próximas podem
competir por memória, processos e conexões no ambiente do Vercel.

## Problema secundário

O handler converte qualquer exceção em HTTP 400. Saturação de infraestrutura não
é erro do usuário e deveria retornar HTTP 503.

## Correção proposta

1. Limitar a concorrência por instância.
2. Bloquear imagens, mídia, fontes, CSS e analytics quando dispensáveis.
3. Fazer um retry após reiniciar o browser em erros transitórios conhecidos.
4. Retornar 503 com mensagem amigável quando o scanner estiver saturado.
5. Adicionar rate limit e fila.
6. Medir memória, tempo e fase da falha.
7. Garantir cleanup de página, contexto e navegador.
8. Avaliar memória maior para a função.
9. Oferecer fallback HTML quando Chromium não estiver disponível.
10. Mover o scanner avançado para worker/VPS.

## Arquitetura recomendada

Manter a interface e o scan rápido no Vercel. Mover crawler multipágina e testes
runtime para um worker controlado, com fila e um Chromium por vez conforme a
capacidade do servidor.

## Critérios para considerar resolvido

- 100 scans sequenciais sem vazamento observável;
- teste de concorrência compatível com o limite definido;
- erro de saturação devolvido como 503;
- recuperação automática após erro transitório;
- p95 de duração registrado;
- nenhum processo Chromium órfão;
- relatório entregue mesmo quando a persistência estiver indisponível.

