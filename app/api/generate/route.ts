import { NextRequest, NextResponse } from "next/server";
import { callLLM, type Provider } from "@/lib/llm/providers";
import { CLASS_DIAGRAM_SYSTEM_PROMPT } from "@/lib/llm/prompts/classDiagram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requirement: unknown = body?.requirement;
    const provider: unknown = body?.provider;

    if (typeof requirement !== "string" || !requirement.trim()) {
      return NextResponse.json({ error: "Informe o texto do requisito." }, { status: 400 });
    }
    if (provider !== "groq" && provider !== "gemini") {
      return NextResponse.json({ error: "Motor de IA inválido." }, { status: 400 });
    }

    const code = await callLLM({
      provider: provider as Provider,
      systemPrompt: CLASS_DIAGRAM_SYSTEM_PROMPT,
      userText: requirement,
    });

    if (!code) {
      return NextResponse.json({ error: "O motor não retornou nenhum código." }, { status: 502 });
    }

    return NextResponse.json({ code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao gerar o diagrama.";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
