# Requisitos → UML

> Versão anterior restaurada com mudanças pontuais de carregamento, substituição do diagrama, zoom e movimentação. Veja `ALTERACOES.md` para o diagnóstico do timeout. A integração Gemini foi preservada para investigação e ainda usa um modelo descontinuado; não considere seu funcionamento validado.

Gera diagramas de classe UML (sintaxe Mermaid) a partir de requisitos escritos em texto, usando um motor de LLM à sua escolha.

## Como funciona

1. Você digita o requisito em linguagem natural.
2. O backend (`app/api/generate/route.ts`) monta um prompt com as regras de sintaxe do Mermaid e chama o motor de IA escolhido (Groq ou Gemini).
3. O motor devolve o código do diagrama como texto.
4. O navegador renderiza esse código em SVG usando a biblioteca `mermaid.js` — sem IA envolvida nessa etapa.

## Rodando localmente

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com suas chaves (veja abaixo como conseguir cada uma, ambas gratuitas e sem cartão de crédito).

```bash
npm run dev
```

Acesse http://localhost:3000

## Como obter as chaves gratuitas

**Groq** (recomendado para a demo, por ser o mais rápido)
1. Acesse https://console.groq.com e crie uma conta (sem cartão de crédito).
2. Vá em "API Keys" → "Create API Key".
3. Cole em `GROQ_API_KEY` no `.env.local`.

**Google Gemini**
1. Acesse https://aistudio.google.com e faça login com uma conta Google.
2. Clique em "Get API key" → "Create API key".
3. Cole em `GEMINI_API_KEY` no `.env.local`.

> Os modelos usados são `openai/gpt-oss-120b` na Groq e `gemini-2.0-flash` no Gemini.
> Se algum motor parar de responder, confira a lista atual de modelos em
> https://console.groq.com/docs/models e https://ai.google.dev/gemini-api/docs/models,
> e configure `GROQ_MODEL` no `.env.local` ou ajuste `lib/llm/providers.ts`.

## Deploy (opcional)

O projeto sobe de graça na Vercel:

```bash
npx vercel
```

Configure as mesmas variáveis de ambiente (`GROQ_API_KEY`, `GEMINI_API_KEY` e, opcionalmente, `GROQ_MODEL`) no painel do projeto na Vercel antes do deploy de produção.

## Estrutura

```
app/
  api/generate/route.ts   → único lugar que fala com as APIs de IA (chaves ficam só aqui)
  page.tsx                → estado da tela, chama /api/generate
  layout.tsx, globals.css → shell e estilo
components/
  DiagramInput.tsx         → formulário: requisito + seletor de motor
  DiagramPreview.tsx       → renderização do diagrama com mermaid.js
lib/llm/
  providers.ts              → abstração dos motores (adicionar um novo = um novo "case")
  prompts/classDiagram.ts   → prompt de sistema com regras + exemplo few-shot
```

## Estendendo para outros tipos de diagrama

Crie um novo arquivo em `lib/llm/prompts/` (ex: `sequenceDiagram.ts`) com as regras daquele tipo,
e passe o prompt correspondente na rota de API conforme o tipo escolhido pelo usuário.
