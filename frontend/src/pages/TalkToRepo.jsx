import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Sparkles,
  Target,
  Search,
  Zap,
  Code,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { chatApi } from '../api/client';
import VoicePlayer from '../components/VoicePlayer';
import CodeViewerModal from '../components/CodeViewerModal';

const PRESET_PROMPTS = [
  { label: 'Why this tech stack?', text: 'Why did I choose this specific tech stack and what were the architectural benefits?' },
  { label: 'Hardest technical tradeoff', text: 'What was the single hardest technical challenge and architectural tradeoff in this repository?' },
  { label: 'Walk me through data flow', text: 'Walk me through how data flows through this codebase from client request to persistence.' },
  { label: '100x Scaling Bottleneck', text: 'If traffic to this project surges by 100x overnight, what will break first and how should I fix it?' },
  { label: '60s STAR Elevator Pitch', text: 'Give me a 60-second elevator pitch about this project formatted for a technical interview (STAR format).' },
];

export default function TalkToRepo({ project }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('interview_coach'); // 'interview_coach', 'code_explorer', 'quick_recall'
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Inspection modal
  const [inspectFile, setInspectFile] = useState(null);
  const [inspectLines, setInspectLines] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!project?.id) return;

    // Load or create session
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
          content: '⚠️ Failed to reach LLM engine. Please verify your connection or settings.',
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
        title: `Interview Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <Code size={48} className="text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Repository Selected</h3>
        <p className="text-xs max-w-sm mt-1">Connect or select a project repository above to start chatting with your codebase.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative">
      {/* Subheader / Mode Selector */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('interview_coach')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'interview_coach'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target size={13} />
            <span>Interview Grill Mode</span>
          </button>

          <button
            onClick={() => setMode('code_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'code_explorer'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search size={13} />
            <span>Codebase Explorer</span>
          </button>

          <button
            onClick={() => setMode('quick_recall')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'quick_recall'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={13} />
            <span>Waiting-Room Recall</span>
          </button>
        </div>

        <button
          onClick={handleNewSession}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>New Session</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-600/30 mb-4">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl font-bold text-white">Talk to {project.name}</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              Ask anything about architecture, technical decisions, data models, or let the AI grill you with real interview questions!
            </p>

            {/* Quick Suggestion Chips */}
            <div className="mt-8 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center">
                Recommended Prompts for Interview Prep
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="p-3 rounded-xl glass-panel hover:border-brand-500/50 text-left transition group"
                  >
                    <span className="text-xs font-semibold text-brand-300 group-hover:text-brand-200 block mb-1">
                      {p.label}
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      "{p.text}"
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
              className={`flex gap-3 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={16} />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/20'
                    : 'glass-panel text-slate-200 rounded-bl-none border border-slate-800'
                }`}
              >
                {/* Assistant Controls Bar */}
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3 text-slate-400 text-xs">
                    <span className="text-[11px] font-medium text-slate-400">
                      Project Companion
                    </span>
                    <div className="flex items-center gap-2">
                      <VoicePlayer text={msg.content} />
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 hover:text-white rounded transition"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Markdown Body */}
                <div className="prose prose-invert prose-xs max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-headings:text-slate-100 prose-a:text-brand-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Code Citations Pill Shelf */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                      <FileCode size={12} className="text-brand-400" />
                      Referenced Code Citations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => openCitation(c.file, c.line_start, c.line_end)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-brand-300 border border-slate-800 text-[11px] font-mono transition"
                        >
                          <span>{c.file}</span>
                          {c.line_start && (
                            <span className="text-slate-400 text-[10px]">
                              :{c.line_start}
                            </span>
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
          <div className="flex gap-3 max-w-3xl mx-auto justify-start animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="glass-panel p-4 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2 font-mono text-[11px]">Searching repository & reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 sm:p-6 bg-slate-950/90 border-t border-slate-800/80">
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
                ? 'Ask or say "Grill me on scaling bottlenecks"...'
                : 'Ask anything about code, functions, or dependencies...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-40 disabled:hover:bg-brand-600 shadow-md shadow-brand-600/20"
          >
            <Send size={16} />
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
