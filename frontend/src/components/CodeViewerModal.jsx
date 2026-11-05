import React, { useEffect, useState } from 'react';
import { X, Copy, Check, FileCode, ExternalLink } from 'lucide-react';
import { projectApi } from '../api/client';

export default function CodeViewerModal({ projectId, filePath, lineHighlight, onClose }) {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId || !filePath) return;
    setLoading(true);
    projectApi
      .getFile(projectId, filePath)
      .then((data) => setFileData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId, filePath]);

  if (!filePath) return null;

  const handleCopy = () => {
    if (fileData?.content) {
      navigator.clipboard.writeText(fileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = fileData?.content ? fileData.content.split('\n') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-700/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                {filePath}
                {lineHighlight && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Lines {lineHighlight.start}-{lineHighlight.end || lineHighlight.start}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {fileData?.language || 'Code'} • {fileData ? `${lines.length} lines` : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!fileData?.content}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted =
                  lineHighlight &&
                  lineNum >= lineHighlight.start &&
                  lineNum <= (lineHighlight.end || lineHighlight.start);

                return (
                  <div
                    key={idx}
                    className={`table-row ${
                      isHighlighted ? 'bg-brand-500/20 text-brand-100 font-medium' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="table-cell select-none text-right pr-4 pl-2 py-0.5 text-slate-600 border-r border-slate-800/80 w-12 font-mono">
                      {lineNum}
                    </span>
                    <span className="table-cell pl-4 pr-2 py-0.5 whitespace-pre font-mono text-slate-300">
                      {line || ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
