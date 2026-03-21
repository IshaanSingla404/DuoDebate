"use client";

/* ═══════════════════════════════════════════════════════════════
   ARENA PAGE — DuoDebate
   Full 3-column debate interface
   Route: /arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import DebateFeed, { type DebateMessage } from "@/components/arena/DebateFeed";
import VerdictOverlay from "@/components/arena/VerdictOverlay";

/* ── Placeholder demo messages ── */
const DEMO_MESSAGES: DebateMessage[] = [
  {
    id: "1",
    sender: "ai",
    move: "ARGUMENT",
    text: "The motion to promote perfumes is misguided, as it ignores the significant environmental and health concerns associated with the production and consumption of perfumes. The harvesting of rare ingredients, such as musk and ambergris, can lead to the exploitation of endangered species.",
    round: 1,
    feedback: { text: "Strong opening — sets clear framework", type: "strong" },
  },
];

function ArenaContent() {
  const searchParams = useSearchParams();
  const stance = (searchParams.get("stance") as "for" | "against") || "for";
  const difficulty = (searchParams.get("difficulty") as "novice" | "adept" | "oracle") || "adept";
  const [selectedMove, setSelectedMove] = useState<
    "ARGUMENT" | "REBUTTAL" | "EVIDENCE" | "ANALOGY" | "CONCESSION" | "CHALLENGE"
  >("ARGUMENT");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<DebateMessage[]>(DEMO_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);

  /* ── Placeholder scores ── */
  const userScore = 0;
  const aiScore = 0;

  /* ── Placeholder submit handler ── */
  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const newMsg: DebateMessage = {
      id: Date.now().toString(),
      sender: "user",
      move: selectedMove,
      text: inputValue,
      round: 1,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Simulate AI typing
    setIsAiTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          move: "REBUTTAL",
          text: "An interesting point, but it fails to address the core economic benefits that the perfume industry brings to developing nations where these ingredients are sourced. Your argument conflates correlation with causation.",
          round: 1,
          feedback: { text: "Address the economic counter-point", type: "weak" },
        },
      ]);
      setIsAiTyping(false);
    }, 2000);
  };


  return (
    <div className="h-dvh w-screen flex flex-col bg-background overflow-hidden relative z-0" style={{ animation: 'arenaSlideIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
      <style>{`
        @keyframes arenaSlideIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      {/* ── Ambient Background Glows ── */}
      <div className={`absolute -top-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] ${stance === "for" ? "bg-duo-blue" : "bg-duo-magenta"}`} />
      <div className={`absolute -bottom-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] ${stance === "for" ? "bg-duo-cyan" : "bg-duo-purple"}`} />
      <div className={`absolute -top-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] ${stance !== "for" ? "bg-duo-blue" : "bg-duo-magenta"}`} />
      <div className={`absolute -bottom-[10%] -right-[10%] w-[45vw] h-[45vw] rounded-full blur-[120px] pointer-events-none opacity-[0.06] ${stance !== "for" ? "bg-duo-cyan" : "bg-duo-purple"}`} />

      {/* ── Top HUD Bar ── */}
      <ArenaHudBar
        motion="perfumes"
        currentRound={1}
        totalRounds={5}
        stance={stance}
        difficulty={difficulty}
      />

      {/* ── Three-Column Layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left Panel: User ── */}
        <UserPanel
          score={userScore}
          maxScore={30}
          selectedMove={selectedMove}
          onMoveChange={setSelectedMove}
          stance={stance}
        />

        {/* ── Center: Debate Feed ── */}
        <DebateFeed
          messages={messages}
          isAiTyping={isAiTyping}
          selectedMove={selectedMove}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          stance={stance}
        />

        {/* ── Right Panel: AI Opponent ── */}
        <AIPanel
          score={aiScore}
          maxScore={30}
          difficulty={difficulty}
          currentRound={1}
          totalRounds={5}
          onRequestVerdict={() => setShowVerdict(true)}
          stance={stance === "for" ? "against" : "for"}
        />
      </div>

      {/* ── Verdict Overlay ── */}
      <VerdictOverlay
        userScore={userScore}
        aiScore={aiScore}
        isOpen={showVerdict}
        onClose={() => setShowVerdict(false)}
      />
    </div>
  );
}

export default function Arena() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <ArenaContent />
    </Suspense>
  );
}
