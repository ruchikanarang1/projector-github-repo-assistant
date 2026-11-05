import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Target,
  Search,
  Zap,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ChevronRight,
  Info,
  Cpu,
  Sparkles,
  Layers
} from 'lucide-react';
import { chatApi, settingsApi } from '../api/client';
import VoicePlayer from '../components/VoicePlayer';
import CodeViewerModal from '../components/CodeViewerModal';

const EDITORIAL_PROMPTS = [
  {
    title: 'The Architectural Rationale',
    subtitle: 'Why this tech stack over alternatives?',
    query: 'Walk me through the foundational architectural decisions in this repository. Why was this specific tech stack chosen, and what were the primary engineering tradeoffs?'
  },
  {
    title: 'The Hardest Engineering Challenge',
    subtitle: 'Single toughest bottleneck & solution',
    query: 'What was the single most difficult technical challenge, concurrency edge-case, or bottleneck in this project? Walk me through how it was diagnosed and resolved.'
  },
  {
    title: 'End-to-End Data Lifecycle',
    subtitle: 'From ingress request to database commit',
    query: 'Trace the lifecycle of a request in this project from HTTP ingress and schema validation down to database persistence. How is atomic consistency preserved?'
  },
  {
    title: '100x Concurrency Stress Test',
    subtitle: 'What breaks first under sudden surge?',
    query: 'If traffic to this service surges by 100x overnight, where will the system buckle first (database connections, event loop, worker thread pools), and how would you scale it?'
  },
  {
    title: 'Executive STAR Elevator Pitch',
    subtitle: '60-second interview summary',
    query: 'Provide an articulate 60-second summary of this project formatted for a Senior/Staff Software Engineer interview, utilizing the STAR method (Situation, Task, Action, Result).'
  }
];

