"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  code: string;
  loading: boolean;
  error: string | null;
}

export default function DiagramPreview({ code, loading, error }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [ready, setReady] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  function fit() {
    const svg = containerRef.current?.querySelector('svg');
    const viewport = viewportRef.current;
    if (!svg || !viewport) return;
    const { width, height } = svg.viewBox.baseVal;
    if (!width || !height) return;
    const scale = Math.min(1, (viewport.clientWidth - 32) / width, (viewport.clientHeight - 32) / height);
    setView({ x: (viewport.clientWidth - width * scale) / 2, y: (viewport.clientHeight - height * scale) / 2, scale });
  }

  function zoom(factor: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setView(previous => {
      const scale = Math.max(0.02, Math.min(5, previous.scale * factor));
      const ratio = scale / previous.scale;
      const cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2;
      return { scale, x: cx - (cx - previous.x) * ratio, y: cy - (cy - previous.y) * ratio };
    });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    containerRef.current?.replaceChildren();
    setRenderError(null);
    setReady(false);
    setRendering(false);
    setView({ x: 0, y: 0, scale: 1 });
    drag.current = null;
    if (!code || loading || error || !containerRef.current) return;

    let cancelled = false;
    setRendering(true);

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
          flowchart: { htmlLabels: false },
          themeVariables: {
            darkMode: true,
            background: "#0e1a2b",
            primaryColor: "#182a44",
            primaryTextColor: "#e4ecf7",
            primaryBorderColor: "#5f7fa8",
            secondaryColor: "#142338",
            tertiaryColor: "#0e1a2b",
            lineColor: "#8fa3c0",
            textColor: "#e4ecf7",
            nodeTextColor: "#e4ecf7",
            classText: "#e4ecf7",
            mainBkg: "#182a44",
            nodeBorder: "#5f7fa8",
            clusterBkg: "#142338",
            edgeLabelBackground: "#0e1a2b",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
        });

        if (cancelled) return;
        const id = `diagram-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const element = containerRef.current.querySelector('svg');
          if (element) {
            const { width, height } = element.viewBox.baseVal;
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
            element.style.maxWidth = 'none';
          }
          fit();
          setReady(true);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Sintaxe inválida no diagrama gerado.";
          setRenderError(message);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code, loading, error]);

  const visible = ready && !loading && !error && !renderError;

  return (
    <div className="panel preview-panel">
      <div className="preview-header">
        <span className="field-label" style={{ margin: 0 }}>
          Diagrama
        </span>
        {visible && (
          <button type="button" className="copy-btn" onClick={() => navigator.clipboard.writeText(code)}>
            Copiar código
          </button>
        )}
      </div>

      {visible && <div className="diagram-toolbar" aria-label="Controles do diagrama">
        <button type="button" className="copy-btn" aria-label="Diminuir zoom" onClick={() => zoom(1 / 1.25)}>−</button>
        <span>{Math.round(view.scale * 100)}%</span>
        <button type="button" className="copy-btn" aria-label="Aumentar zoom" onClick={() => zoom(1.25)}>+</button>
        <button type="button" className="copy-btn" onClick={fit}>Ajustar à tela</button>
        <small>Arraste para movimentar</small>
      </div>}

      <div ref={viewportRef} className={`preview-body ${visible ? 'interactive' : ''}`}
        role="region" aria-label="Diagrama interativo" aria-busy={loading || rendering}
        tabIndex={visible ? 0 : -1}
        onKeyDown={event => {
          if (!visible) return;
          const delta: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
          if (delta[event.key]) { event.preventDefault(); const [x, y] = delta[event.key]; setView(v => ({ ...v, x: v.x + x, y: v.y + y })); }
          if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.25); }
          if (event.key === '-') { event.preventDefault(); zoom(1 / 1.25); }
          if (event.key === '0') { event.preventDefault(); fit(); }
        }}
        onPointerDown={event => {
          if (!visible || event.button !== 0 || !event.isPrimary) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onPointerMove={event => {
          const previous = drag.current;
          if (!previous || previous.id !== event.pointerId) return;
          const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}>
        {(loading || rendering) && <div className="generation-status" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" /><p>{loading ? 'Gerando diagrama...' : 'Preparando visualização...'}</p><small>Aguarde a conclusão para visualizar o novo diagrama.</small></div>}
        {!loading && error && <p className="status error" role="alert">{error}</p>}
        {!loading && !error && renderError && <p className="status error" role="alert">Erro de sintaxe: {renderError}</p>}
        {!loading && !error && !renderError && !code && (
          <p className="status muted">O diagrama aparece aqui depois de gerado.</p>
        )}
        <div ref={containerRef} className="diagram-svg" style={{ visibility: visible ? 'visible' : 'hidden', transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
      </div>

      {visible && (
        <details className="code-view">
          <summary>Ver código Mermaid</summary>
          <pre>{code}</pre>
        </details>
      )}
    </div>
  );
}
