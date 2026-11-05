import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  GitBranch,
  FolderTree,
  Scale,
  GraduationCap,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Compass,
  Sparkles
} from 'lucide-react';
import { docApi } from '../api/client';
import MermaidViewer from '../components/MermaidViewer';

const DOC_TABS = [
  { id: 'architecture', num: '01', label: 'Architecture & Design', icon: GitBranch },
  { id: 'mermaid_flows', num: '02', label: 'System Schematics', icon: Compass },
  { id: 'modules', num: '03', label: 'Modules Directory', icon: FolderTree },
  { id: 'tradeoffs', num: '04', label: 'Tradeoffs & Decisions', icon: Scale },
  { id: 'interview_cheatsheet', num: '05', label: 'STAR Master Cheatsheet', icon: GraduationCap },
  { id: 'api_specs', num: '06', label: 'API & Data Contracts', icon: FileCode },
];

export default function Documentation({ project }) {
  const [activeTab, setActiveTab] = useState('architecture');
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingTab, setGeneratingTab] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!project?.id) return;
    loadDocs();
  }, [project?.id]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const docsList = await docApi.list(project.id);
      const docMap = {};
      docsList.forEach((d) => {
        docMap[d.doc_type] = d;
      });
      setDocs(docMap);
    } catch (err) {
      console.error('Failed to load docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (docType) => {
    if (!project?.id) return;
    setGeneratingTab(docType);
    try {
      const generatedList = await docApi.generate(project.id, { doc_type: docType });
      setDocs((prev) => {
        const next = { ...prev };
        generatedList.forEach((d) => {
          next[d.doc_type] = d;
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to generate doc:', err);
    } finally {
      setGeneratingTab(null);
    }
  };

  const currentDoc = docs[activeTab];

  const handleCopy = () => {
    if (!currentDoc?.content) return;
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractMermaidBlocks = (text) => {
    if (!text) return [];
    const regex = /```mermaid([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push(match[1]);
    }
    return blocks;
  };

  const mermaidCharts = extractMermaidBlocks(currentDoc?.content);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 font-sans">
        <h3 className="text-lg font-serif font-bold text-white mb-2">No Subject Selected</h3>
        <p className="text-xs text-zinc-400 max-w-sm">Select a project repository to explore architectural documentation and schematics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090b] overflow-hidden font-sans">
      {/* Top Editorial Action Bar */}
      <div className="px-6 py-4 bg-[#0d0d11] border-b border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-semibold">
              Architectural Dossier
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-white font-serif font-bold text-base">{project.name}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            System blueprints, component relationships, tradeoffs & interview cheat-sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export ZIP */}
          <a
            href={docApi.exportZipUrl(project.id)}
            download
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141418] hover:bg-[#1a1a20] text-zinc-300 text-xs font-medium border border-white/10 transition"
          >
            <Download size={13} />
            <span>Export Suite (.zip)</span>
          </a>

          {/* Generate All */}
          <button
            onClick={() => handleGenerate('all')}
            disabled={generatingTab !== null}
            className="btn-editorial-primary flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50"
          >
            {generatingTab === 'all' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>{generatingTab === 'all' ? 'Compiling All...' : 'Generate All Documents'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Chapter Tabs */}
      <div className="flex border-b border-white/[0.08] bg-[#0b0b0e] px-6 overflow-x-auto scrollbar-none">
        {DOC_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasContent = !!docs[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`text-[10px] font-mono ${isActive ? 'text-amber-200' : 'text-zinc-500'}`}>
                {tab.num}
              </span>
              <Icon size={14} />
              <span className="text-[13px]">{tab.label}</span>
              {hasContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document Content View */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-4xl mx-auto">
          {currentDoc ? (
            <div className="rounded-2xl p-8 sm:p-10 bg-[#121217] border border-white/[0.08] shadow-2xl space-y-6">
              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 mb-8">
                <div>
                  <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-semibold block mb-1">
                    Document Entry // {DOC_TABS.find((t) => t.id === activeTab)?.num}
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-white tracking-tight">
                    {currentDoc.title}
                  </h3>
                  <span className="text-xs text-zinc-500 mt-1 block">
                    Last compiled on {new Date(currentDoc.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs transition"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleGenerate(activeTab)}
                    disabled={generatingTab !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs transition disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={generatingTab === activeTab ? 'animate-spin' : ''}
                    />
                    <span>Recompile</span>
                  </button>
                </div>
              </div>

              {/* Render Mermaid Diagrams if present */}
              {mermaidCharts.length > 0 && (
                <div className="my-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                      Architectural Schematics
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {mermaidCharts.length} diagram{mermaidCharts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {mermaidCharts.map((chart, idx) => (
                    <MermaidViewer
                      key={idx}
                      chartCode={chart}
                      title={`Figure ${idx + 1} — System Topography`}
                    />
                  ))}
                </div>
              )}

              {/* Markdown Body */}
              <div className="editorial-prose font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            /* Elegant Editorial Empty State */
            <div className="rounded-2xl p-12 text-center bg-[#121217] border border-white/[0.08] my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 mx-auto flex items-center justify-center text-amber-200">
                <BookOpen size={22} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                {DOC_TABS.find((t) => t.id === activeTab)?.label} Not Compiled Yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Compile this entry to generate comprehensive system designs, data flow models, and technical talking points.
              </p>

              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={generatingTab !== null}
                className="btn-editorial-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition disabled:opacity-50"
              >
                {generatingTab === activeTab ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>
                  {generatingTab === activeTab
                    ? 'Synthesizing Codebase...'
                    : `Compile ${DOC_TABS.find((t) => t.id === activeTab)?.label}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
