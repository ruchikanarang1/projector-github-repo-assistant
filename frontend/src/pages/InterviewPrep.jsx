import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  RotateCw,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Mic,
  Send,
  Loader2,
  Award,
  ThumbsUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { interviewApi } from '../api/client';
import VoicePlayer from '../components/VoicePlayer';

export default function InterviewPrep({ project }) {
  const [subTab, setSubTab] = useState('flashcards'); // 'flashcards' or 'simulator'
  const [flashcards, setFlashcards] = useState([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Simulator state
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
      // Advance to next card
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <GraduationCap size={48} className="text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Repository Selected</h3>
        <p className="text-xs max-w-sm mt-1">Connect a project to unlock repository-specific interview flashcards and mock simulations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span className="p-1 rounded-md bg-brand-500/20 text-brand-400">
              <GraduationCap size={16} />
            </span>
            Interview Prep Arena: {project.name}
          </h2>
          <p className="text-[11px] text-slate-400">
            Rehearse real technical interview questions & get scored on your answers before talking to recruiters.
          </p>
        </div>

        {/* Sub-tab toggle */}
        <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('flashcards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'flashcards'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flashcard Deck ({flashcards.length})
          </button>
          <button
            onClick={() => setSubTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'simulator'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mock Simulator
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          {subTab === 'flashcards' && (
            <div>
              {/* Mastery Stats Bar */}
              <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
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
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition"
                >
                  <Sparkles size={13} className={loadingCards ? 'animate-spin' : ''} />
                  <span>Regenerate Cards</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 mb-8 overflow-hidden">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
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
                    className="cursor-pointer perspective-1000 min-h-[300px] sm:min-h-[340px]"
                  >
                    <div
                      className={`relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-3xl glass-panel border border-slate-700/80 p-8 flex flex-col justify-between transition-transform duration-500 transform-style-3d shadow-2xl ${
                        isFlipped ? 'rotate-y-180 bg-slate-900/90' : 'bg-gradient-to-br from-slate-900/90 to-slate-950/90'
                      }`}
                    >
                      {/* Front of card */}
                      {!isFlipped ? (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              {currentCard.category}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <RotateCw size={12} /> Click to flip
                            </span>
                          </div>

                          <div className="my-8">
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                              {currentCard.question}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
                            <span>Topic: {project.name} Architecture</span>
                            <span className="text-brand-400 font-medium">Tap to reveal ideal answer →</span>
                          </div>
                        </div>
                      ) : (
                        /* Back of card */
                        <div className="flex flex-col justify-between h-full [transform:rotateY(180deg)]">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Model Answer
                            </span>
                            <VoicePlayer text={currentCard.answer} />
                          </div>

                          <div className="my-6">
                            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                              {currentCard.answer}
                            </p>
                            {currentCard.code_context && (
                              <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
                                💡 Context: {currentCard.code_context}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
                            <span>Ready to grade yourself?</span>
                            <span className="text-slate-400">Click to flip back</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Controls & Mastery */}
                  <div className="flex items-center justify-between mt-6 gap-4">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIdx((i) => Math.max(0, i - 1));
                      }}
                      disabled={cardIdx === 0}
                      className="p-3 rounded-2xl glass-panel hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleMastery(1)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
                      >
                        Still Learning
                      </button>
                      <button
                        onClick={() => handleMastery(2)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
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
                      className="p-3 rounded-2xl glass-panel hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <GraduationCap size={36} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Flashcards Generated</p>
                  <button
                    onClick={handleGenerateCards}
                    disabled={loadingCards}
                    className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                  >
                    Generate Flashcards Now
                  </button>
                </div>
              )}
            </div>
          )}

          {subTab === 'simulator' && (
            <div className="space-y-6">
              {/* Question Selection */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Interview Question
                </label>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {selectedQuestion || 'Select an interview question to simulate'}
                  </h3>
                  {selectedQuestion && <VoicePlayer text={selectedQuestion} />}
                </div>

                {/* Question switchers */}
                {flashcards.length > 0 && (
                  <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
                    {flashcards.slice(0, 5).map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedQuestion(c.question);
                          setEvalResult(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition ${
                          selectedQuestion === c.question
                            ? 'bg-brand-600 text-white border-brand-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Response (Practice explaining your code clearly)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="In this project, we designed this by... The primary tradeoff was... When errors occur, the system..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-brand-500 transition leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer.trim() || evaluating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-brand-600/30 disabled:opacity-50"
                >
                  {evaluating ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                  <span>{evaluating ? 'Evaluating with Senior Staff Rubric...' : 'Submit & Grade My Answer'}</span>
                </button>
              </form>

              {/* AI Evaluation Report Card */}
              {evalResult && (
                <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl animate-in fade-in space-y-6">
                  {/* Score & Verdict banner */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Interview Assessment
                      </span>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                        Verdict:{' '}
                        <span
                          className={
                            evalResult.score >= 8
                              ? 'text-emerald-400'
                              : evalResult.score >= 6
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {evalResult.verdict}
                        </span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/40 flex flex-col items-center justify-center">
                        <span className="text-lg font-extrabold leading-none">{evalResult.score}</span>
                        <span className="text-[9px] font-mono text-slate-400">/10</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    "{evalResult.feedback}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <ThumbsUp size={14} /> Key Strengths
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                        {evalResult.strengths?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={14} /> Room for Polish
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                        {evalResult.improvements?.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Model Staff-level Answer */}
                  {evalResult.model_answer && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-brand-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-brand-300 flex items-center gap-1.5">
                          <Lightbulb size={14} className="text-amber-400" />
                          Recommended Staff-Level Model Answer
                        </span>
                        <VoicePlayer text={evalResult.model_answer} />
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
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
