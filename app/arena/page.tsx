"use client";

/* ═══════════════════════════════════════════════════════════════
   ARENA PAGE — DuoDebate
   Full 3-column debate interface
   Route: /arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import DebateFeed, { type DebateMessage } from "@/components/arena/DebateFeed";
import VerdictOverlay from "@/components/arena/VerdictOverlay";

/* ── Helper: fetch with timeout ── */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const stance = (searchParams.get("stance") as "for" | "against") || "for";
  const difficulty = (searchParams.get("difficulty") as "novice" | "adept" | "oracle") || "adept";
  const motion = searchParams.get("motion") || "perfumes";
  const [selectedMove, setSelectedMove] = useState<
    "ARGUMENT" | "REBUTTAL" | "EVIDENCE" | "ANALOGY" | "CONCESSION" | "CHALLENGE"
  >("ARGUMENT");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);

  const currentRound = Math.floor(messages.length / 2) + 1;

  /* ── Call the debate API ── */
  const callDebateAPI = useCallback(async (
    conversationMessages: { sender: string; text: string }[],
    signal?: AbortSignal
  ) => {
    const res = await fetchWithTimeout(
      "/api/debate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion, stance, difficulty, messages: conversationMessages }),
        signal,
      },
      30000
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown server error" }));
      throw new Error(errorData.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    if (!data.reply) {
      throw new Error("No reply in API response");
    }
    return data;
  }, [motion, stance, difficulty]);

  /* ── Fetch AI opening statement on mount ── */
  useEffect(() => {
    if (initialFetched) return;

    const abortController = new AbortController();
    let cancelled = false;

    const fetchInitial = async () => {
      setIsAiTyping(true);
      try {
        const data = await callDebateAPI([], abortController.signal);
        if (!cancelled) {
          setMessages([{
            id: Date.now().toString(),
            sender: "ai",
            move: data.move || "ARGUMENT",
            text: data.reply,
            round: 1,
          }]);
          setInitialFetched(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("abort")) {
            console.error("Failed to fetch initial AI opening:", err);
          }
        }
      } finally {
        if (!cancelled) setIsAiTyping(false);
      }
    };
    fetchInitial();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [initialFetched, callDebateAPI]);

  /* ── Placeholder scores ── */
  const userScore = 0;
  const aiScore = 0;

  /* ── Submit handler ── */
  const handleSubmit = async () => {
    if (!inputValue.trim() || isAiTyping) return;

    const newMsg: DebateMessage = {
      id: Date.now().toString(),
      sender: "user",
      move: selectedMove,
      text: inputValue,
      round: currentRound,
    };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsAiTyping(true);

    try {
      const data = await callDebateAPI(
        newMessages.map(m => ({ sender: m.sender, text: m.text }))
      );
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          move: data.move || "REBUTTAL",
          text: data.reply,
          round: currentRound,
        },
      ]);
    } catch (err) {
      console.error("Failed to fetch AI reply:", err);
    } finally {
      setIsAiTyping(false);
    }
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
        motion={motion}
        currentRound={currentRound}
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
          currentRound={currentRound}
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
