export type Provider = "groq" | "gemini";

interface GenerateParams {
  provider: Provider;
  systemPrompt: string;
  userText: string;
}


export async function callLLM({ provider, systemPrompt, userText }: GenerateParams): Promise<string> {
  switch (provider) {
    case "groq":
      return callGroq(systemPrompt, userText);
    case "gemini":
      return callGemini(systemPrompt, userText);
    default:
      throw new Error(`Motor desconhecido: ${provider}`);
  }
}


async function callGroq(systemPrompt: string, userText: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada. Adicione no arquivo .env.local");
  }

  const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro na API da Groq (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return stripCodeFence(text);
}


async function callGemini(systemPrompt: string, userText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada. Adicione no arquivo .env.local");
  }

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro na API do Gemini (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
  return stripCodeFence(text);
}


function stripCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(mermaid)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
