"use client";

/* ═══════════════════════════════════════════════════════════════
   DETAILED ANALYSIS PAGE — DuoDebate
   Placeholder page for future detailed debate analysis feature.
   Route: /analysis
   ═══════════════════════════════════════════════════════════════ */

import { useRouter } from "next/navigation";

export default function AnalysisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute -top-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] bg-duo-purple" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] bg-duo-cyan" />

      {/* ── Content Card ── */}
      <div className="capi-panel w-full max-w-[520px]">
        <div className="h-[2px] bg-gradient-to-r from-duo-purple via-duo-cyan to-duo-blue rounded-t-2xl" />
        <div className="p-10 flex flex-col items-center gap-6">
          {/* ── Eyebrow ── */}
          <span className="font-mono text-[0.65rem] tracking-[0.25em] text-duo-muted uppercase">
            // COMING SOON
          </span>

          {/* ── Title ── */}
          <h1 className="font-syne font-extrabold text-4xl text-primary-foreground tracking-tight text-center">
            DETAILED ANALYSIS
          </h1>

          {/* ── Description ── */}
          <p className="font-space text-[0.95rem] text-duo-muted text-center leading-relaxed max-w-[380px]">
            Round-by-round breakdowns, rhetorical heatmaps, and argument
            strength analysis — currently under development.
          </p>

          {/* ── Divider ── */}
          <div className="w-16 h-px bg-duo-border2" />

          {/* ── Back Button ── */}
          <button
            onClick={() => router.push("/")}
            className="btn-arena px-8 py-3 text-sm font-syne font-bold"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
