import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#0f172a',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#3b82f6',
    tertiaryColor: '#1e293b'
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
        // Clean mermaid fences if present
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
          setError('Could not render diagram preview. Code format may need adjustments.');
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
    <div className="glass-panel rounded-xl overflow-hidden my-4 border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
          {title || 'Architecture Diagram'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
          <div className="h-3 w-px bg-slate-700 mx-1"></div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 overflow-auto flex items-center justify-center min-h-[220px] bg-slate-950/60">
        {error ? (
          <div className="text-center p-4">
            <p className="text-amber-400 text-xs mb-2">{error}</p>
            <pre className="text-[11px] font-mono text-slate-400 bg-slate-900 p-3 rounded text-left max-h-48 overflow-auto">
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
