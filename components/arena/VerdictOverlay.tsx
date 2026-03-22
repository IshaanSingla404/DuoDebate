"use client";

/* ═══════════════════════════════════════════════════════════════
   VERDICT OVERLAY — Final judgement modal
   Shows dynamic AI-generated verdict with scores, analysis,
   back button, and action routing. (Changes 4, 8a, 8c)
   ═══════════════════════════════════════════════════════════════ */

import { useRouter } from "next/navigation";

interface VerdictOverlayProps {
  userScore: number;
  aiScore: number;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  winner?: "user" | "ai" | "draw";
  magnitude?: "draw" | "close" | "clear" | "dominant";
  headline?: string;
  analysis?: string;
  keyMoment?: string;
}

export default function VerdictOverlay({
  userScore, aiScore, isOpen, onClose,
  isLoading = false, winner, headline, analysis, keyMoment,
}: VerdictOverlayProps) {
  const router = useRouter();
  if (!isOpen) return null;
  const resolvedWinner = winner || (userScore > aiScore ? "user" : userScore < aiScore ? "ai" : "draw");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/92 backdrop-blur-lg">
      <div className="capi-panel w-full max-w-[560px] mx-4 overflow-hidden relative">
        <div className="h-[2px] bg-gradient-to-r from-duo-purple via-duo-cyan to-duo-blue rounded-t-2xl" />
        <button onClick={onClose} className="absolute top-4 right-4 z-10 font-mono text-sm text-duo-dim hover:text-duo-magenta transition-colors duration-200" aria-label="Close verdict">✕</button>
        <div className="p-8 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-duo-purple animate-dot-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-duo-purple animate-dot-pulse" style={{ animationDelay: "200ms" }} />
                <span className="w-2 h-2 bg-duo-purple animate-dot-pulse" style={{ animationDelay: "400ms" }} />
              </div>
              <span className="font-mono text-[0.7rem] tracking-[0.3em] text-duo-muted uppercase">THE JUDGE IS DELIBERATING...</span>
            </div>
          ) : (
            <>
              <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">// FINAL JUDGEMENT</span>
              <h2 className="font-syne font-extrabold text-5xl text-primary-foreground tracking-tight">VERDICT</h2>
              <p className="font-space text-lg text-duo-muted">
                {headline || (resolvedWinner === "user" ? "🏛 The floor rules in your favour." : resolvedWinner === "ai" ? "🤖 ADVERSUS takes the motion." : "⚖️ A deadlock. Neither side yields.")}
              </p>
              <div className="grid grid-cols-2 border border-duo-purple/20 rounded-xl overflow-hidden bg-gradient-to-b from-duo-surface/40 to-background shadow-[inset_0_1px_0_hsl(var(--duo-purple)/0.1)]">
                <div className="p-6 flex flex-col items-center gap-2 border-r border-duo-purple/20">
                  <span className="font-syne font-extrabold text-4xl text-duo-purple tabular-nums">{userScore}</span>
                  <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">YOU</span>
                </div>
                <div className="p-6 flex flex-col items-center gap-2">
                  <span className="font-syne font-extrabold text-4xl text-duo-blue tabular-nums">{aiScore}</span>
                  <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">ADVERSUS</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">JUDGE&apos;S ANALYSIS</span>
                <div className="bg-[hsl(var(--bg-card))] p-4 border border-duo-border rounded-xl">
                  <p className="font-space text-[0.9rem] text-duo-muted italic leading-relaxed">{analysis || "The judge could not be reached. Try again."}</p>
                </div>
              </div>
              {keyMoment && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">PIVOTAL MOMENT</span>
                  <div className="bg-[hsl(var(--bg-card))] p-3 border border-duo-cyan/20 rounded-xl">
                    <p className="font-space text-[0.85rem] text-duo-cyan/80 leading-relaxed">{keyMoment}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="btn-toggle flex-1 text-duo-muted border-duo-border/40 hover:text-white">REVIEW</button>
                <button onClick={() => router.push("/analysis")} className="btn-toggle flex-1 text-duo-muted border-duo-border/40 hover:text-white">DETAILED ANALYSIS</button>
                <button onClick={() => router.push("/setup")} className="btn-arena flex-1 text-sm font-syne font-bold">NEW DEBATE</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
