"use client";

/* ═══════════════════════════════════════════════════════════════
   ARENA PAGE — DuoDebate
   Full 3-column debate interface with scoring, round enforcement,
   verdict triggering, feedback, and hints.
   Route: /arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import DebateFeed, { type DebateMessage } from "@/components/arena/DebateFeed";
import VerdictOverlay from "@/components/arena/VerdictOverlay";

/* ── Types ── */
type RoundScore = { round: number; userScore: number; aiScore: number };
type VerdictData = {
  winner: "user" | "ai" | "draw";
  magnitude: "draw" | "close" | "clear" | "dominant";
  headline: string;
  analysis: string;
  keyMoment: string;
};

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

const TOTAL_ROUNDS = 5;
const MAX_SCORE = TOTAL_ROUNDS * 5; // 25 max possible score

function ArenaContent() {
  const searchParams = useSearchParams();
  const stance = (searchParams.get("stance") as "for" | "against") || "for";
  const difficulty = (searchParams.get("difficulty") as "novice" | "adept" | "oracle") || "adept";
  const motion = searchParams.get("motion") || "perfumes";

  /* ── Core debate state ── */
  const [selectedMove, setSelectedMove] = useState<
    "ARGUMENT" | "REBUTTAL" | "EVIDENCE" | "ANALOGY" | "CONCESSION" | "CHALLENGE"
  >("ARGUMENT");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);

  /* ── Round tracking (explicit state, Change 2) ── */
  const [currentRound, setCurrentRound] = useState(1);

  /* ── Scoring state (Change 3) ── */
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [isScoring, setIsScoring] = useState(false);

  /* ── Verdict state (Change 4) ── */
  const [verdictPassed, setVerdictPassed] = useState(false);
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);
  const [isVerdictLoading, setIsVerdictLoading] = useState(false);

  /* ── Feedback & hint state (Changes 6, 7) ── */
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);

  /* ── Disabled input message (Change 8b) ── */
  const disabledMessage = verdictPassed
    ? "The debate has concluded. Upgrade to unlock extended debate lengths."
    : currentRound > TOTAL_ROUNDS
    ? "Extended debate lengths are coming soon — upgrade to unlock."
    : undefined;

  const hasSentMessage = messages.some(m => m.sender === "user");
  const canRequestVerdict = roundScores.length > 0;

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
    if (!data.reply) throw new Error("No reply in API response");
    return data;
  }, [motion, stance, difficulty]);

  /* ── Trigger verdict (Change 4) ── */
  const triggerVerdict = useCallback(async (
    allMessages: DebateMessage[],
    totalUser: number,
    totalAi: number,
    allRoundScores: RoundScore[]
  ) => {
    setIsVerdictLoading(true);
    setShowVerdict(true);
    setVerdictPassed(true);
    try {
      const res = await fetchWithTimeout(
        "/api/verdict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motion,
            userStance: stance,
            conversationHistory: allMessages.map(m => ({
              role: m.sender === "ai" ? "assistant" : "user",
              content: m.text,
            })),
            totalUserScore: totalUser,
            totalAiScore: totalAi,
            roundScores: allRoundScores,
          }),
        },
        30000
      );
      if (res.ok) {
        const data = await res.json();
        setVerdictData(data);
      }
    } catch (err) {
      console.error("Verdict API failed:", err);
    } finally {
      setIsVerdictLoading(false);
    }
  }, [motion, stance]);

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
            round: 0,
          }]);
          setInitialFetched(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("abort")) console.error("Failed to fetch initial AI opening:", err);
        }
      } finally {
        if (!cancelled) setIsAiTyping(false);
      }
    };
    fetchInitial();
    return () => { cancelled = true; abortController.abort(); };
  }, [initialFetched, callDebateAPI]);

  /* ── Submit handler (Changes 2, 3, 4, 5) ── */
  const handleSubmit = async () => {
    if (!inputValue.trim() || isAiTyping || verdictPassed || currentRound > TOTAL_ROUNDS) return;
    setFeedbackText(null);
    setHintText(null);

    const userMsg: DebateMessage = {
      id: Date.now().toString(), sender: "user", move: selectedMove,
      text: inputValue, round: currentRound,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsAiTyping(true);

    try {
      const data = await callDebateAPI(newMessages.map(m => ({ sender: m.sender, text: m.text })));
      const aiMsg: DebateMessage = {
        id: (Date.now() + 1).toString(), sender: "ai",
        move: data.move || "REBUTTAL", text: data.reply, round: currentRound,
      };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      setIsAiTyping(false);

      // Score this round
      let roundUserScore = 0;
      let roundAiScore = 0;
      setIsScoring(true);
      try {
        const scoreRes = await fetchWithTimeout("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motion, userStance: stance,
            conversationHistory: updatedMessages.map(m => ({
              role: m.sender === "ai" ? "assistant" : "user", content: m.text,
            })),
            userLastMessage: userMsg.text, aiLastMessage: aiMsg.text,
          }),
        }, 30000);
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          roundUserScore = Math.min(5, Math.max(0, scoreData.userScore || 0));
          roundAiScore = Math.min(5, Math.max(0, scoreData.aiScore || 0));
          const userFeedback = roundUserScore >= 4
            ? { text: "STRONG POINT", type: "strong" as const }
            : roundUserScore <= 2 ? { text: "WEAK ARGUMENT", type: "weak" as const } : undefined;
          const aiFeedback = roundAiScore >= 4
            ? { text: "STRONG POINT", type: "strong" as const }
            : roundAiScore <= 2 ? { text: "WEAK ARGUMENT", type: "weak" as const } : undefined;
          setMessages(prev => prev.map(m => {
            if (m.id === userMsg.id && userFeedback) return { ...m, feedback: userFeedback };
            if (m.id === aiMsg.id && aiFeedback) return { ...m, feedback: aiFeedback };
            return m;
          }));
        }
      } catch (err) {
        console.error("Scoring failed, defaulting to 0:", err);
      } finally { setIsScoring(false); }

      const newAccumulatedUserScore = userScore + roundUserScore;
      const newAccumulatedAiScore = aiScore + roundAiScore;
      const newRoundScores = [...roundScores, { round: currentRound, userScore: roundUserScore, aiScore: roundAiScore }];
      setUserScore(newAccumulatedUserScore);
      setAiScore(newAccumulatedAiScore);
      setRoundScores(newRoundScores);

      if (currentRound >= TOTAL_ROUNDS) {
        triggerVerdict(updatedMessages, newAccumulatedUserScore, newAccumulatedAiScore, newRoundScores);
      } else {
        setCurrentRound(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to fetch AI reply:", err);
      setIsAiTyping(false);
    }
  };

  /* ── Manual verdict request ── */
  const handleManualVerdict = () => {
    triggerVerdict(messages, userScore, aiScore, roundScores);
  };

  /* ── Get Feedback handler (Change 6) ── */
  const handleGetFeedback = async () => {
    if (isFeedbackLoading || !hasSentMessage) return;
    const latestUserMsg = [...messages].reverse().find(m => m.sender === "user");
    const latestAiMsg = [...messages].reverse().find(m => m.sender === "ai");
    if (!latestUserMsg || !latestAiMsg) return;
    setIsFeedbackLoading(true);
    try {
      const res = await fetchWithTimeout("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion, userStance: stance, userMessage: latestUserMsg.text, aiMessage: latestAiMsg.text }),
      }, 15000);
      if (res.ok) { const data = await res.json(); setFeedbackText(data.feedback); }
    } catch (err) { console.error("Feedback error:", err); }
    finally { setIsFeedbackLoading(false); }
  };

  /* ── Get Hint handler (Change 7) ── */
  const handleGetHint = async () => {
    if (isHintLoading || !hasSentMessage) return;
    const latestAiMsg = [...messages].reverse().find(m => m.sender === "ai");
    if (!latestAiMsg) return;
    setIsHintLoading(true);
    try {
      const res = await fetchWithTimeout("/api/hint", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motion, userStance: stance,
          conversationHistory: messages.map(m => ({ role: m.sender === "ai" ? "assistant" : "user", content: m.text })),
          aiLastMessage: latestAiMsg.text,
        }),
      }, 15000);
      if (res.ok) { const data = await res.json(); setHintText(data.hint); }
    } catch (err) { console.error("Hint error:", err); }
    finally { setIsHintLoading(false); }
  };

  const isInputDisabled = verdictPassed || currentRound > TOTAL_ROUNDS;

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

      <ArenaHudBar motion={motion} currentRound={currentRound} totalRounds={TOTAL_ROUNDS} stance={stance} difficulty={difficulty} />

      <div className="flex flex-1 min-h-0">
        <UserPanel score={userScore} maxScore={MAX_SCORE} selectedMove={selectedMove} onMoveChange={setSelectedMove} stance={stance} />
        <DebateFeed
          messages={messages} isAiTyping={isAiTyping} selectedMove={selectedMove}
          inputValue={inputValue} onInputChange={setInputValue} onSubmit={handleSubmit}
          stance={stance} isInputDisabled={isInputDisabled} disabledMessage={disabledMessage}
        />
        <AIPanel
          score={aiScore} maxScore={MAX_SCORE} difficulty={difficulty}
          currentRound={currentRound} totalRounds={TOTAL_ROUNDS}
          onRequestVerdict={handleManualVerdict}
          stance={stance === "for" ? "against" : "for"}
          canRequestVerdict={canRequestVerdict}
          onGetFeedback={handleGetFeedback} onGetHint={handleGetHint}
          feedbackText={feedbackText} hintText={hintText}
          isFeedbackLoading={isFeedbackLoading} isHintLoading={isHintLoading}
          hasSentMessage={hasSentMessage}
        />
      </div>

      <VerdictOverlay
        userScore={userScore} aiScore={aiScore} isOpen={showVerdict}
        onClose={() => setShowVerdict(false)} isLoading={isVerdictLoading}
        winner={verdictData?.winner} magnitude={verdictData?.magnitude}
        headline={verdictData?.headline} analysis={verdictData?.analysis}
        keyMoment={verdictData?.keyMoment}
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
