"use client";

import { useState } from "react";
import DiagramInput from "@/components/DiagramInput";
import DiagramPreview from "@/components/DiagramPreview";
import type { Provider } from "@/lib/llm/providers";

export default function Home() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(requirement: string, provider: Provider) {
    setLoading(true);
    setError(null);
    setCode("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement, provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao gerar o diagrama.");
      }
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="layout">
      <header className="header">
        <h1>Requisitos → UML</h1>
        <p className="subtitle">Descreva o sistema em texto e gere um diagrama de classes.</p>
      </header>
      <section className="workspace">
        <DiagramInput onGenerate={handleGenerate} loading={loading} />
        <DiagramPreview code={code} loading={loading} error={error} />
      </section>
    </main>
  );
}
