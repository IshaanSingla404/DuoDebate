/* ═══════════════════════════════════════════════════════════════
   SETUP / LOBBY SCREEN — DuoDebate
   Pre-match lobby: choose motion, stance, difficulty
   Route: /setup
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Stance = "for" | "against";
type Difficulty = "novice" | "adept" | "oracle";

export default function Setup() {
  const navigate = useNavigate();

  /* ── Form State ── */
  const [motion, setMotion] = useState("");
  const [stance, setStance] = useState<Stance>("for");
  const [difficulty, setDifficulty] = useState<Difficulty>("adept");

  /* ── Transition out ── */
  const [exiting, setExiting] = useState(false);

  const handleBegin = () => {
    setExiting(true);
    setTimeout(() => navigate("/arena"), 500);
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex items-center justify-center px-4">
      {/* ── Split-wipe exit animation ── */}
      {exiting && (
        <>
          <div className="fixed inset-0 z-50 w-1/2 left-0 bg-background animate-[slideOutLeft_0.5s_ease-in_forwards]" />
          <div className="fixed inset-0 z-50 w-1/2 right-0 left-1/2 bg-background animate-[slideOutRight_0.5s_ease-in_forwards]" />
          <style>{`
            @keyframes slideOutLeft { to { transform: translateX(-100%); } }
            @keyframes slideOutRight { to { transform: translateX(100%); } }
          `}</style>
        </>
      )}

      {/* ── Setup Card ── */}
      <div className="glass-panel-strong w-full max-w-[580px] border-t-2 border-t-duo-purple">
        <div className="p-8 flex flex-col gap-6">
          {/* ── Eyebrow Label ── */}
          <span className="font-mono text-[11px] tracking-[0.25em] text-duo-dim uppercase">
            // INITIALISE DEBATE
          </span>

          {/* ── Heading ── */}
          <h1 className="font-syne font-extrabold text-3xl text-primary-foreground tracking-tight">
            SET THE MOTION
          </h1>

          {/* ── Motion / Resolution Input ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-duo-muted uppercase">
              Motion / Resolution
            </label>
            <textarea
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              rows={3}
              placeholder="e.g. This House Would ban social media for users under 16…"
              className="w-full bg-duo-surface2 border border-duo-border text-foreground font-space text-sm p-3 resize-none placeholder:text-duo-dim focus:outline-none focus:border-duo-purple focus:shadow-[0_0_12px_hsl(248_100%_70%/0.2)] transition-all duration-200"
            />
          </div>

          {/* ── Stance Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-duo-muted uppercase">
              Your Stance
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStance("for")}
                className={`btn-toggle flex-1 ${stance === "for" ? "active-purple" : ""}`}
              >
                FOR THE MOTION
              </button>
              <button
                onClick={() => setStance("against")}
                className={`btn-toggle flex-1 ${stance === "against" ? "active-red" : ""}`}
              >
                AGAINST
              </button>
            </div>
          </div>

          {/* ── Difficulty Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-duo-muted uppercase">
              Difficulty
            </label>
            <div className="flex gap-2">
              {(["novice", "adept", "oracle"] as Difficulty[]).map((d) => {
                const colorClass =
                  d === "novice" ? "active-green" : d === "adept" ? "active-gold" : "active-red";
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`btn-toggle flex-1 ${difficulty === d ? colorClass : ""}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 ${
                          d === "novice"
                            ? "bg-duo-green"
                            : d === "adept"
                            ? "bg-duo-gold"
                            : "bg-duo-red"
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
          <button onClick={handleBegin} className="btn-arena w-full mt-2 text-sm">
            BEGIN DEBATE →
          </button>

          {/* ── Sub-note ── */}
          <p className="font-mono text-[10px] tracking-[0.15em] text-duo-dim text-center">
            5 rounds · AI adapts to your arguments
          </p>
        </div>
      </div>
    </div>
  );
}
