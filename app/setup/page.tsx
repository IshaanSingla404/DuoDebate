"use client";

/* ═══════════════════════════════════════════════════════════════
   SETUP / LOBBY SCREEN — DuoDebate
   Pre-match lobby: choose motion, stance, difficulty
   Route: /setup
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stance = "for" | "against";
type Difficulty = "novice" | "adept" | "oracle";
type Mode = "text" | "voice";

export default function Setup() {
  const router = useRouter();

  /* ── Form State ── */
  const [motion, setMotion] = useState("");
  const [stance, setStance] = useState<Stance | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("adept");
  const [mode, setMode] = useState<Mode>("text");

  /* ── Dynamic Theming ── */
  const isFor = stance === "for";
  const isAgainst = stance === "against";
  const panelClass = !stance ? "setup-panel-split" : isFor ? "setup-panel-blue" : "setup-panel-pink";
  const textAreaTheme = !stance
    ? "border-duo-border focus:border-duo-muted"
    : isFor
      ? "border-duo-blue/40 focus:border-duo-cyan focus:shadow-[0_0_12px_hsl(var(--duo-cyan)/0.3)]"
      : "border-duo-magenta/40 focus:border-duo-magenta focus:shadow-[0_0_12px_hsl(var(--duo-magenta)/0.3)]";

  /* ── Transition out ── */
  const [exiting, setExiting] = useState(false);

  const handleBegin = () => {
    setExiting(true);
<<<<<<< HEAD
    const route = mode === "voice" ? "/voice-arena" : "/arena";
    setTimeout(() => router.push(`${route}?stance=${stance}&difficulty=${difficulty}`), 500);
=======
    setTimeout(() => router.push(`/arena?stance=${stance}&difficulty=${difficulty}&motion=${encodeURIComponent(motion)}`), 500);
>>>>>>> bf131408d96eb241f617e185d32eefccaeeddde5
  };

  return (
    <div className={`relative min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 overflow-hidden transition-transform duration-500 ease-in-out ${exiting ? "-translate-y-full" : "translate-y-0"}`}>
      {/* ── Ambient Background Glows (4 Corners Diagonal) ── */}
      {/* Top-Left */}
      <div 
        className={`absolute -top-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-[0.07] ${
          !stance ? "bg-duo-blue" : isFor ? "bg-duo-blue" : "bg-duo-magenta"
        }`} 
      />
      {/* Top-Right */}
      <div 
        className={`absolute -top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-[0.07] ${
          !stance ? "bg-duo-magenta" : isFor ? "bg-duo-cyan" : "bg-duo-purple"
        }`} 
      />
      {/* Bottom-Left */}
      <div 
        className={`absolute -bottom-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-[0.07] ${
          !stance ? "bg-duo-blue" : isFor ? "bg-duo-cyan" : "bg-duo-purple"
        }`} 
      />
      {/* Bottom-Right */}
      <div 
        className={`absolute -bottom-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-[0.07] ${
          !stance ? "bg-duo-magenta" : isFor ? "bg-duo-blue" : "bg-duo-magenta"
        }`} 
      />
      {/* ── Setup Card ── */}
      <div className={`${panelClass} w-full max-w-[580px]`}>
        <div className="p-9 flex flex-col gap-9">
          {/* ── Eyebrow Label ── */}
          <span className="font-mono text-[0.68rem] tracking-[0.6em] text-duo-muted uppercase">
            INITIALISE DEBATE
          </span>

          {/* ── Heading ── */}
          <h1 className="font-syne font-extrabold text-3xl text-primary-foreground tracking-tight text-center">
            SET THE MOTION
          </h1>

          {/* ── Motion / Proposition Input ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[0.68rem] tracking-[0.2em] text-duo-muted uppercase">
              Motion / Proposition
            </label>
            <textarea
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              rows={3}
              placeholder="e.g. This House Would ban social media for users under 16…"
              className={`w-full bg-gradient-to-b from-duo-surface2 to-background border text-foreground font-space text-sm p-3 resize-none rounded-xl placeholder:text-duo-dim focus:outline-none transition-all duration-300 ${textAreaTheme}`}
            />
          </div>

          {/* ── Mode Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("text")}
                className={`btn-toggle flex-1 ${mode === "text" ? (isAgainst ? "active-pink" : "active-blue") : ""}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  TEXT
                </span>
              </button>
              <button
                onClick={() => setMode("voice")}
                className={`btn-toggle flex-1 ${mode === "voice" ? (isAgainst ? "active-pink" : "active-blue") : ""}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  VOICE
                </span>
              </button>
            </div>
          </div>

          {/* ── Stance Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
              Your Stance
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStance("for")}
                className={`btn-toggle flex-1 ${stance === "for" ? "active-blue" : ""}`}
              >
                FOR THE MOTION
              </button>
              <button
                onClick={() => setStance("against")}
                className={`btn-toggle flex-1 ${stance === "against" ? "active-pink" : ""}`}
              >
                AGAINST
              </button>
            </div>
          </div>

          {/* ── Difficulty Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
              Difficulty
            </label>
            <div className="flex gap-2">
              {(["novice", "adept", "oracle"] as Difficulty[]).map((d) => {
                let colorClass = "";
                if (isAgainst) {
                  colorClass = d === "novice" ? "active-magenta" : d === "adept" ? "active-pink" : "active-purple";
                } else {
                  colorClass = d === "novice" ? "active-cyan" : d === "adept" ? "active-sky" : "active-blue";
                }

                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`btn-toggle flex-1 ${difficulty === d ? colorClass : ""}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 ${isAgainst
                          ? (d === "novice" ? "bg-duo-magenta" : d === "adept" ? "bg-pink-400" : "bg-duo-purple")
                          : (d === "novice" ? "bg-duo-cyan" : d === "adept" ? "bg-sky-400" : "bg-duo-blue")
                          }`}
                      />
                      {d.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Begin CTA ── */}
          <button
            disabled={!stance}
            onClick={handleBegin}
            className={`${isAgainst ? "btn-arena-pink" : "btn-arena"} w-full mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            BEGIN DEBATE →
          </button>

          {/* ── Sub-note ── */}
          <p className="font-mono text-[0.65rem] tracking-[0.15em] text-duo-dim text-center">
            5 rounds · AI adapts to your arguments
          </p>
        </div>
      </div>
    </div>
  );
}
