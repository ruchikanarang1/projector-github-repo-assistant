import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileCode,
  Search,
  Copy,
  Check,
  Terminal,
  Folder
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
      setFileContent({ content: '// Error loading target file content' });
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-steel-500 font-mono">
        <FolderTree size={32} className="text-steel-600 mb-2" />
        <h3 className="text-xs font-bold text-steel-300 uppercase tracking-wider">NO_ACTIVE_TARGET</h3>
        <p className="text-[11px] max-w-sm mt-1">Mount a codebase to explore repository structure and inspect source files.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#07080c] overflow-hidden font-mono">
      {/* File Tree Left Pane */}
      <div className="w-72 sm:w-80 bg-[#07080d] border-r border-[#181c2b] flex flex-col shrink-0">
        {/* Search Input */}
        <div className="p-2.5 border-b border-[#181c2b]">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-steel-500" />
            <input
              type="text"
              placeholder="filter_files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1 rounded bg-[#0b0d14] border border-[#1d2235] text-xs text-steel-200 placeholder-steel-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-steel-500">
            <span>INDEXED: {filteredFiles.length}</span>
            <span className="truncate max-w-[120px]">{project.name}</span>
          </div>
        </div>

        {/* Tree Items List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredFiles.map((f) => {
            const isSelected = selectedFile === f.path;
            return (
              <button
                key={f.path}
                onClick={() => loadFile(f.path)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-xs transition font-mono ${
                  isSelected
                    ? 'bg-[#121626] text-blue-300 font-semibold border border-blue-500/40'
                    : 'text-steel-400 hover:text-steel-200 hover:bg-[#0d0f17] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileCode size={13} className={isSelected ? 'text-blue-400' : 'text-steel-600'} />
                  <span className="truncate text-[11px]">{f.path}</span>
                </div>
                <span className="text-[9px] text-steel-500 shrink-0 ml-1.5">
                  {f.language}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Right Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07080c]">
        {/* File Header Bar */}
        <div className="h-10 px-5 bg-[#090b12] border-b border-[#181c2b] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">{selectedFile || 'Select a file'}</span>
            {fileContent && (
              <span className="text-steel-500 text-[10px]">
                [{lines.length}L // {fileContent.language}]
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={!fileContent?.content}
            className="btn-mechanical flex items-center gap-1 px-2.5 py-0.5 rounded text-steel-300 text-[10px] transition disabled:opacity-30"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#07080d] text-xs leading-relaxed select-text font-mono">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full text-steel-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-[#0d0f17]">
                  <span className="table-cell select-none text-right pr-4 pl-2 py-0.5 text-steel-600 border-r border-[#181d2c] w-12 font-mono text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-4 pr-2 py-0.5 whitespace-pre font-mono text-steel-300">
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
