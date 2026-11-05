import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileCode,
  Search,
  Copy,
  Check
} from 'lucide-react';
import { projectApi } from '../api/client';

export default function CodeExplorer({ project }) {
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileTree = project?.file_tree || [];

  const filteredFiles = fileTree.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (fileTree.length > 0 && !selectedFile) {
      const primary =
        fileTree.find((f) => f.path.toLowerCase().includes('readme')) ||
        fileTree.find((f) => f.path.toLowerCase().includes('main')) ||
        fileTree[0];
      if (primary) {
        loadFile(primary.path);
      }
    }
  }, [fileTree]);

  const loadFile = async (path) => {
    if (!project?.id) return;
    setSelectedFile(path);
    setLoadingFile(true);
    try {
      const data = await projectApi.getFile(project.id, path);
      setFileContent(data);
    } catch (err) {
      console.error('Failed to load file:', err);
      setFileContent({ content: '// Error loading file content' });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCopy = () => {
    if (!fileContent?.content) return;
    navigator.clipboard.writeText(fileContent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = fileContent?.content ? fileContent.content.split('\n') : [];

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 font-sans">
        <h3 className="text-lg font-serif font-bold text-white mb-2">No Subject Selected</h3>
        <p className="text-xs text-zinc-400 max-w-sm">Connect a repository above to explore its directory hierarchy and files.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#09090b] overflow-hidden font-sans">
      {/* File Tree Left Pane */}
      <div className="w-72 sm:w-80 bg-[#0c0c0f] border-r border-white/[0.08] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/[0.08]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#141419] border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-zinc-500">
            <span>{filteredFiles.length} files</span>
            <span className="truncate max-w-[140px] font-medium text-zinc-400">{project.name}</span>
          </div>
        </div>

        {/* Tree Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredFiles.map((f) => {
            const isSelected = selectedFile === f.path;
            return (
              <button
                key={f.path}
                onClick={() => loadFile(f.path)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition ${
                  isSelected
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode size={13} className={isSelected ? 'text-zinc-950' : 'text-zinc-500'} />
                  <span className="truncate">{f.path}</span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ml-2 ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  {f.language}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Right Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {/* Header Bar */}
        <div className="h-14 px-6 bg-[#0c0c0f] border-b border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-white text-sm">{selectedFile || 'Select a file'}</span>
            {fileContent && (
              <span className="text-zinc-500 font-mono text-[11px]">
                ({lines.length} lines • {fileContent.language})
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={!fileContent?.content}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs transition disabled:opacity-30"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#09090b] font-mono text-xs leading-relaxed select-text">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-white/[0.03]">
                  <span className="table-cell select-none text-right pr-4 pl-2 py-0.5 text-zinc-600 border-r border-white/[0.06] w-12 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-4 pr-2 py-0.5 whitespace-pre text-zinc-300">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
