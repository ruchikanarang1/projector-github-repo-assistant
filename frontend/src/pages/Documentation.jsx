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
  Loader2,
  Terminal,
  Compass
} from 'lucide-react';
import { docApi } from '../api/client';
import MermaidViewer from '../components/MermaidViewer';

const DOC_TABS = [
  { id: 'architecture', code: '01', label: 'Architecture & Design', icon: GitBranch },
  { id: 'mermaid_flows', code: '02', label: 'Mermaid Diagrams', icon: Compass },
  { id: 'modules', code: '03', label: 'Modules Breakdown', icon: FolderTree },
  { id: 'tradeoffs', code: '04', label: 'Decisions & Tradeoffs', icon: Scale },
  { id: 'interview_cheatsheet', code: '05', label: 'STAR Cheatsheet', icon: GraduationCap },
  { id: 'api_specs', code: '06', label: 'API & Data Contracts', icon: FileCode },
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-steel-500 font-mono">
        <FileText size={32} className="text-steel-600 mb-2" />
        <h3 className="text-xs font-bold text-steel-300 uppercase tracking-wider">NO_TARGET_REPOSITORY</h3>
        <p className="text-[11px] max-w-sm mt-1">Mount a target codebase to generate structural documentation & Mermaid blueprints.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#07080c] overflow-hidden">
      {/* Top Action Bar */}
      <div className="px-5 py-2.5 bg-[#090b12] border-b border-[#181c2b] flex items-center justify-between gap-3 flex-wrap font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">DOC_STUDIO</span>
            <span className="text-steel-600">//</span>
            <span className="text-white text-xs font-sans font-semibold">{project.name}</span>
          </div>
          <p className="text-[10px] text-steel-500">
            Export-grade architectural blueprints, data flow diagrams & interview packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export ZIP */}
          <a
            href={docApi.exportZipUrl(project.id)}
            download
            className="btn-mechanical flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-steel-300 hover:text-white transition"
          >
            <Download size={12} />
            <span>EXPORT_ZIP</span>
          </a>

          {/* Generate All */}
          <button
            onClick={() => handleGenerate('all')}
            disabled={generatingTab !== null}
            className="btn-tactical-blue flex items-center gap-1.5 px-3 py-1 rounded text-white text-[11px] font-semibold transition disabled:opacity-50"
          >
            {generatingTab === 'all' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Terminal size={12} />
            )}
            <span>{generatingTab === 'all' ? 'COMPILING_SUITE...' : 'GENERATE_ALL_DOCS'}</span>
          </button>
        </div>
      </div>

      {/* Document Category Tabs */}
      <div className="flex border-b border-[#181c2b] bg-[#07080d] px-5 overflow-x-auto scrollbar-none font-mono">
        {DOC_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasContent = !!docs[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-[#101422] font-semibold'
                  : 'border-transparent text-steel-500 hover:text-steel-300 hover:bg-[#0c0e16]'
              }`}
            >
              <span className={`text-[10px] ${isActive ? 'text-blue-400' : 'text-steel-600'}`}>
                {tab.code}
              </span>
              <Icon size={13} />
              <span className="font-sans text-[12px]">{tab.label}</span>
              {hasContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document Content View */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {currentDoc ? (
            <div className="dev-card rounded-md p-6 sm:p-8 border border-[#1b2030]">
              {/* Doc Title & Toolbar */}
              <div className="flex items-center justify-between border-b border-[#181c2b] pb-3 mb-6 font-mono">
                <div>
                  <div className="text-[10px] text-blue-400 uppercase tracking-widest">SPECIFICATION_FILE</div>
                  <h3 className="text-base font-bold text-white font-sans mt-0.5">{currentDoc.title}</h3>
                  <span className="text-[10px] text-steel-500">
                    LAST_SYNC: {new Date(currentDoc.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="btn-mechanical flex items-center gap-1 px-2.5 py-1 rounded text-steel-300 text-[11px] transition"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? 'COPIED' : 'COPY_MD'}</span>
                  </button>

                  <button
                    onClick={() => handleGenerate(activeTab)}
                    disabled={generatingTab !== null}
                    className="btn-mechanical flex items-center gap-1 px-2.5 py-1 rounded text-steel-300 text-[11px] transition disabled:opacity-50"
                  >
                    <RefreshCw
                      size={11}
                      className={generatingTab === activeTab ? 'animate-spin' : ''}
                    />
                    <span>RECOMPILE</span>
                  </button>
                </div>
              </div>

              {/* Render Mermaid Diagrams if present */}
              {mermaidCharts.length > 0 && (
                <div className="mb-6 space-y-3 font-mono">
                  <div className="text-[10px] uppercase tracking-widest text-steel-500 flex items-center justify-between border-b border-[#181c2b] pb-1">
                    <span>Visual Architecture Schematics</span>
                    <span>[{mermaidCharts.length}]</span>
                  </div>
                  {mermaidCharts.map((chart, idx) => (
                    <MermaidViewer
                      key={idx}
                      chartCode={chart}
                      title={`SCHEMATIC_0${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Render Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:text-white prose-pre:bg-[#07080d] prose-pre:border prose-pre:border-[#1d2234] prose-table:border-[#1e2336] font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="dev-card rounded-md p-10 text-center border border-[#1b2030] my-6 font-mono">
              <div className="w-10 h-10 rounded bg-[#101422] text-blue-400 border border-[#20273c] mx-auto flex items-center justify-center mb-3">
                <FileText size={18} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                DOCUMENT_NOT_COMPILED // {DOC_TABS.find((t) => t.id === activeTab)?.code}
              </h3>
              <p className="text-xs text-steel-400 mt-1 max-w-md mx-auto font-sans leading-relaxed">
                Compile this specification to extract AST relationships, component boundaries, and interview answers.
              </p>

              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={generatingTab !== null}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded btn-tactical-blue text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {generatingTab === activeTab ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Terminal size={13} />
                )}
                <span>
                  {generatingTab === activeTab
                    ? 'COMPILING_ANALYSIS...'
                    : `COMPILE_${DOC_TABS.find((t) => t.id === activeTab)?.id.toUpperCase()}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
