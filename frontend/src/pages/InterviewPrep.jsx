import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  RotateCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { interviewApi } from '../api/client';
import VoicePlayer from '../components/VoicePlayer';

export default function InterviewPrep({ project }) {
  const [subTab, setSubTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    if (!project?.id) return;
    loadFlashcards();
  }, [project?.id]);

  const loadFlashcards = async () => {
    try {
      setLoadingCards(true);
      const cards = await interviewApi.getFlashcards(project.id);
      setFlashcards(cards || []);
      if (cards && cards.length > 0 && !selectedQuestion) {
        setSelectedQuestion(cards[0].question);
      }
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleGenerateCards = async () => {
    if (!project?.id) return;
    try {
      setLoadingCards(true);
      const newCards = await interviewApi.generateCards(project.id);
      setFlashcards(newCards);
      setCardIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.error('Failed to generate cards:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleMastery = async (level) => {
    const currentCard = flashcards[cardIdx];
    if (!currentCard) return;

    try {
      await interviewApi.updateFlashcard(currentCard.id, { mastery: level });
      setFlashcards((prev) =>
        prev.map((c, i) => (i === cardIdx ? { ...c, mastery: level } : c))
      );
      if (cardIdx < flashcards.length - 1) {
        setIsFlipped(false);
        setCardIdx((i) => i + 1);
      }
    } catch (err) {
      console.error('Failed to update mastery:', err);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !selectedQuestion) return;

    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await interviewApi.evaluate({
        project_id: project.id,
        question: selectedQuestion,
        answer: userAnswer,
      });
      setEvalResult(res);
    } catch (err) {
      console.error('Eval error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const currentCard = flashcards[cardIdx];
  const masteredCount = flashcards.filter((c) => c.mastery === 2).length;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 font-sans">
        <h3 className="text-lg font-serif font-bold text-white mb-2">No Subject Selected</h3>
        <p className="text-xs text-zinc-400 max-w-sm">Connect a project to unlock interview preparation flashcards and simulation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090b] overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-[#0d0d11] border-b border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-semibold">
              Interview Rehearsal
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-white font-serif font-bold text-base">{project.name}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Technical drill simulation, STAR method stories & Staff-level scoring.
          </p>
        </div>

        {/* Sub-tab toggle */}
        <div className="flex p-1 bg-[#141419] rounded-xl border border-white/[0.08] text-xs">
          <button
            onClick={() => setSubTab('flashcards')}
            className={`px-4 py-1.5 rounded-lg font-medium transition ${
              subTab === 'flashcards'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Flashcard Deck ({flashcards.length})
          </button>
          <button
            onClick={() => setSubTab('simulator')}
            className={`px-4 py-1.5 rounded-lg font-medium transition ${
              subTab === 'simulator'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mock Simulator
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-3xl mx-auto">
          {subTab === 'flashcards' && (
            <div>
              {/* Telemetry Bar */}
              <div className="flex items-center justify-between mb-4 text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">
                    Card {flashcards.length > 0 ? cardIdx + 1 : 0} of {flashcards.length}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">
                    {masteredCount} Mastered
                  </span>
                </div>

                <button
                  onClick={handleGenerateCards}
                  disabled={loadingCards}
                  className="flex items-center gap-1.5 text-xs text-amber-200/90 hover:underline transition"
                >
                  <Sparkles size={13} className={loadingCards ? 'animate-spin' : ''} />
                  <span>Regenerate Deck</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#181820] rounded-full h-1 mb-8 overflow-hidden">
                <div
                  className="bg-white h-1 transition-all duration-300"
                  style={{
                    width: `${flashcards.length > 0 ? ((cardIdx + 1) / flashcards.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>

              {/* 3D Flip Card */}
              {currentCard ? (
                <div>
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer perspective-1000 min-h-[320px] sm:min-h-[360px]"
                  >
                    <div
                      className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-transform duration-500 transform-style-3d shadow-2xl border border-white/10 ${
                        isFlipped ? 'rotate-y-180 bg-[#14141a]' : 'bg-[#121217]'
                      }`}
                    >
                      {/* Front of card */}
                      {!isFlipped ? (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-semibold bg-white/[0.06] text-amber-200/90 border border-white/10">
                              {currentCard.category}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                              <RotateCw size={13} /> Tap to flip
                            </span>
                          </div>

                          <div className="my-8">
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-relaxed">
                              {currentCard.question}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/[0.08] pt-4">
                            <span>Topic: {project.name}</span>
                            <span className="text-amber-200/90 font-medium">Click card to reveal model answer →</span>
                          </div>
                        </div>
                      ) : (
                        /* Back of card */
                        <div className="flex flex-col justify-between h-full [transform:rotateY(180deg)]">
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                              Model Staff-Level Answer
                            </span>
                            <VoicePlayer text={currentCard.answer} />
                          </div>

                          <div className="my-6">
                            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                              {currentCard.answer}
                            </p>
                            {currentCard.code_context && (
                              <div className="mt-4 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-400 font-mono">
                                💡 Context: {currentCard.code_context}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/[0.08] pt-4">
                            <span>Status: {currentCard.mastery === 2 ? 'Mastered' : 'Reviewing'}</span>
                            <span className="text-zinc-400">Click to flip back</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center justify-between mt-6 gap-4">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIdx((i) => Math.max(0, i - 1));
                      }}
                      disabled={cardIdx === 0}
                      className="p-3 rounded-xl bg-[#141418] hover:bg-[#1a1a20] border border-white/10 text-zinc-300 disabled:opacity-20 transition"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleMastery(1)}
                        className="px-4 py-2 rounded-full bg-[#141418] hover:bg-[#1a1a20] border border-white/10 text-xs font-semibold text-zinc-300 transition"
                      >
                        Still Learning
                      </button>
                      <button
                        onClick={() => handleMastery(2)}
                        className="btn-editorial-primary px-5 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>Mastered</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIdx((i) => Math.min(flashcards.length - 1, i + 1));
                      }}
                      disabled={cardIdx === flashcards.length - 1}
                      className="p-3 rounded-xl bg-[#141418] hover:bg-[#1a1a20] border border-white/10 text-zinc-300 disabled:opacity-20 transition"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-[#121217] rounded-2xl border border-white/[0.08] space-y-3">
                  <GraduationCap size={32} className="mx-auto text-zinc-600 mb-1" />
                  <p className="text-sm font-semibold text-white">No Flashcards In Deck</p>
                  <button
                    onClick={handleGenerateCards}
                    disabled={loadingCards}
                    className="btn-editorial-primary px-4 py-2 rounded-full text-xs font-semibold"
                  >
                    Generate Flashcards
                  </button>
                </div>
              )}
            </div>
          )}

          {subTab === 'simulator' && (
            <div className="space-y-6">
              {/* Question Selection */}
              <div className="p-6 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-3">
                <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-semibold block">
                  Simulated Interview Question
                </span>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-serif font-bold text-white leading-relaxed">
                    {selectedQuestion || 'Select a question to practice'}
                  </h3>
                  {selectedQuestion && <VoicePlayer text={selectedQuestion} />}
                </div>

                {/* Question switchers */}
                {flashcards.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 border-t border-white/[0.08] pt-3">
                    {flashcards.slice(0, 6).map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedQuestion(c.question);
                          setEvalResult(null);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition border ${
                          selectedQuestion === c.question
                            ? 'bg-white text-zinc-950 font-semibold border-white'
                            : 'bg-[#181820] text-zinc-400 border-white/10 hover:text-white'
                        }`}
                      >
                        Q{i + 1}: {c.category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Answer Form */}
              <form onSubmit={handleEvaluate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Your Response (Practice articulating your thoughts clearly)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="In this project, we designed this by... The primary tradeoff was... When errors occur, the system..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-[#121217] border border-white/15 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/40 transition leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer.trim() || evaluating}
                  className="btn-editorial-primary w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-semibold transition disabled:opacity-50"
                >
                  {evaluating ? <Loader2 size={15} className="animate-spin" /> : <Award size={15} />}
                  <span>{evaluating ? 'Grading with Staff-Level Rubric...' : 'Submit Response for Evaluation'}</span>
                </button>
              </form>

              {/* Evaluation Report Card */}
              {evalResult && (
                <div className="p-7 rounded-2xl bg-[#121217] border border-white/10 shadow-2xl animate-in fade-in space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-sans tracking-widest text-zinc-500 block">
                        Evaluation Verdict
                      </span>
                      <h4 className="text-xl font-serif font-bold text-white mt-0.5">
                        <span
                          className={
                            evalResult.score >= 8
                              ? 'text-emerald-400'
                              : evalResult.score >= 6
                              ? 'text-amber-300'
                              : 'text-red-400'
                          }
                        >
                          {evalResult.verdict}
                        </span>
                      </h4>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 text-center font-mono">
                      <span className="text-xl font-bold text-white">{evalResult.score}</span>
                      <span className="text-xs text-zinc-500">/10</span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed italic bg-[#0c0c0e] p-4 rounded-xl border border-white/[0.06]">
                    "{evalResult.feedback}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <ThumbsUp size={13} /> Verified Strengths
                      </span>
                      <ul className="space-y-1.5 text-xs text-zinc-300 list-disc list-inside">
                        {evalResult.strengths?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={13} /> Areas to Polish
                      </span>
                      <ul className="space-y-1.5 text-xs text-zinc-300 list-disc list-inside">
                        {evalResult.improvements?.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Benchmark Model Answer */}
                  {evalResult.model_answer && (
                    <div className="p-5 rounded-xl bg-[#0e0e13] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                          <Lightbulb size={14} /> Recommended Staff-Level Model Answer
                        </span>
                        <VoicePlayer text={evalResult.model_answer} />
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                        {evalResult.model_answer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
