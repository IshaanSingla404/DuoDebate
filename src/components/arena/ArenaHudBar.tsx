/* ═══════════════════════════════════════════════════════════════
   ARENA HUD BAR — Top sticky bar
   Shows motion, round pips, stance/difficulty badges, exit
   ═══════════════════════════════════════════════════════════════ */

import { useNavigate } from "react-router-dom";

interface HudBarProps {
  motion: string;
  currentRound: number;
  totalRounds: number;
  stance: "for" | "against";
  difficulty: "novice" | "adept" | "oracle";
}

export default function ArenaHudBar({
  motion,
  currentRound,
  totalRounds,
  stance,
  difficulty,
}: HudBarProps) {
  const navigate = useNavigate();

  const diffColor =
    difficulty === "novice"
      ? "text-duo-green border-duo-green"
      : difficulty === "adept"
      ? "text-duo-gold border-duo-gold"
      : "text-duo-red border-duo-red";

  return (
    <header className="sticky top-0 z-40 w-full h-12 bg-duo-surface/90 backdrop-blur-md flex items-center px-4 border-b border-duo-border">
      {/* ── Left: Motion ── */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-mono text-[9px] tracking-[0.2em] text-duo-dim uppercase">
          MOTION
        </span>
        <p className="font-space text-xs text-duo-muted truncate max-w-[500px] italic">
          "{motion || "perumes"}"
        </p>
      </div>

      {/* ── Center: Round Pips + Badges ── */}
      <div className="flex items-center gap-4">
        {/* Round pips */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalRounds }, (_, i) => {
            const round = i + 1;
            const completed = round < currentRound;
            const current = round === currentRound;
            return (
              <div
                key={i}
                className={`w-3 h-1.5 rounded-sm transition-all duration-300 ${
                  completed
                    ? "bg-duo-purple"
                    : current
                    ? "bg-duo-purple animate-pip-pulse"
                    : "border border-duo-border2 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {/* Stance badge */}
        <span
          className={`font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border rounded-md ${
            stance === "for"
              ? "text-duo-purple border-duo-purple bg-duo-purple/10"
              : "text-duo-red border-duo-red bg-duo-red/10"
          }`}
        >
          {stance === "for" ? "FOR" : "AGAINST"}
        </span>

        {/* Difficulty badge */}
        <span
          className={`font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border rounded-md ${diffColor} bg-transparent`}
        >
          {difficulty.toUpperCase()}
        </span>
      </div>

      {/* ── Right: Exit ── */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={() => navigate("/")}
          className="font-mono text-xs tracking-wider text-duo-dim hover:text-duo-red transition-colors duration-200"
        >
          ✕ EXIT
        </button>
      </div>
    </header>
  );
}
