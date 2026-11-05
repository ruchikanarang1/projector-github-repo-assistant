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
  Terminal,
  Activity,
  Layers
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-steel-500 font-mono">
        <GraduationCap size={32} className="text-steel-600 mb-2" />
        <h3 className="text-xs font-bold text-steel-300 uppercase tracking-wider">NO_TARGET_REPOSITORY</h3>
        <p className="text-[11px] max-w-sm mt-1">Mount a codebase to generate project-specific flashcards and interview scoring rubrics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#07080c] overflow-hidden">
      {/* Precision Header */}
      <div className="px-5 py-2.5 bg-[#090b12] border-b border-[#181c2b] flex items-center justify-between gap-3 flex-wrap font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">PREP_ARENA</span>
            <span className="text-steel-600">//</span>
            <span className="text-white text-xs font-sans font-semibold">{project.name}</span>
          </div>
          <p className="text-[10px] text-steel-500">
            Technical drill simulation, STAR method answers & Staff-level evaluation rubric.
          </p>
        </div>

        {/* Sub-tab toggle */}
        <div className="flex p-0.5 bg-[#050609] rounded border border-[#1b1f30] text-xs">
          <button
            onClick={() => setSubTab('flashcards')}
            className={`px-3 py-1 rounded transition ${
              subTab === 'flashcards'
                ? 'bg-[#141a2e] text-blue-300 border border-blue-500/50 font-semibold'
                : 'text-steel-500 hover:text-steel-300'
            }`}
          >
            INDEX_DECK [{flashcards.length}]
          </button>
          <button
            onClick={() => setSubTab('simulator')}
            className={`px-3 py-1 rounded transition ${
              subTab === 'simulator'
                ? 'bg-[#141a2e] text-blue-300 border border-blue-500/50 font-semibold'
                : 'text-steel-500 hover:text-steel-300'
            }`}
          >
            RUBRIC_SIMULATOR
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8">
        <div className="max-w-3xl mx-auto">
          {subTab === 'flashcards' && (
            <div className="font-mono">
              {/* Telemetry Bar */}
              <div className="flex items-center justify-between mb-4 text-[11px] text-steel-500 border-b border-[#181c2b] pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-steel-200">
                    CARD {flashcards.length > 0 ? String(cardIdx + 1).padStart(2, '0') : '00'} / {String(flashcards.length).padStart(2, '0')}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    {masteredCount} MASTERED
                  </span>
                </div>

                <button
                  onClick={handleGenerateCards}
                  disabled={loadingCards}
                  className="btn-mechanical flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-steel-300 hover:text-white transition"
                >
                  <Activity size={11} className={loadingCards ? 'animate-spin' : ''} />
                  <span>REGENERATE_DECK</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0d0f17] rounded-none h-1 mb-8 overflow-hidden border border-[#1a1e2d]">
                <div
                  className="bg-blue-500 h-1 transition-all duration-300"
                  style={{
                    width: `${flashcards.length > 0 ? ((cardIdx + 1) / flashcards.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>

              {/* 3D Flip Card styled as Military / Engineering Spec Card */}
              {currentCard ? (
                <div>
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer perspective-1000 min-h-[300px] sm:min-h-[340px]"
                  >
                    <div
                      className={`relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-lg dev-card border border-[#23293c] p-6 sm:p-8 flex flex-col justify-between transition-transform duration-500 transform-style-3d shadow-2xl ${
                        isFlipped ? 'rotate-y-180 bg-[#0a0c14]' : 'bg-[#090b12]'
                      }`}
                    >
                      {/* Front of card */}
                      {!isFlipped ? (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between border-b border-[#181c2b] pb-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest font-bold bg-[#111626] text-blue-400 border border-[#20273e]">
                              TOPIC // {currentCard.category}
                            </span>
                            <span className="text-[10px] text-steel-500 flex items-center gap-1">
                              <RotateCw size={11} /> TAP_TO_REVEAL
                            </span>
                          </div>

                          <div className="my-6">
                            <h3 className="text-base sm:text-lg font-bold text-white font-sans leading-relaxed">
                              {currentCard.question}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-steel-500 border-t border-[#181c2b] pt-3">
                            <span>TARGET: {project.name}</span>
                            <span className="text-blue-400 font-mono text-[10px]">CLICK CARD TO REVEAL SPEC →</span>
                          </div>
                        </div>
                      ) : (
                        /* Back of card */
                        <div className="flex flex-col justify-between h-full [transform:rotateY(180deg)]">
                          <div className="flex items-center justify-between border-b border-[#181c2b] pb-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest font-bold bg-[#0d1c14] text-emerald-400 border border-[#163825]">
                              RUBRIC // MODEL_ANSWER
                            </span>
                            <VoicePlayer text={currentCard.answer} />
                          </div>

                          <div className="my-4">
                            <p className="text-xs sm:text-sm text-steel-200 leading-relaxed font-sans">
                              {currentCard.answer}
                            </p>
                            {currentCard.code_context && (
                              <div className="mt-3 p-2.5 rounded bg-[#07080d] border border-[#181d2c] text-[11px] font-mono text-steel-400">
                                <span className="text-blue-400">CONTEXT &gt;</span> {currentCard.code_context}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-steel-500 border-t border-[#181c2b] pt-3">
                            <span>REVIEWS: {currentCard.mastery === 2 ? 'MASTERED' : 'IN_PROGRESS'}</span>
                            <span className="text-steel-400">TAP TO FLIP BACK</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Controls & Mastery */}
                  <div className="flex items-center justify-between mt-5 gap-3">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIdx((i) => Math.max(0, i - 1));
                      }}
                      disabled={cardIdx === 0}
                      className="btn-mechanical p-2.5 rounded text-steel-300 disabled:opacity-20 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMastery(1)}
                        className="btn-mechanical px-3 py-1.5 rounded text-[11px] font-mono text-steel-300 transition"
                      >
                        STILL_LEARNING
                      </button>
                      <button
                        onClick={() => handleMastery(2)}
                        className="btn-tactical-blue px-4 py-1.5 rounded text-white text-[11px] font-mono font-bold transition flex items-center gap-1.5"
                      >
                        <CheckCircle size={13} />
                        <span>MARK_MASTERED</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCardIdx((i) => Math.min(flashcards.length - 1, i + 1));
                      }}
                      disabled={cardIdx === flashcards.length - 1}
                      className="btn-mechanical p-2.5 rounded text-steel-300 disabled:opacity-20 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 dev-card rounded-md border border-[#1b2030]">
                  <GraduationCap size={28} className="mx-auto text-steel-600 mb-2" />
                  <p className="text-xs font-bold text-steel-300 uppercase">NO_CARDS_IN_MEMORY</p>
                  <button
                    onClick={handleGenerateCards}
                    disabled={loadingCards}
                    className="mt-3 px-3 py-1.5 rounded btn-tactical-blue text-white text-xs font-mono font-semibold"
                  >
                    GENERATE_CARDS_NOW
                  </button>
                </div>
              )}
            </div>
          )}

          {subTab === 'simulator' && (
            <div className="space-y-4 font-mono">
              {/* Question Selection */}
              <div className="dev-card p-5 rounded-md border border-[#1b2030]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-steel-500 mb-2 flex items-center justify-between">
                  <span>Simulated Technical Question</span>
                  <span className="text-blue-400">RUBRIC_v1.0</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-sans font-bold text-white leading-relaxed">
                    {selectedQuestion || 'Select an interview question to simulate'}
                  </h3>
                  {selectedQuestion && <VoicePlayer text={selectedQuestion} />}
                </div>

                {/* Question switchers */}
                {flashcards.length > 0 && (
                  <div className="mt-4 flex gap-1 overflow-x-auto pb-1 border-t border-[#181c2b] pt-3">
                    {flashcards.slice(0, 6).map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedQuestion(c.question);
                          setEvalResult(null);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap border transition ${
                          selectedQuestion === c.question
                            ? 'bg-[#141a2e] text-blue-300 border-blue-500/60 font-semibold'
                            : 'bg-[#090b12] text-steel-500 border-[#1c2132] hover:bg-[#121626]'
                        }`}
                      >
                        Q0{i + 1}: {c.category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Answer Form */}
              <form onSubmit={handleEvaluate} className="space-y-3 font-mono">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-steel-500 uppercase tracking-widest mb-1">
                    <span>Your Articulated Response (STAR Format Encouraged)</span>
                    <span>[MARKDOWN_OK]</span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="In this project, we architected this by... The primary tradeoff was... When errors or concurrent requests arrive, the system..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-3 rounded bg-[#090b12] border border-[#202538] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer.trim() || evaluating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded btn-tactical-blue text-white font-mono text-xs font-semibold transition disabled:opacity-50"
                >
                  {evaluating ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                  <span>{evaluating ? 'SCORING_WITH_STAFF_RUBRIC...' : 'SUBMIT_FOR_RUBRIC_ASSESSMENT'}</span>
                </button>
              </form>

              {/* Evaluation Report Card */}
              {evalResult && (
                <div className="dev-card rounded-md p-5 sm:p-6 border border-[#242b40] shadow-2xl animate-in fade-in space-y-4 font-mono">
                  {/* Score & Verdict banner */}
                  <div className="flex items-center justify-between border-b border-[#181c2b] pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-steel-500 block">
                        EVALUATION // REPORT
                      </span>
                      <h4 className="text-sm font-sans font-bold text-white mt-0.5">
                        HIRING_VERDICT:{' '}
                        <span
                          className={
                            evalResult.score >= 8
                              ? 'text-emerald-400 font-mono'
                              : evalResult.score >= 6
                              ? 'text-amber-400 font-mono'
                              : 'text-red-400 font-mono'
                          }
                        >
                          {evalResult.verdict.toUpperCase()}
                        </span>
                      </h4>
                    </div>

                    <div className="p-2 rounded bg-[#07080d] border border-[#20263c] text-center font-mono">
                      <span className="text-base font-bold text-white">{evalResult.score}</span>
                      <span className="text-[10px] text-steel-500">/10</span>
                    </div>
                  </div>

                  <p className="text-xs text-steel-300 font-sans leading-relaxed bg-[#07080d] p-3 rounded border border-[#181d2c]">
                    "{evalResult.feedback}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                    {/* Strengths */}
                    <div className="p-3 rounded bg-[#070d0b] border border-[#143224]">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                        <ThumbsUp size={12} /> VERIFIED_STRENGTHS
                      </span>
                      <ul className="space-y-1 text-xs text-steel-300 list-disc list-inside">
                        {evalResult.strengths?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div className="p-3 rounded bg-[#130d06] border border-[#38230e]">
                      <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={12} /> GAPS_TO_POLISH
                      </span>
                      <ul className="space-y-1 text-xs text-steel-300 list-disc list-inside">
                        {evalResult.improvements?.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Model Staff-level Answer */}
                  {evalResult.model_answer && (
                    <div className="p-3.5 rounded bg-[#090b12] border border-blue-500/40 font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <Lightbulb size={13} className="text-amber-400" />
                          BENCHMARK // STAFF-LEVEL MODEL ANSWER
                        </span>
                        <VoicePlayer text={evalResult.model_answer} />
                      </div>
                      <p className="text-xs text-steel-200 font-sans leading-relaxed">
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
