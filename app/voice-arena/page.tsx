"use client";

/* ═══════════════════════════════════════════════════════════════
   VOICE ARENA PAGE — DuoDebate
   Full 3-column voice debate interface with Web Speech API
   Includes: real-time scoring, verbal narration of analytics,
   feedback/hint via verdict API, and synchronized state.
   Route: /voice-arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import VoiceDebateFeed, { type DebateMessage } from "@/components/arena/VoiceDebateFeed";
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

/* ── SpeechRecognition type helper ── */
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onspeechend: (() => void) | null;
}

function getRecognitionConstructor(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/* ── Types ── */
type RoundScore = { round: number; userScore: number; aiScore: number };
type VerdictData = {
  winner: "user" | "ai" | "draw";
  magnitude: "draw" | "close" | "clear" | "dominant";
  headline: string;
  analysis: string;
  keyMoment: string;
};

const TOTAL_ROUNDS = 5;
const MAX_SCORE = TOTAL_ROUNDS * 5; // 25 max possible score

function VoiceArenaContent() {
  const searchParams = useSearchParams();
  const stance = (searchParams.get("stance") as "for" | "against") || "for";
  const difficulty = (searchParams.get("difficulty") as "novice" | "adept" | "oracle") || "adept";
  const motion = searchParams.get("motion") || "perfumes";

  const [selectedMove, setSelectedMove] = useState<
    "ARGUMENT" | "REBUTTAL" | "EVIDENCE" | "ANALOGY" | "CONCESSION" | "CHALLENGE"
  >("ARGUMENT");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showVerdict, setShowVerdict] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);

  /* ── Round tracking (explicit state like text arena) ── */
  const [currentRound, setCurrentRound] = useState(1);

  /* ── Scoring state ── */
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [isScoring, setIsScoring] = useState(false);

  /* ── Verdict state ── */
  const [verdictPassed, setVerdictPassed] = useState(false);
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);
  const [isVerdictLoading, setIsVerdictLoading] = useState(false);

  /* ── Feedback & hint state (powered by verdict API) ── */
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);

  const hasSentMessage = messages.some(m => m.sender === "user");
  const canRequestVerdict = roundScores.length > 0;

  /* ═══════════════════════════════════════════════════════════
     SPEECH SYNTHESIS — Sequential speech queue
     Queues multiple utterances so analytics narrations
     play AFTER the AI reply finishes speaking.
     ═══════════════════════════════════════════════════════════ */
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);

  const processQueue = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (speechQueueRef.current.length === 0) {
      isSpeakingQueueRef.current = false;
      setIsAiSpeaking(false);
      return;
    }

    isSpeakingQueueRef.current = true;
    setIsAiSpeaking(true);

    const text = speechQueueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => processQueue();
    utterance.onerror = () => processQueue();

    window.speechSynthesis.speak(utterance);
  }, []);

  /** Queue one or more texts to be spoken sequentially */
  const speakSequence = useCallback((...texts: string[]) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    speechQueueRef.current = [...texts];
    isSpeakingQueueRef.current = false;
    processQueue();
  }, [processQueue]);

  /** Speak a single text (cancels queue) */
  const speakText = useCallback((text: string) => {
    speakSequence(text);
  }, [speakSequence]);

  /* ═══════════════════════════════════════════════════════════
     GROQ DEBATE API
     ═══════════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════════
     VERDICT API — used for verdict, feedback, and hints
     ═══════════════════════════════════════════════════════════ */
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
        // Speak the verdict aloud
        const verdictSpeech = `The verdict is in. ${data.headline || ""}. ${data.analysis || ""}`;
        speakText(verdictSpeech);
      }
    } catch (err) {
      console.error("Verdict API failed:", err);
    } finally {
      setIsVerdictLoading(false);
    }
  }, [motion, stance, speakText]);

  /* ── Get Feedback handler (uses verdict API as analytical coach) ── */
  const handleGetFeedback = useCallback(async () => {
    if (isFeedbackLoading || !hasSentMessage) return;
    const latestUserMsg = [...messages].reverse().find(m => m.sender === "user");
    const latestAiMsg = [...messages].reverse().find(m => m.sender === "ai");
    if (!latestUserMsg || !latestAiMsg) return;
    setIsFeedbackLoading(true);
    try {
      const res = await fetchWithTimeout("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motion,
          userStance: stance,
          conversationHistory: messages.map(m => ({
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          totalUserScore: userScore,
          totalAiScore: aiScore,
          roundScores,
        }),
      }, 15000);
      if (res.ok) {
        const data = await res.json();
        const feedback = data.analysis || data.keyMoment || "Keep debating to receive feedback.";
        setFeedbackText(feedback);
        // Speak the feedback
        speakText(`Coach's analysis: ${feedback}`);
      }
    } catch (err) { console.error("Feedback error:", err); }
    finally { setIsFeedbackLoading(false); }
  }, [isFeedbackLoading, hasSentMessage, messages, motion, stance, userScore, aiScore, roundScores, speakText]);

  /* ── Get Hint handler (uses verdict API for strategic suggestion) ── */
  const handleGetHint = useCallback(async () => {
    if (isHintLoading || !hasSentMessage) return;
    const latestAiMsg = [...messages].reverse().find(m => m.sender === "ai");
    if (!latestAiMsg) return;
    setIsHintLoading(true);
    try {
      const res = await fetchWithTimeout("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motion,
          userStance: stance,
          conversationHistory: messages.map(m => ({
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          totalUserScore: userScore,
          totalAiScore: aiScore,
          roundScores,
        }),
      }, 15000);
      if (res.ok) {
        const data = await res.json();
        const hint = data.keyMoment || data.analysis || "Try a different rhetorical angle.";
        setHintText(hint);
        // Speak the hint
        speakText(`Here's a tip: ${hint}`);
      }
    } catch (err) { console.error("Hint error:", err); }
    finally { setIsHintLoading(false); }
  }, [isHintLoading, hasSentMessage, messages, motion, stance, userScore, aiScore, roundScores, speakText]);

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
          const aiMsg: DebateMessage = {
            id: Date.now().toString(),
            sender: "ai",
            move: data.move || "ARGUMENT",
            text: data.reply,
            round: 0,
          };
          setMessages([aiMsg]);
          setInitialFetched(true);

          // Speak the opening statement
          speakText(data.reply);
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
  }, [initialFetched, callDebateAPI, speakText]);

  /* ═══════════════════════════════════════════════════════════
     SPEECH RECOGNITION
     ═══════════════════════════════════════════════════════════ */
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const startRecording = useCallback(() => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    finalTranscriptRef.current = "";
    setLiveTranscript("");

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      finalTranscriptRef.current = finalText;
      setLiveTranscript(finalText + interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const text = finalTranscriptRef.current.trim();
      if (text) {
        handleVoiceSubmit(text);
      }
      setLiveTranscript("");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      setLiveTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /* ── Clean up on unmount ── */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════
     SUBMIT VOICE TRANSCRIPT → DEBATE API → SCORE → NARRATE
     Full pipeline: debate reply, scoring, verbal analytics
     ═══════════════════════════════════════════════════════════ */
  const handleVoiceSubmit = useCallback(async (text: string) => {
    if (verdictPassed || currentRound > TOTAL_ROUNDS) return;

    setFeedbackText(null);
    setHintText(null);

    const userMsg: DebateMessage = {
      id: Date.now().toString(),
      sender: "user",
      move: selectedMove,
      text,
      round: currentRound,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsAiTyping(true);

    try {
      // 1. Get AI debate reply
      const data = await callDebateAPI(
        newMessages.map(m => ({ sender: m.sender, text: m.text }))
      );
      const aiMsg: DebateMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        move: data.move || "REBUTTAL",
        text: data.reply,
        round: currentRound,
      };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      setIsAiTyping(false);

      // 2. Score this round
      let roundUserScore = 0;
      let roundAiScore = 0;
      let scoreUserReason = "";
      let scoreAiReason = "";
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
          scoreUserReason = scoreData.userReason || "";
          scoreAiReason = scoreData.aiReason || "";

          // Apply feedback badges to messages
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

      // 3. Accumulate scores
      const newAccumulatedUserScore = userScore + roundUserScore;
      const newAccumulatedAiScore = aiScore + roundAiScore;
      const newRoundScores = [...roundScores, { round: currentRound, userScore: roundUserScore, aiScore: roundAiScore }];
      setUserScore(newAccumulatedUserScore);
      setAiScore(newAccumulatedAiScore);
      setRoundScores(newRoundScores);

      // 4. Build speech narration queue:
      //    [AI reply] → [Score summary] → [Feedback from score reasons]
      const speechParts: string[] = [data.reply];

      // Score narration
      const scoreNarration = `Round ${currentRound} scored. You earned ${roundUserScore} points, the AI earned ${roundAiScore}. Total score: ${newAccumulatedUserScore} to ${newAccumulatedAiScore}.`;
      speechParts.push(scoreNarration);

      // Feedback narration from score reasons
      if (scoreUserReason) {
        speechParts.push(`Your performance: ${scoreUserReason}`);
      }

      // Speak the full sequence
      speakSequence(...speechParts);

      // 5. Check for verdict trigger
      if (currentRound >= TOTAL_ROUNDS) {
        // Delay verdict slightly so score speech finishes
        setTimeout(() => {
          triggerVerdict(updatedMessages, newAccumulatedUserScore, newAccumulatedAiScore, newRoundScores);
        }, 500);
      } else {
        setCurrentRound(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to fetch AI reply:", err);
      setIsAiTyping(false);
    }
  }, [selectedMove, currentRound, messages, callDebateAPI, motion, stance, userScore, aiScore, roundScores, verdictPassed, speakSequence, triggerVerdict]);

  /* ── Manual verdict request ── */
  const handleManualVerdict = useCallback(() => {
    triggerVerdict(messages, userScore, aiScore, roundScores);
  }, [triggerVerdict, messages, userScore, aiScore, roundScores]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
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
        totalRounds={TOTAL_ROUNDS}
        stance={stance}
        difficulty={difficulty}
      />

      {/* ── Three-Column Layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left Panel: User ── */}
        <UserPanel
          score={userScore}
          maxScore={MAX_SCORE}
          selectedMove={selectedMove}
          onMoveChange={setSelectedMove}
          stance={stance}
        />

        {/* ── Center: Voice Debate Feed ── */}
        <VoiceDebateFeed
          messages={messages}
          isAiTyping={isAiTyping}
          isAiSpeaking={isAiSpeaking}
          isRecording={isRecording}
          liveTranscript={liveTranscript}
          selectedMove={selectedMove}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          stance={stance}
        />

        {/* ── Right Panel: AI Opponent ── */}
        <AIPanel
          score={aiScore}
          maxScore={MAX_SCORE}
          difficulty={difficulty}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
          onRequestVerdict={handleManualVerdict}
          stance={stance === "for" ? "against" : "for"}
          isSpeaking={isAiSpeaking}
          canRequestVerdict={canRequestVerdict}
          hasSentMessage={hasSentMessage}
          onGetFeedback={handleGetFeedback}
          onGetHint={handleGetHint}
          feedbackText={feedbackText}
          hintText={hintText}
          isFeedbackLoading={isFeedbackLoading}
          isHintLoading={isHintLoading}
        />
      </div>

      {/* ── Verdict Overlay ── */}
      <VerdictOverlay
        userScore={userScore}
        aiScore={aiScore}
        isOpen={showVerdict}
        onClose={() => setShowVerdict(false)}
        isLoading={isVerdictLoading}
        winner={verdictData?.winner}
        magnitude={verdictData?.magnitude}
        headline={verdictData?.headline}
        analysis={verdictData?.analysis}
        keyMoment={verdictData?.keyMoment}
      />
    </div>
  );
}

export default function VoiceArena() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <VoiceArenaContent />
    </Suspense>
  );
}
