"use client";

/* ═══════════════════════════════════════════════════════════════
   VERDICT OVERLAY — Final judgement modal
   Shows scores, winner, judge's analysis, and action buttons
   ═══════════════════════════════════════════════════════════════ */

import { useRouter } from "next/navigation";

interface VerdictOverlayProps {
  userScore: number;
  aiScore: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function VerdictOverlay({
  userScore,
  aiScore,
  isOpen,
  onClose,
}: VerdictOverlayProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const userWins = userScore >= aiScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/92 backdrop-blur-lg">
      {/* ── Verdict Card ── */}
      <div className="capi-panel w-full max-w-[560px] mx-4 overflow-hidden">
        {/* Top gradient line */}
        <div className="h-[2px] bg-gradient-to-r from-duo-purple via-duo-cyan to-duo-blue rounded-t-2xl" />

        <div className="p-8 flex flex-col gap-6">
          {/* ── Eyebrow ── */}
          <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">
            // FINAL JUDGEMENT
          </span>

          {/* ── Title ── */}
          <h2 className="font-syne font-extrabold text-5xl text-primary-foreground tracking-tight">
            VERDICT
          </h2>

          {/* ── Winner Declaration ── */}
          <p className="font-space text-lg text-duo-muted">
            {userWins
              ? "🏛 The floor rules in your favour."
              : "🤖 ADVERSUS takes the motion."}
          </p>

          {/* ── Score Grid ── */}
          <div className="grid grid-cols-2 border border-duo-purple/20 rounded-xl overflow-hidden bg-gradient-to-b from-duo-surface/40 to-background shadow-[inset_0_1px_0_hsl(var(--duo-purple)/0.1)]">
            <div className="p-6 flex flex-col items-center gap-2 border-r border-duo-purple/20">
              <span className="font-syne font-extrabold text-4xl text-duo-purple tabular-nums">
                {userScore}
              </span>
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
                YOU
              </span>
            </div>
            <div className="p-6 flex flex-col items-center gap-2">
              <span className="font-syne font-extrabold text-4xl text-duo-blue tabular-nums">
                {aiScore}
              </span>
              <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
                ADVERSUS
              </span>
            </div>
          </div>

          {/* ── Judge's Analysis ── */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">
              JUDGE'S ANALYSIS
            </span>
            <div className="bg-[hsl(var(--bg-card))] p-4 border border-duo-border rounded-xl">
              <p className="font-space text-[0.9rem] text-duo-muted italic leading-relaxed">
                A well-contested debate with strong opening arguments from both sides.
                Your use of evidence and analogies demonstrated sophisticated rhetorical awareness.
                Consider strengthening rebuttals with more direct counter-examples in future rounds.
              </p>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="btn-toggle flex-1 text-duo-muted border-duo-border/40 hover:text-white"
            >
              REVIEW
            </button>
            <button
              onClick={() => router.push("/setup")}
              className="btn-arena flex-1 text-sm font-syne font-bold"
            >
              NEW DEBATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
