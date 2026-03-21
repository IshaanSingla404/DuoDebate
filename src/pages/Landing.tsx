/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — DuoDebate
   Dramatic hero with neon energy lines animation sequence
   Route: /
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NeonLines from "@/components/NeonLines";

export default function Landing() {
  const navigate = useNavigate();

  /* ── Animation phase state ── */
  const [phase, setPhase] = useState(0);
  // 0: black, 1: lines visible, 2: title DUO, 3: title DEBATE,
  // 4: taglines, 5: button visible

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),    // lines start
      setTimeout(() => setPhase(2), 600),    // DUO slams in
      setTimeout(() => setPhase(3), 850),    // DEBATE appears
      setTimeout(() => setPhase(4), 1100),   // taglines
      setTimeout(() => setPhase(5), 1500),   // button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex flex-col items-center justify-center">
      {/* ── Neon Energy Lines Background ── */}
      <div className={`transition-opacity duration-700 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>
        <NeonLines />
      </div>

      {/* ── Wordmark (top-left) ── */}
      <div
        className={`fixed top-6 left-6 z-20 font-mono text-xs tracking-[0.3em] text-duo-muted transition-opacity duration-500 ${
          phase >= 2 ? "opacity-100" : "opacity-0"
        }`}
      >
        DUODEBATE
      </div>

      {/* ── Central Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* ── Title: DUO ── */}
        <h1
          className={`font-syne font-extrabold text-primary-foreground leading-[0.9] tracking-tight transition-all duration-300 ease-out ${
            phase >= 2
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{ fontSize: "clamp(80px, 15vw, 160px)" }}
        >
          DUO
        </h1>

        {/* ── Title: DEBATE ── */}
        <span
          className={`font-syne font-extrabold leading-[0.9] tracking-tight bg-gradient-to-r from-duo-purple via-duo-cyan to-duo-purple bg-clip-text text-transparent text-glow-purple transition-all duration-400 ease-out ${
            phase >= 3
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{ fontSize: "clamp(80px, 15vw, 160px)" }}
        >
          DEBATE
        </span>

        {/* ── Taglines ── */}
        <div className="mt-8 flex flex-col items-center gap-1">
          <p
            className={`font-space text-[clamp(24px,3vw,36px)] font-semibold text-primary-foreground transition-all duration-500 ${
              phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            Argue.
          </p>
          <p
            className={`font-space text-[clamp(20px,2.5vw,30px)] font-medium text-duo-muted transition-all duration-500 ${
              phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            Outmaneuver.
          </p>
          <p
            className={`font-space text-[clamp(16px,2vw,24px)] italic text-duo-dim transition-all duration-500 ${
              phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: "240ms" }}
          >
            Win.
          </p>
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={() => navigate("/setup")}
          className={`btn-arena mt-12 text-sm transition-all duration-500 ${
            phase >= 5
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          ENTER THE ARENA →
        </button>
      </div>
    </div>
  );
}
