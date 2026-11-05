import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileCode,
  Search,
  Copy,
  Check,
  FileText,
  Code2,
  Folder,
  ChevronRight,
  ChevronDown
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
      // Pick first interesting file
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <FolderTree size={48} className="text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Repository Selected</h3>
        <p className="text-xs max-w-sm mt-1">Connect a repository above to explore its directory hierarchy and files.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* File Tree Left Pane */}
      <div className="w-72 sm:w-80 bg-slate-950/80 border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Search Input */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
            <span>{filteredFiles.length} files found</span>
            <span className="font-mono text-[10px] text-slate-500">{project.name}</span>
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                  isSelected
                    ? 'bg-brand-600/20 text-brand-300 font-semibold border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode size={14} className={isSelected ? 'text-brand-400' : 'text-slate-500'} />
                  <span className="truncate">{f.path}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                  {f.language}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Right Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* File Header */}
        <div className="h-12 px-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white">{selectedFile || 'Select a file'}</span>
            {fileContent && (
              <span className="text-slate-400 font-mono text-[11px]">
                ({lines.length} lines • {fileContent.language})
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={!fileContent?.content}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition disabled:opacity-40"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-slate-950">
          {loadingFile ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/50">
                  <span className="table-cell select-none text-right pr-4 pl-2 py-0.5 text-slate-600 border-r border-slate-800/80 w-12 font-mono">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-4 pr-2 py-0.5 whitespace-pre font-mono text-slate-300">
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
