"use client";

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — DuoDebate
   Dramatic hero with neon energy lines animation sequence
   Route: /
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  /* ── Animation phase state ── */
  const [phase, setPhase] = useState(0);
  // 0: black, 1: lines visible, 2: title DUO, 3: title DEBATE,
  // 4: taglines, 5: button visible

  const START_INDEX = 30;
  const [activeWordIndex, setActiveWordIndex] = useState(START_INDEX);
  const WORDS = ["Argue.", "Outmaneuver.", "Win."];

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

  useEffect(() => {
    if (phase < 4) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => {
        // Multiples of 3 match the word cycle. 
        // 60 and 30 both map to the first word, so resetting is invisible.
        if (prev >= 60) return START_INDEX;
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex flex-col items-center justify-center">
      {/* ── Wordmark (top-left) ── */}
      <div
        className={`fixed top-6 left-6 z-20 font-mono text-xs tracking-[0.3em] text-duo-muted transition-opacity duration-500 ${phase >= 2 ? "opacity-100" : "opacity-0"
          }`}
      >
        DUODEBATE
      </div>

      {/* ── Central Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* ── Title: DUO ── */}
        <h1
          className={`font-syne font-extrabold text-primary-foreground leading-[0.9] tracking-tight transition-all duration-300 ease-out ${phase >= 2
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
            }`}
          style={{ fontSize: "clamp(80px, 15vw, 160px)" }}
        >
          DUO
        </h1>

        {/* ── Title: DEBATE ── */}
        <span
          className={`font-syne font-extrabold leading-[0.9] tracking-tight color-cycle-text transition-all duration-400 ease-out ${phase >= 3
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
            }`}
          style={{ fontSize: "clamp(80px, 15vw, 160px)" }}
        >
          DEBATE
        </span>

        {/* ── Taglines (Animated Carousel) ── */}
        <div
          className={`mt-6 relative h-[120px] w-[320px] overflow-hidden transition-all duration-500 ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          style={{ transitionDelay: "120ms" }}
        >
          <div className="absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

          <div
            className={`absolute left-0 right-0 flex flex-col items-center ${
              // Only apply smooth transition if we're not resetting the loop
              activeWordIndex > START_INDEX ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""
            }`}
            style={{ 
              transform: `translateY(calc(40px - ${activeWordIndex * 40}px))`
            }}
          >
            {Array.from({ length: 90 }).map((_, i) => {
              const word = WORDS[i % 3];
              const isActive = i === activeWordIndex;
              const isAdjacent = Math.abs(i - activeWordIndex) === 1;

              if (Math.abs(i - activeWordIndex) > 5) {
                return <div key={i} style={{ height: 40 }} />;
              }

              return (
                <div
                  key={i}
                  className={`h-[40px] flex items-center justify-center transition-all duration-700 ${isActive
                    ? "text-primary-foreground scale-110 opacity-100 font-bold"
                    : isAdjacent
                      ? "text-duo-muted scale-[0.9] opacity-40 font-medium"
                      : "text-transparent scale-75 opacity-0"
                    }`}
                >
                  <p className="font-space text-[clamp(24px,3vw,36px)] leading-none m-0 p-0">
                    {word}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={() => router.push("/setup")}
          className={`color-cycle-btn font-syne font-bold tracking-widest uppercase px-8 py-3 rounded-lg mt-12 text-bold ${phase >= 5
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
