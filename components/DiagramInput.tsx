"use client";

import { useState, type FormEvent } from "react";
import type { Provider } from "@/lib/llm/providers";

interface Props {
  onGenerate: (requirement: string, provider: Provider) => void;
  loading: boolean;
}

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "groq", label: "Groq — GPT-OSS 120B", hint: "Inferência rápida, tier gratuito sem cartão" },
  { id: "gemini", label: "Google Gemini — Flash", hint: "Tier gratuito sem cartão" },
];

export default function DiagramInput({ onGenerate, loading }: Props) {
  const [requirement, setRequirement] = useState("");
  const [provider, setProvider] = useState<Provider>("groq");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!requirement.trim() || loading) return;
    onGenerate(requirement, provider);
  }

  return (
    <form className="panel input-panel" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="requirement">
        Requisito do sistema
      </label>
      <textarea
        id="requirement"
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        placeholder="Ex: Um Cliente pode fazer vários Pedidos. Cada Pedido contém vários Itens. Item tem nome e preço."
        rows={10}
      />

      <div className="provider-select" role="radiogroup" aria-label="Motor de IA">
        {PROVIDERS.map((p) => (
          <label key={p.id} className={`provider-option ${provider === p.id ? "selected" : ""}`}>
            <input
              type="radio"
              name="provider"
              value={p.id}
              checked={provider === p.id}
              onChange={() => setProvider(p.id)}
            />
            <span className="provider-name">{p.label}</span>
            <span className="provider-hint">{p.hint}</span>
          </label>
        ))}
      </div>

      <button type="submit" disabled={loading || !requirement.trim()}>
        {loading ? "Gerando diagrama..." : "Gerar diagrama"}
      </button>
    </form>
  );
}
