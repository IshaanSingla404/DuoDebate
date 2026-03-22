"use client";

/* ═══════════════════════════════════════════════════════════════
   VOICE ARENA PAGE — DuoDebate
   Full 3-column voice debate interface with Web Speech API
   Route: /voice-arena
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArenaHudBar from "@/components/arena/ArenaHudBar";
import { UserPanel, AIPanel } from "@/components/arena/PlayerPanels";
import VoiceDebateFeed, { type DebateMessage } from "@/components/arena/VoiceDebateFeed";
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

  const [selectedMove, setSelectedMove] = useState<
    "ARGUMENT" | "REBUTTAL" | "EVIDENCE" | "ANALOGY" | "CONCESSION" | "CHALLENGE"
  >("ARGUMENT");
  const [messages, setMessages] = useState<DebateMessage[]>(DEMO_MESSAGES);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showVerdict, setShowVerdict] = useState(false);

  /* ── Placeholder scores ── */
  const userScore = 0;
  const aiScore = 0;

  /* ── Speech Recognition ── */
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
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      finalTranscriptRef.current = final;
      setLiveTranscript(final + interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const text = finalTranscriptRef.current.trim() || liveTranscript.trim();
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
  }, [liveTranscript]);

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

  /* ── Submit voice transcript ── */
  const handleVoiceSubmit = useCallback((text: string) => {
    const newMsg: DebateMessage = {
      id: Date.now().toString(),
      sender: "user",
      move: selectedMove,
      text,
      round: 1,
    };
    setMessages((prev) => [...prev, newMsg]);

    // Simulate AI typing
    setIsAiTyping(true);
    setTimeout(() => {
      const aiText =
        "An interesting point, but it fails to address the core economic benefits that the perfume industry brings to developing nations where these ingredients are sourced. Your argument conflates correlation with causation.";
      const aiMsg: DebateMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        move: "REBUTTAL",
        text: aiText,
        round: 1,
        feedback: { text: "Address the economic counter-point", type: "weak" },
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsAiTyping(false);

      // Speak the AI response
      speakText(aiText);
    }, 2000);
  }, [selectedMove]);

  /* ── Speech Synthesis ── */
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
          currentRound={1}
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
