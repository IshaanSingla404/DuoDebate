"use client";

/* ═══════════════════════════════════════════════════════════════
   ARENA HUD BAR — Top sticky bar
   Minimal design: DuoDebate branding, round pips, exit
   ═══════════════════════════════════════════════════════════════ */

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const isFor = stance === "for";
  const accentBg = isFor ? "bg-duo-cyan" : "bg-duo-magenta";

  return (
    <header className="sticky top-0 z-40 w-full h-11 flex items-center justify-between px-5 bg-[hsl(var(--bg-panel)/0.6)] backdrop-blur-xl border-b border-white/[0.04]">
      {/* ── Left: DuoDebate Branding ── */}
      <div className="flex items-center gap-3">
        <span className="font-syne font-extrabold text-sm tracking-tight text-primary-foreground">
          DUO<span className="color-cycle-text">DEBATE</span>
        </span>
        <span className="w-px h-4 bg-duo-border2" />
        <span className="font-mono text-[0.6rem] tracking-[0.15em] text-duo-muted uppercase truncate max-w-[260px]">
          {motion || "—"}
        </span>
      </div>

      {/* ── Center: Round Pips ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="font-mono text-[0.55rem] tracking-[0.2em] text-duo-dim uppercase">
          RD {currentRound}/{totalRounds}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalRounds }, (_, i) => {
            const round = i + 1;
            const completed = round < currentRound;
            const current = round === currentRound;
            return (
              <div
                key={i}
                className={`w-5 h-[3px] rounded-full transition-all duration-300 ${
                  completed
                    ? accentBg
                    : current
                    ? `${accentBg} animate-pip-pulse`
                    : "bg-duo-border2"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ── Right: Exit ── */}
      <button
        onClick={() => router.push("/")}
        className="font-mono text-[0.6rem] tracking-[0.15em] text-duo-dim hover:text-duo-magenta transition-colors duration-200 uppercase"
      >
        ✕ EXIT
      </button>
    </header>
  );
}
