"use client";
/* ═══════════════════════════════════════════════════════════════
   PLAYER PANEL — Left sidebar (user) or Right sidebar (AI)
   Shows player card, score, XP bar, and move chips or AI info
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";

/* ── Move Chip Data ── */
const MOVES = [
  "ARGUMENT",
  "REBUTTAL",
  "EVIDENCE",
  "ANALOGY",
  "CONCESSION",
  "CHALLENGE",
] as const;

type Move = (typeof MOVES)[number];

const HINTS: Record<Move, string> = {
  ARGUMENT: "State your core claim clearly and directly.",
  REBUTTAL: "Directly dismantle the AI's last point.",
  EVIDENCE: "Support your claim with facts or examples.",
  ANALOGY: "Draw a parallel to make your point vivid.",
  CONCESSION: "Acknowledge a valid point, then pivot.",
  CHALLENGE: "Question the AI's logic or assumptions.",
};

/* ── Score Float Component — shows +/- animation on score change ── */
function ScoreFloat({ value }: { value: number }) {
  return (
    <span
      className={`absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-sm font-bold animate-score-float pointer-events-none ${
        value > 0 ? "text-duo-cyan" : "text-duo-magenta"
      }`}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

/* ══════════════════════════════════════════════
   USER PANEL (Left)
   ══════════════════════════════════════════════ */

interface UserPanelProps {
  score: number;
  maxScore: number;
  selectedMove: Move;
  onMoveChange: (move: Move) => void;
  stance: "for" | "against";
}

export function UserPanel({ score, maxScore, selectedMove, onMoveChange, stance }: UserPanelProps) {
  const isFor = stance === "for";
  const bgClass = isFor ? "setup-panel-blue" : "setup-panel-pink";
  const activeBtnBg = isFor ? "bg-duo-cyan/20 border-duo-cyan text-white shadow-[0_0_10px_rgba(29,209,161,0.4)]" : "bg-duo-magenta/20 border-duo-magenta text-white shadow-[0_0_10px_rgba(255,71,87,0.4)]";
  const inactiveBtnBg = isFor ? "hover:border-duo-cyan/50" : "hover:border-duo-magenta/50";
  const progressGradient = isFor ? "from-duo-blue to-duo-cyan" : "from-duo-purple to-duo-magenta";
  const [prevScore, setPrevScore] = useState(score);
  const [floats, setFloats] = useState<{ id: number; val: number }[]>([]);
  const [popping, setPopping] = useState(false);
  const [hintFade, setHintFade] = useState(true);

  useEffect(() => {
    if (score !== prevScore) {
      const diff = score - prevScore;
      setFloats((f) => [...f, { id: Date.now(), val: diff }]);
      setPopping(true);
      setTimeout(() => setPopping(false), 300);
      setTimeout(() => setFloats((f) => f.slice(1)), 1200);
      setPrevScore(score);
    }
  }, [score, prevScore]);

  const handleMoveChange = (move: Move) => {
    setHintFade(false);
    setTimeout(() => {
      onMoveChange(move);
      setHintFade(true);
    }, 150);
  };

  /* Stance label: PROPOSING when for, OPPOSING when against (Change 1) */
  const stanceLabel = isFor ? "PROPOSING" : "OPPOSING";

  return (
    <aside className={`w-[220px] min-w-[220px] ${bgClass} flex flex-col p-4 gap-5 overflow-y-auto rounded-r-2xl border-l-0 rounded-l-none`}>
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">YOUR CORNER</span>
      <div className="border border-duo-purple/40 bg-gradient-to-br from-duo-purple/10 to-transparent p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <p className="font-syne font-bold text-lg text-primary-foreground">YOU</p>
        <p className="font-mono text-[0.65rem] tracking-[0.15em] text-duo-muted uppercase">{stanceLabel}</p>
      </div>
      <div className="flex flex-col items-center gap-1 relative">
        <span className={`font-syne font-extrabold text-5xl text-primary-foreground tabular-nums ${popping ? "animate-score-pop" : ""}`}>{score}</span>
        {floats.map((f) => (<ScoreFloat key={f.id} value={f.val} />))}
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase mt-1">ARGUMENT SCORE</span>
        <div className="w-full h-[3px] bg-duo-border2 mt-2 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]`} style={{ width: `${Math.min(100, (score / Math.max(maxScore, 1)) * 100)}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">RHETORICAL MOVES</span>
        <div className="grid grid-cols-2 gap-2">
          {MOVES.map((move) => (
            <button key={move} onClick={() => handleMoveChange(move)}
              className={`py-2 px-1 text-[0.65rem] tracking-wider font-mono font-medium rounded-md border transition-all ${
                selectedMove === move ? activeBtnBg : `bg-transparent border-duo-border2 text-duo-muted hover:text-white ${inactiveBtnBg}`
              }`}>{move}</button>
          ))}
        </div>
      </div>
      <div className="border border-duo-magenta/30 bg-gradient-to-br from-duo-magenta/5 to-transparent p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <p className={`font-space text-[0.9rem] leading-relaxed text-[#c8c5db] transition-opacity duration-150 ${hintFade ? "opacity-100" : "opacity-0"}`}>{HINTS[selectedMove]}</p>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════
   AI PANEL (Right)
   ══════════════════════════════════════════════ */

interface AIPanelProps {
  score: number;
  maxScore: number;
  difficulty: "novice" | "adept" | "oracle";
  currentRound: number;
  totalRounds: number;
  onRequestVerdict: () => void;
  stance: "for" | "against";
  canRequestVerdict?: boolean;
  onGetFeedback?: () => void;
  onGetHint?: () => void;
  feedbackText?: string | null;
  hintText?: string | null;
  isFeedbackLoading?: boolean;
  isHintLoading?: boolean;
  hasSentMessage?: boolean;
  isSpeaking?: boolean;
}

export function AIPanel({
  score, maxScore, difficulty, currentRound, totalRounds, onRequestVerdict, stance,
  canRequestVerdict = false, onGetFeedback, onGetHint, feedbackText, hintText, 
  isFeedbackLoading = false, isHintLoading = false, hasSentMessage = false, isSpeaking = false,
}: AIPanelProps) {
  const diffColor = difficulty === "novice" ? "text-duo-cyan" : difficulty === "adept" ? "text-duo-purple" : "text-duo-magenta";
  const isFor = stance === "for";
  const bgClass = isFor ? "setup-panel-blue" : "setup-panel-pink";
  const barGradient = isFor ? "bg-gradient-to-r from-duo-blue to-duo-cyan" : "bg-gradient-to-r from-duo-purple to-duo-magenta";
  const btnClass = isFor ? "btn-arena glow-cyan" : "btn-arena-pink glow-magenta";
  /* AI stance label: inverse of user (Change 1) */
  const aiStanceLabel = isFor ? "OPPOSING" : "PROPOSING";

  const showFeedbackBtn = !!onGetFeedback;
  const showHintBtn = !!onGetHint;

  return (
    <aside className={`w-[220px] min-w-[220px] ${bgClass} flex flex-col p-4 gap-5 overflow-y-auto rounded-l-2xl border-r-0 rounded-r-none`}>
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">AI OPPONENT</span>
      <div className="border border-duo-blue/40 bg-gradient-to-br from-duo-blue/10 to-transparent p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <p className="font-syne font-bold text-lg text-primary-foreground">ADVERSUS</p>
        <p className="font-mono text-[0.65rem] tracking-[0.15em] text-duo-muted uppercase">{aiStanceLabel}</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-syne font-extrabold text-5xl text-primary-foreground tabular-nums">{score}</span>
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">ARGUMENT SCORE</span>
        <div className="w-full h-[3px] bg-duo-border2 mt-2 rounded-full overflow-hidden">
          <div className={`h-full ${barGradient} transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]`} style={{ width: `${Math.min(100, (score / Math.max(maxScore, 1)) * 100)}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">DIFFICULTY</span>
        <span className={`font-syne font-bold text-xl ${diffColor}`}>{difficulty.toUpperCase()}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">ROUNDS</span>
        <span className="font-syne font-bold text-3xl text-primary-foreground">{currentRound} / {totalRounds}</span>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <button onClick={onRequestVerdict} disabled={!canRequestVerdict} className={`${btnClass} w-full disabled:opacity-40 disabled:cursor-not-allowed`}>⬡ REQUEST VERDICT</button>
        
        {showFeedbackBtn && (
          <button onClick={onGetFeedback} disabled={!hasSentMessage || isFeedbackLoading} className="btn-toggle w-full text-[0.6rem] py-1.5 disabled:opacity-30 disabled:cursor-not-allowed">{isFeedbackLoading ? "ANALYZING..." : "GET FEEDBACK"}</button>
        )}
        {feedbackText && (<div className="bg-gradient-to-br from-duo-purple/10 to-transparent border border-duo-purple/30 p-2.5 rounded-lg"><p className="font-space text-[0.75rem] text-[#c8c5db] leading-relaxed">{feedbackText}</p></div>)}
        
        {showHintBtn && (
          <button onClick={onGetHint} disabled={!hasSentMessage || isHintLoading} className="btn-toggle w-full text-[0.55rem] py-1 disabled:opacity-30 disabled:cursor-not-allowed">{isHintLoading ? "THINKING..." : "HINT"}</button>
        )}
        {hintText && (<div className="bg-gradient-to-br from-duo-cyan/10 to-transparent border border-duo-cyan/30 p-2.5 rounded-lg"><p className="font-space text-[0.75rem] text-[#c8c5db] leading-relaxed">{hintText}</p></div>)}

        {isSpeaking && (
          <div className="flex items-center justify-center gap-2 py-2 animate-pulse">
            <div className={`w-1.5 h-4 rounded-full ${isFor ? "bg-duo-cyan" : "bg-duo-magenta"}`} style={{ animation: 'bounce 0.6s infinite alternate' }} />
            <div className={`w-1.5 h-6 rounded-full ${isFor ? "bg-duo-cyan" : "bg-duo-magenta"}`} style={{ animation: 'bounce 0.6s infinite alternate 0.1s' }} />
            <div className={`w-1.5 h-4 rounded-full ${isFor ? "bg-duo-cyan" : "bg-duo-magenta"}`} style={{ animation: 'bounce 0.6s infinite alternate 0.2s' }} />
            <span className="font-mono text-[0.6rem] tracking-widest text-duo-muted uppercase ml-2">SPEAKING...</span>
          </div>
        )}
      </div>
    </aside>
  );
}
