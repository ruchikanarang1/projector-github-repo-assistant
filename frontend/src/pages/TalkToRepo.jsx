import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Terminal,
  Target,
  Search,
  Zap,
  Code,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { chatApi } from '../api/client';
import VoicePlayer from '../components/VoicePlayer';
import CodeViewerModal from '../components/CodeViewerModal';

const PRESET_PROMPTS = [
  { label: 'ARCH_JUSTIFICATION', desc: 'Why this tech stack?', text: 'Why did I choose this specific tech stack and what were the architectural benefits over alternatives?' },
  { label: 'CORE_TRADEOFF', desc: 'Hardest technical tradeoff', text: 'What was the single hardest technical challenge and architectural tradeoff in this repository?' },
  { label: 'DATA_PIPELINE', desc: 'Walk me through data flow', text: 'Walk me through how data flows through this codebase from ingress endpoint to database persistence.' },
  { label: 'SCALE_LIMIT', desc: '100x Scaling Bottleneck', text: 'If traffic to this project surges by 100x overnight, what will break first and how should I mitigate it?' },
  { label: 'STAR_ELEVATOR', desc: '60s STAR Pitch', text: 'Give me a 60-second elevator pitch about this project formatted for a technical interview (STAR format).' },
];

export default function TalkToRepo({ project }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('interview_coach');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [inspectFile, setInspectFile] = useState(null);
  const [inspectLines, setInspectLines] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
          content: '⚠️ [ERROR: EXECUTION_HALTED] Failed to reach inference engine. Check network or keys in Settings.',
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
        title: `Session [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`,
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-steel-500 font-mono">
        <Terminal size={32} className="text-steel-600 mb-2" />
        <h3 className="text-xs font-bold text-steel-300 uppercase tracking-wider">NO_ACTIVE_TARGET</h3>
        <p className="text-[11px] max-w-sm mt-1">Mount a target repository to initiate telemetry and codebase chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#07080c] overflow-hidden relative">
      {/* Precision Segmented Control Bar */}
      <div className="px-4 sm:px-6 py-2 bg-[#090b12] border-b border-[#181c2b] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-0.5 bg-[#050609] rounded border border-[#1b1f30] font-mono text-[11px]">
          <button
            onClick={() => setMode('interview_coach')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
              mode === 'interview_coach'
                ? 'bg-[#141a2e] text-blue-300 border border-blue-500/50 font-semibold'
                : 'text-steel-500 hover:text-steel-300 border border-transparent'
            }`}
          >
            <Target size={12} />
            <span>01 // GRILL_MODE</span>
          </button>

          <button
            onClick={() => setMode('code_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
              mode === 'code_explorer'
                ? 'bg-[#141a2e] text-blue-300 border border-blue-500/50 font-semibold'
                : 'text-steel-500 hover:text-steel-300 border border-transparent'
            }`}
          >
            <Search size={12} />
            <span>02 // CODE_EXPLORER</span>
          </button>

          <button
            onClick={() => setMode('quick_recall')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
              mode === 'quick_recall'
                ? 'bg-[#1e1509] text-amber-300 border border-amber-500/50 font-semibold'
                : 'text-steel-500 hover:text-steel-300 border border-transparent'
            }`}
          >
            <Zap size={12} />
            <span>03 // QUICK_RECALL</span>
          </button>
        </div>

        <button
          onClick={handleNewSession}
          disabled={loading}
          className="btn-mechanical flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono text-steel-400 hover:text-white transition"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          <span>RESET_STREAM</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-10 animate-in fade-in">
            <div className="w-10 h-10 rounded-md bg-[#101422] border border-[#23293e] mx-auto flex items-center justify-center text-blue-400 mb-3 shadow-inner">
              <Terminal size={20} />
            </div>
            <h2 className="text-base font-mono font-bold tracking-tight text-white uppercase">
              Projector Runtime // {project.name}
            </h2>
            <p className="text-xs text-steel-400 mt-1 max-w-md mx-auto font-sans leading-relaxed">
              Target repository AST mapped ({project.file_count} files). Drill into design choices, concurrency patterns, or trigger mock interview grilling.
            </p>

            {/* Quick Suggestion Terminal Cards */}
            <div className="mt-8 text-left font-mono">
              <div className="flex items-center justify-between text-[10px] text-steel-500 uppercase tracking-widest mb-2.5 border-b border-[#181c2a] pb-1">
                <span>Preset Queries // Interview Rubric</span>
                <span>[SELECT_TO_EXEC]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="p-2.5 rounded bg-[#090b12] hover:bg-[#101320] border border-[#1b2030] hover:border-[#2f3854] text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-blue-400 group-hover:text-blue-300">
                        {p.label}
                      </span>
                      <ChevronRight size={12} className="text-steel-600 group-hover:text-steel-300 transition" />
                    </div>
                    <p className="text-[11px] font-sans text-steel-400 mt-1 line-clamp-1">
                      {p.desc}
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
              {/* Message Metadata Header */}
              <div className="flex items-center gap-2 mb-1 px-1 font-mono text-[10px] text-steel-500">
                <span className={isUser ? 'text-steel-400 font-bold' : 'text-blue-400 font-bold'}>
                  {isUser ? 'DEV::INPUT' : 'SYS::SPEC_OUTPUT'}
                </span>
                <span>•</span>
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <div
                className={`rounded-md p-4 sm:p-5 text-xs sm:text-sm leading-relaxed max-w-full ${
                  isUser
                    ? 'bg-[#121626] border border-[#2563eb]/40 text-steel-100'
                    : 'dev-card border border-[#1c2132] text-steel-200'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-[#181c2b] pb-2 mb-3 text-steel-500 text-[11px] font-mono">
                    <span className="text-steel-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      INFERENCE // STREAM_VERIFIED
                    </span>
                    <div className="flex items-center gap-2">
                      <VoicePlayer text={msg.content} />
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 hover:text-white rounded transition text-steel-400"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Markdown Body */}
                <div className="prose prose-invert prose-xs max-w-none prose-pre:bg-[#07080d] prose-pre:border prose-pre:border-[#1d2234] prose-headings:font-mono prose-headings:text-white prose-a:text-blue-400 font-sans">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Code Citations Shelf */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#181c2b] font-mono">
                    <div className="flex items-center justify-between text-[10px] text-steel-500 uppercase tracking-widest mb-1.5">
                      <span className="flex items-center gap-1">
                        <FileCode size={11} className="text-blue-400" />
                        Referenced AST Citations
                      </span>
                      <span>[{msg.citations.length}]</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => openCitation(c.file, c.line_start, c.line_end)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#07080d] hover:bg-[#121626] text-blue-300 border border-[#1e2436] hover:border-blue-500/50 text-[10px] transition"
                        >
                          <span>{c.file}</span>
                          {c.line_start && (
                            <span className="text-steel-500">:{c.line_start}</span>
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
            <div className="px-1 text-[10px] font-mono text-steel-500 mb-1">
              SYS::PROCESSING
            </div>
            <div className="dev-card p-3 rounded-md text-xs font-mono text-steel-400 flex items-center gap-2 border border-[#1f2538]">
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span>Scanning AST & calculating cross-references...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Terminal Input Bar */}
      <div className="p-3 sm:p-4 bg-[#07080c] border-t border-[#181c2b]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-3xl mx-auto relative flex items-center font-mono"
        >
          <div className="absolute left-3 text-steel-500 text-xs select-none">
            &gt;
          </div>
          <input
            type="text"
            placeholder={
              mode === 'interview_coach'
                ? 'Type prompt or "Grill me on scaling bottlenecks"...'
                : 'Query AST for algorithms, routes, schemas...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full pl-7 pr-12 py-2.5 rounded bg-[#0d0f17] border border-[#202538] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded btn-tactical-blue text-white transition disabled:opacity-30"
          >
            <Send size={13} />
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