export default function TalkToRepo({ project }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('interview_coach');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Active Model & Pipeline Explainer
  const [activeModelName, setActiveModelName] = useState('Gemini 2.5 Flash');
  const [showPipelineInfo, setShowPipelineInfo] = useState(false);

  // Citation inspection modal
  const [inspectFile, setInspectFile] = useState(null);
  const [inspectLines, setInspectLines] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    settingsApi.get().then((cfg) => {
      if (cfg.gemini_configured) {
        setActiveModelName(cfg.gemini_model || 'Gemini 2.5 Flash');
      } else if (cfg.openai_configured) {
        setActiveModelName(cfg.openai_model || 'GPT-4o-mini');
      } else {
        setActiveModelName('Rule-Based AST Synthesizer (Zero-Key Mode)');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!project?.id) return;

    chatApi.listSessions(project.id).then((sessList) => {
      if (sessList && sessList.length > 0) {
        setCurrentSession(sessList[0]);
        chatApi.getMessages(sessList[0].id).then((msgs) => setMessages(msgs));
      } else {
        chatApi.createSession({ project_id: project.id, mode }).then((newSess) => {
          setCurrentSession(newSess);
          setMessages([]);
        });
      }
    });
  }, [project?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || !currentSession || loading) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const assistantMsg = await chatApi.sendMessage(currentSession.id, {
        content: textToSend,
        mode: mode,
      });
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Failed to complete inference. Please verify network connectivity or API credentials in Settings.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const sess = await chatApi.createSession({
        project_id: project.id,
        title: `Dialogue — ${new Date().toLocaleDateString()}`,
        mode: mode,
      });
      setCurrentSession(sess);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCitation = (file, lineStart, lineEnd) => {
    setInspectFile(file);
    setInspectLines({ start: lineStart, end: lineEnd });
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 font-sans">
        <h3 className="text-lg font-serif font-bold text-white mb-2">No Subject Selected</h3>
        <p className="text-xs text-zinc-400 max-w-sm">Connect a GitHub repository or local folder above to begin conversational code exploration.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090b] overflow-hidden relative font-sans">
      {/* Top Editorial Mode Bar */}
      <div className="px-6 py-3 bg-[#0d0d11] border-b border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141419] rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setMode('interview_coach')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'interview_coach'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target size={13} />
            <span>Interview Coach</span>
          </button>

          <button
            onClick={() => setMode('code_explorer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'code_explorer'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search size={13} />
            <span>Codebase Explorer</span>
          </button>

          <button
            onClick={() => setMode('quick_recall')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'quick_recall'
                ? 'bg-amber-100 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap size={13} />
            <span>Waiting-Room Recall</span>
          </button>
        </div>

        {/* Model Telemetry & Pipeline Explainer Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPipelineInfo(!showPipelineInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition"
          >
            <Cpu size={13} className="text-amber-200/90" />
            <span className="font-medium">Model: {activeModelName}</span>
            <Info size={12} className="text-zinc-500 ml-0.5" />
          </button>

          <button
            onClick={handleNewSession}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* RAG Generation Pipeline Popover */}
      {showPipelineInfo && (
        <div className="px-6 py-4 bg-[#14141a] border-b border-white/10 text-xs text-zinc-300 flex items-start justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-white text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-amber-200/90" /> How Projector Generates Answers
            </h4>
            <p className="text-zinc-400 leading-relaxed max-w-3xl">
              1. <strong>AST & Line-Accurate Chunker</strong>: Code files in <code className="text-white font-mono">{project.name}</code> are indexed into sliding windows preserving line numbers.<br />
              2. <strong>Keyword & Semantic Retrieval (RAG)</strong>: Your prompt scores matching functions, classes, and manifests to retrieve the most relevant snippets.<br />
              3. <strong>Context Injection & Inference</strong>: Snippets are passed to <strong>{activeModelName}</strong> with a Staff-level interview persona instructing it to produce clear, structured answers with source citations.
            </p>
          </div>
          <button
            onClick={() => setShowPipelineInfo(false)}
            className="text-zinc-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 space-y-8">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto py-10 animate-in fade-in">
            <div className="text-center mb-10">
              <span className="text-[11px] font-sans uppercase tracking-widest text-amber-200/80 font-semibold block mb-2">
                Dossier Consultation
              </span>
              <h2 className="text-3xl font-serif font-bold tracking-tight text-white">
                Conversations on {project.name}
              </h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
                Explore architectural decisions, isolate scaling bottlenecks, or prepare for Staff-level interview questions.
              </p>
            </div>

            {/* Editorial Preset Query Cards */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-sans uppercase tracking-widest text-zinc-500 font-semibold block mb-3">
                Curated Interview Questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EDITORIAL_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.query)}
                    className="p-4 rounded-2xl bg-[#121217] hover:bg-[#16161d] border border-white/[0.08] hover:border-white/20 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-white group-hover:text-amber-100 text-sm">
                        {p.title}
                      </span>
                      <ChevronRight size={14} className="text-zinc-600 group-hover:text-white transition" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-3xl mx-auto ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Role & Timestamp */}
              <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-zinc-500">
                <span className={`font-semibold ${isUser ? 'text-zinc-300' : 'text-amber-200/90 font-serif'}`}>
                  {isUser ? 'You' : 'Projector Companion'}
                </span>
                <span>•</span>
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {!isUser && msg.model_used && (
                  <>
                    <span>•</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{msg.model_used}</span>
                  </>
                )}
              </div>

              {/* Message Box */}
              <div
                className={`rounded-2xl p-6 sm:p-7 leading-relaxed max-w-full ${
                  isUser
                    ? 'bg-[#18181f] border border-white/15 text-white font-sans text-sm sm:text-[15px]'
                    : 'bg-[#121217] border border-white/[0.08] text-zinc-200 shadow-xl'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-5 text-xs text-zinc-400">
                    <span className="text-[11px] font-sans uppercase tracking-widest text-zinc-400">
                      Analysis & Findings
                    </span>
                    <div className="flex items-center gap-2.5">
                      <VoicePlayer text={msg.content} />
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 hover:text-white rounded transition text-zinc-400"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Highly Readable Editorial Prose */}
                <div className="editorial-prose font-sans">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Code Citations Shelf */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/[0.08]">
                    <span className="text-[10px] font-sans uppercase tracking-widest text-zinc-400 block mb-2.5 font-semibold">
                      Referenced Code Citations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => openCitation(c.file, c.line_start, c.line_end)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c24] hover:bg-[#23232e] text-zinc-200 border border-white/10 hover:border-white/20 text-xs font-mono transition"
                        >
                          <FileCode size={12} className="text-amber-200/90" />
                          <span>{c.file}</span>
                          {c.line_start && (
                            <span className="text-zinc-500">:{c.line_start}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col max-w-3xl mx-auto items-start">
            <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] text-xs text-zinc-400 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-amber-200" />
              <span>Analyzing code AST and generating structured findings...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 sm:p-6 bg-[#09090b] border-t border-white/[0.08]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-3xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            placeholder={
              mode === 'interview_coach'
                ? 'Ask a question or type "Grill me on database transactions"...'
                : 'Ask about implementation, dependencies, or algorithms...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full pl-5 pr-14 py-3.5 rounded-full bg-[#121217] border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-30 disabled:hover:bg-white"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Code Citation Inspector Modal */}
      {inspectFile && (
        <CodeViewerModal
          projectId={project.id}
          filePath={inspectFile}
          lineHighlight={inspectLines}
          onClose={() => {
            setInspectFile(null);
            setInspectLines(null);
          }}
        />
      )}
    </div>
  );
}
