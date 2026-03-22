"use client";

/* ═══════════════════════════════════════════════════════════════
   VOICE ARENA PAGE — DuoDebate
   Full 3-column voice debate interface with Web Speech API
   Uses the same /api/debate Groq endpoint as the text arena
   Route: /voice-arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import VoiceDebateFeed, { type DebateMessage } from "@/components/arena/VoiceDebateFeed";
import VerdictOverlay from "@/components/arena/VerdictOverlay";

/* ── Helper: fetch with timeout (same as text arena) ── */
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

  const currentRound = Math.floor(messages.length / 2) + 1;

  /* ── Scores ── */
  const userScore = 0;
  const aiScore = 0;

  /* ═══════════════════════════════════════════════════════════
     GROQ API — identical to text arena /arena/page.tsx
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
            round: 1,
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
  }, [initialFetched, callDebateAPI]);

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
     SUBMIT VOICE TRANSCRIPT → GROQ API (same as text arena)
     ═══════════════════════════════════════════════════════════ */
  const handleVoiceSubmit = useCallback(async (text: string) => {
    const newMsg: DebateMessage = {
      id: Date.now().toString(),
      sender: "user",
      move: selectedMove,
      text,
      round: currentRound,
    };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setIsAiTyping(true);

    try {
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
      setMessages(prev => [...prev, aiMsg]);

      // Speak the AI response aloud
      speakText(data.reply);
    } catch (err) {
      console.error("Failed to fetch AI reply:", err);
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedMove, currentRound, messages, callDebateAPI]);

  /* ═══════════════════════════════════════════════════════════
     SPEECH SYNTHESIS — speak AI responses aloud
     ═══════════════════════════════════════════════════════════ */
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

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
          maxScore={30}
          difficulty={difficulty}
          currentRound={currentRound}
          totalRounds={5}
          onRequestVerdict={() => setShowVerdict(true)}
          stance={stance === "for" ? "against" : "for"}
          isSpeaking={isAiSpeaking}
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

export default function VoiceArena() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <VoiceArenaContent />
    </Suspense>
  );
}
