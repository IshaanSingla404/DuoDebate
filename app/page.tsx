"use client";

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — DuoDebate
   Dramatic hero with neon energy lines animation sequence
   + hamburger slide-in menu (Change 9)
   Route: /
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => router.push("/setup"), 600);
  };

  /* ── Animation phase state ── */
  const [phase, setPhase] = useState(0);
  const START_INDEX = 30;
  const [activeWordIndex, setActiveWordIndex] = useState(START_INDEX);
  const WORDS = ["Argue.", "Outmaneuver.", "Win."];

  /* ── Hamburger menu state (Change 9) ── */
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 850),
      setTimeout(() => setPhase(4), 1100),
      setTimeout(() => setPhase(5), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 4) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => {
        if (prev >= 60) return START_INDEX;
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-background flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${exiting ? "opacity-0" : "opacity-100"}`}>
      {/* ── Wordmark (top-left) ── */}
      <div className={`fixed top-6 left-6 z-20 font-mono text-xs tracking-[0.3em] text-duo-muted transition-opacity duration-500 ${phase >= 2 ? "opacity-100" : "opacity-0"}`}>
        DUODEBATE
      </div>

      {/* ── Hamburger Menu Button (top-right, fades in after phase 5) ── */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`fixed top-6 right-6 z-[60] w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ${phase >= 5 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="Menu"
      >
        <span className={`block w-6 h-[2px] bg-primary-foreground transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
        <span className={`block w-6 h-[2px] bg-primary-foreground transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
        <span className={`block w-6 h-[2px] bg-primary-foreground transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
      </button>

      {/* ── Menu Backdrop ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── Slide-in Menu Panel (from right) ── */}
      <div className={`fixed top-0 right-0 z-[58] h-full w-[280px] capi-panel rounded-l-2xl rounded-r-none flex flex-col pt-20 p-8 gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <span className="font-mono text-[0.65rem] tracking-[0.3em] text-duo-muted uppercase">MENU</span>
        <div className="flex flex-col gap-1">
          <button className="btn-toggle w-full text-left py-3 px-4 text-duo-muted cursor-default">LOGIN / SIGNUP</button>
          <span className="font-mono text-[0.5rem] tracking-[0.2em] text-duo-dim uppercase pl-4">Coming Soon</span>
        </div>
        <div className="flex flex-col gap-1">
          <button className="btn-toggle w-full text-left py-3 px-4 text-duo-muted cursor-default">THEMES</button>
          <span className="font-mono text-[0.5rem] tracking-[0.2em] text-duo-dim uppercase pl-4">Coming Soon</span>
        </div>
        <div className="flex flex-col gap-1">
          <button className="btn-toggle w-full text-left py-3 px-4 text-duo-muted cursor-default">ABOUT US</button>
          <span className="font-mono text-[0.5rem] tracking-[0.2em] text-duo-dim uppercase pl-4">Coming Soon</span>
        </div>
        <div className="mt-auto">
          <div className="w-full h-px bg-duo-border2 mb-4" />
          <span className="font-mono text-[0.55rem] tracking-[0.2em] text-duo-dim uppercase">DuoDebate v0.1.0</span>
        </div>
      </div>

      {/* ── Central Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <h1 className={`font-syne font-extrabold text-primary-foreground leading-[0.9] tracking-tight transition-all duration-300 ease-out ${phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ fontSize: "clamp(80px, 15vw, 160px)" }}>
          DUO
        </h1>
        <span className={`font-syne font-extrabold leading-[0.9] tracking-tight color-cycle-text transition duration-500 ease-out ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ fontSize: "clamp(80px, 15vw, 160px)" }}>
          DEBATE
        </span>

        {/* ── Taglines ── */}
        <div className={`mt-6 relative h-[120px] w-[320px] overflow-hidden transition-all duration-500 ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`} style={{ transitionDelay: "120ms" }}>
          <div className="absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          <div className={`absolute left-0 right-0 flex flex-col items-center ${activeWordIndex > START_INDEX ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`} style={{ transform: `translateY(calc(40px - ${activeWordIndex * 40}px))` }}>
            {Array.from({ length: 90 }).map((_, i) => {
              const word = WORDS[i % 3];
              const isActive = i === activeWordIndex;
              const isAdjacent = Math.abs(i - activeWordIndex) === 1;
              if (Math.abs(i - activeWordIndex) > 5) return <div key={i} style={{ height: 40 }} />;
              return (
                <div key={i} className={`h-[40px] flex items-center justify-center transition-all duration-700 ${isActive ? "text-primary-foreground scale-110 opacity-100 font-bold" : isAdjacent ? "text-duo-muted scale-[0.9] opacity-40 font-medium" : "text-transparent scale-75 opacity-0"}`}>
                  <p className="font-space text-[clamp(24px,3vw,36px)] leading-none m-0 p-0">{word}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={handleEnter} className={`color-cycle-btn font-syne font-bold tracking-widest uppercase px-8 py-3 rounded-lg mt-12 text-bold transition duration-300 ${phase >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          ENTER THE ARENA →
        </button>
      </div>
    </div>
  );
}