# Alterações pontuais — 18/09/2026

Base: ZIP original `requisitos-para-uml (1).zip`, anterior à reformulação ampla. Mantidos layout, formulário, prompts, API, modelos e versões de produção dessa base.

## Visualização

- O código e o SVG anterior são limpos ao iniciar a geração.
- Durante a espera aparece um indicador centralizado; durante a renderização aparece “Preparando visualização”.
- Resultados de renderização cancelada não voltam a preencher o painel.
- Uma falha não deixa o diagrama antigo na tela.
- Botões +/−, percentual de zoom, arrastar com mouse/toque e “Ajustar à tela”.
- O diagrama começa ajustado ao painel e não alarga a página.
- Com foco no painel, setas movimentam, +/− alteram zoom e 0 ajusta à tela.

## Diagnóstico do Gemini

A versão ampla descartada continha `AbortSignal.timeout(40_000)` em `lib/llm/providers.ts`: toda chamada que passasse de 40 segundos era abortada pelo aplicativo. O prazo de 110 segundos da rota não anulava esse corte menor. Se a mensagem exibida era “O provedor demorou mais que 40 segundos”, essa era a origem imediata da interrupção.

A base restaurada não contém timeout explícito no frontend nem no fetch do provedor. Portanto, nessa base, um encerramento antecipado pode vir da hospedagem, de um proxy ou do próprio Gemini. Não há chave de API nem logs da execução do usuário neste ambiente para confirmar qual deles interrompe a chamada.

Outro ponto independente: a base fixa `gemini-2.0-flash`, cujo desligamento consta em 01/06/2026 na documentação oficial. Isso precisa ser tratado antes de contar com o Gemini, mas um erro de modelo indisponível não deve ser confundido com timeout. A integração não foi alterada nesta entrega, pois o pedido para Gemini foi investigar primeiro.

A documentação também explica que modelos com raciocínio podem gastar mais tempo e tokens antes da saída final. Limite de cota, indisponibilidade e timeout são problemas diferentes; não há evidência suficiente para atribuir o caso a “complexidade demais para o gratuito”.

Para fechar o diagnóstico, registrar o texto completo do erro (sem chave), a duração aproximada e se a execução foi local ou hospedada.

Fontes consultadas:
- https://ai.google.dev/gemini-api/docs/troubleshooting
- https://ai.google.dev/gemini-api/docs/deprecations

## Testes

`npm run test:e2e` executa testes no Chromium com respostas de IA simuladas e renderizador Mermaid real: troca de diagramas, limpeza durante carregamento/erro, zoom, arraste, ajuste e largura mobile. Instale o navegador com `npx playwright install chromium` ou informe `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Não foram incorporados esclarecimentos de requisitos, editor, exportação, senha, Redis, métricas ou outras funcionalidades da versão ampla.
