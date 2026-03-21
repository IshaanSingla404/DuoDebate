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

/* ── Score Float Component ── */
function ScoreFloat({ value }: { value: number }) {
  return (
    <span
      className={`absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-sm font-bold animate-score-float pointer-events-none ${
        value > 0 ? "text-duo-green" : "text-duo-red"
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
}

export function UserPanel({ score, maxScore, selectedMove, onMoveChange }: UserPanelProps) {
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

  return (
    <aside className="w-[220px] min-w-[220px] bg-duo-surface/80 backdrop-blur-sm border-r border-duo-border flex flex-col p-4 gap-5 overflow-y-auto rounded-r-2xl">
      {/* ── Section Label ── */}
      <span className="font-mono text-[8px] tracking-[0.35em] text-duo-dim uppercase">
        YOUR CORNER
      </span>

      {/* ── Player Card ── */}
      <div className="border-l-2 border-l-duo-purple bg-duo-surface2 p-3 rounded-xl">
        <p className="font-syne font-bold text-lg text-primary-foreground">YOU</p>
        <p className="font-mono text-[9px] tracking-[0.2em] text-duo-muted uppercase">
          PROPOSING
        </p>
      </div>

      {/* ── Score Display ── */}
      <div className="flex flex-col items-center gap-1 relative">
        <span
          className={`font-syne font-extrabold text-5xl text-primary-foreground tabular-nums ${
            popping ? "animate-score-pop" : ""
          }`}
        >
          {score}
        </span>
        {floats.map((f) => (
          <ScoreFloat key={f.id} value={f.val} />
        ))}
        <span className="font-mono text-[8px] tracking-[0.25em] text-duo-dim uppercase">
          ARGUMENT SCORE
        </span>

        {/* ── XP Progress Bar ── */}
        <div className="w-full h-[3px] bg-duo-border2 mt-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-duo-purple to-duo-cyan transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${Math.min(100, (score / Math.max(maxScore, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* ── Rhetorical Moves ── */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[8px] tracking-[0.35em] text-duo-dim uppercase">
          RHETORICAL MOVES
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MOVES.map((move) => (
            <button
              key={move}
              onClick={() => handleMoveChange(move)}
              className={`chip-move ${selectedMove === move ? "active" : ""}`}
            >
              {move}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hint Card ── */}
      <div className="border-l-2 border-l-duo-gold bg-duo-surface2 p-3 rounded-xl">
        <p
          className={`font-space text-xs text-duo-muted italic transition-opacity duration-150 ${
            hintFade ? "opacity-100" : "opacity-0"
          }`}
        >
          {HINTS[selectedMove]}
        </p>
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
}

export function AIPanel({
  score,
  maxScore,
  difficulty,
  currentRound,
  totalRounds,
  onRequestVerdict,
}: AIPanelProps) {
  const diffColor =
    difficulty === "novice"
      ? "text-duo-green"
      : difficulty === "adept"
      ? "text-duo-gold"
      : "text-duo-red";

  const barGradient =
    "bg-gradient-to-r from-duo-red to-duo-gold";

  return (
    <aside className="w-[220px] min-w-[220px] bg-duo-surface/80 backdrop-blur-sm border-l border-duo-border flex flex-col p-4 gap-5 overflow-y-auto rounded-l-2xl">
      {/* ── Section Label ── */}
      <span className="font-mono text-[8px] tracking-[0.35em] text-duo-dim uppercase">
        AI OPPONENT
      </span>

      {/* ── AI Player Card ── */}
      <div className="border-l-2 border-l-duo-red bg-duo-surface2 p-3 rounded-xl">
        <p className="font-syne font-bold text-lg text-primary-foreground">ADVERSUS</p>
        <p className="font-mono text-[9px] tracking-[0.2em] text-duo-muted uppercase">
          OPPOSING
        </p>
      </div>

      {/* ── AI Score ── */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-syne font-extrabold text-5xl text-primary-foreground tabular-nums">
          {score}
        </span>
        <span className="font-mono text-[8px] tracking-[0.25em] text-duo-dim uppercase">
          ARGUMENT SCORE
        </span>
        <div className="w-full h-[3px] bg-duo-border2 mt-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${barGradient} transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}
            style={{ width: `${Math.min(100, (score / Math.max(maxScore, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* ── Difficulty ── */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[8px] tracking-[0.35em] text-duo-dim uppercase">
          DIFFICULTY
        </span>
        <span className={`font-syne font-bold text-xl ${diffColor}`}>
          {difficulty.toUpperCase()}
        </span>
      </div>

      {/* ── Rounds ── */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[8px] tracking-[0.35em] text-duo-dim uppercase">
          ROUNDS
        </span>
        <span className="font-syne font-bold text-3xl text-primary-foreground">
          {currentRound} / {totalRounds}
        </span>
      </div>

      {/* ── Request Verdict ── */}
      <div className="mt-auto">
        <button onClick={onRequestVerdict} className="btn-verdict w-full">
          ⬡ REQUEST VERDICT
        </button>
      </div>
    </aside>
  );
}
