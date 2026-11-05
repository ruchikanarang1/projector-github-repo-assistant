import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  GitBranch,
  FolderTree,
  Scale,
  GraduationCap,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Loader2,
  Share2
} from 'lucide-react';
import { docApi } from '../api/client';
import MermaidViewer from '../components/MermaidViewer';

const DOC_TABS = [
  { id: 'architecture', label: 'Architecture & Design', icon: GitBranch },
  { id: 'mermaid_flows', label: 'Mermaid Diagrams', icon: Sparkles },
  { id: 'modules', label: 'Modules Guide', icon: FolderTree },
  { id: 'tradeoffs', label: 'Decisions & Tradeoffs', icon: Scale },
  { id: 'interview_cheatsheet', label: 'Interview Cheatsheet', icon: GraduationCap },
  { id: 'api_specs', label: 'API & Data Specs', icon: FileCode },
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

  // Extract mermaid diagrams if present in markdown
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <FileText size={48} className="text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Repository Selected</h3>
        <p className="text-xs max-w-sm mt-1">Select a project repository above to view and generate documentation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Top Action Bar */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="p-1 rounded-md bg-brand-500/20 text-brand-400">
              <FileText size={16} />
            </span>
            Documentation Studio: {project.name}
          </h2>
          <p className="text-[11px] text-slate-400">
            Export-ready architectural analysis, Mermaid diagrams, and interview prep dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export ZIP */}
          <a
            href={docApi.exportZipUrl(project.id)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Download size={13} />
            <span>Export All (.zip)</span>
          </a>

          {/* Generate All */}
          <button
            onClick={() => handleGenerate('all')}
            disabled={generatingTab !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition disabled:opacity-50"
          >
            {generatingTab === 'all' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>{generatingTab === 'all' ? 'Generating Suite...' : 'Generate All Docs'}</span>
          </button>
        </div>
      </div>

      {/* Document Category Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 overflow-x-auto scrollbar-none">
        {DOC_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasContent = !!docs[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-brand-500 text-brand-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {hasContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document Content View */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {currentDoc ? (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-xl">
              {/* Doc Title & Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{currentDoc.title}</h3>
                  <span className="text-[11px] text-slate-400">
                    Last updated {new Date(currentDoc.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    onClick={() => handleGenerate(activeTab)}
                    disabled={generatingTab !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={generatingTab === activeTab ? 'animate-spin' : ''}
                    />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Render Mermaid Diagrams if in mermaid tab or if diagrams detected */}
              {mermaidCharts.length > 0 && (
                <div className="mb-8 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400 block">
                    Interactive Visual Architecture
                  </span>
                  {mermaidCharts.map((chart, idx) => (
                    <MermaidViewer
                      key={idx}
                      chartCode={chart}
                      title={`Architecture Diagram ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Render Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-table:border-slate-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800/80 my-8">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mx-auto flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-bold text-white">
                {DOC_TABS.find((t) => t.id === activeTab)?.label} Not Generated Yet
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Generate this document to get deep architectural breakdowns, Mermaid diagrams, and interview talking points tailored to this repository.
              </p>

              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={generatingTab !== null}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-600/30 disabled:opacity-50"
              >
                {generatingTab === activeTab ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                <span>
                  {generatingTab === activeTab
                    ? 'Analyzing Codebase & Writing...'
                    : `Generate ${DOC_TABS.find((t) => t.id === activeTab)?.label}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
