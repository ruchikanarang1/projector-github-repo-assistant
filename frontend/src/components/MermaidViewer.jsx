import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#07080d',
    primaryColor: '#172554',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#3b82f6',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a'
  }
});

export default function MermaidViewer({ chartCode, title }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chartCode || !chartCode.trim()) return;

      try {
        setError(null);
        let cleanCode = chartCode
          .replace(/^```mermaid\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleanCode);
        
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setError('Syntax warning: Diagram preview adjusted to raw specification.');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chartCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dev-card rounded-md overflow-hidden my-4 border border-[#1e2436] font-mono">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#090b12] border-b border-[#1b2030] text-[11px] text-steel-400">
        <div className="flex items-center gap-2">
          <Compass size={13} className="text-blue-400" />
          <span className="font-bold text-steel-200 uppercase tracking-wider">
            {title || 'SYSTEM_DIAGRAM // BLUEPRINT'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1 hover:text-white hover:bg-[#151928] rounded transition"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] tabular-nums text-steel-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
            className="p-1 hover:text-white hover:bg-[#151928] rounded transition"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:text-white hover:bg-[#151928] rounded transition"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
          <div className="h-3 w-px bg-[#20273a] mx-1"></div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white hover:bg-[#151928] px-2 py-0.5 rounded text-[10px] transition border border-[#23293c]"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'COPIED' : 'SPEC'}</span>
          </button>
        </div>
      </div>

      {/* Blueprint Canvas */}
      <div className="p-6 overflow-auto flex items-center justify-center min-h-[220px] bg-[#07080d] blueprint-grid">
        {error ? (
          <div className="text-center p-4">
            <p className="text-amber-400 text-xs mb-2">{error}</p>
            <pre className="text-[11px] font-mono text-steel-400 bg-[#0d0f17] p-3 rounded border border-[#202538] text-left max-h-48 overflow-auto">
              {chartCode}
            </pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 flex items-center justify-center w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
