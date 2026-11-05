import React, { useEffect, useState } from 'react';
import { X, Copy, Check, FileCode, Terminal } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl h-[85vh] bg-[#07080d] border border-[#23283c] rounded-lg flex flex-col shadow-2xl overflow-hidden text-steel-200 font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0d0f17] border-b border-[#1b2030]">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded bg-[#141826] border border-[#222a40] text-blue-400">
              <FileCode size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  {filePath}
                </span>
                {lineHighlight && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                    L:{lineHighlight.start}-{lineHighlight.end || lineHighlight.start}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-steel-500">
                {fileData?.language?.toUpperCase() || 'SOURCE'} • {lines.length} LINES • {fileData ? `${fileData.size}B` : 'LOADING'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!fileData?.content}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-[#131724] border border-[#222a40] text-steel-300 hover:text-white hover:bg-[#1a2032] transition"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'COPIED' : 'COPY_ALL'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-steel-500 hover:text-white hover:bg-[#181d2c] rounded transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-3 bg-[#07080d] text-xs leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center h-full text-steel-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="table w-full select-text">
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
                      isHighlighted ? 'bg-blue-950/40 text-blue-200 font-semibold' : 'hover:bg-[#0f121d]'
                    }`}
                  >
                    <span className="table-cell select-none text-right pr-4 pl-2 py-0.5 text-steel-600 border-r border-[#191d2c] w-12 font-mono text-[11px]">
                      {lineNum}
                    </span>
                    <span className="table-cell pl-4 pr-2 py-0.5 whitespace-pre font-mono text-steel-300">
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
