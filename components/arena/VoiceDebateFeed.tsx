"use client";
/* ═══════════════════════════════════════════════════════════════
   VOICE DEBATE FEED — Center column for voice mode
   Mic button, live transcript, messages
   ═══════════════════════════════════════════════════════════════ */

import { useRef, useEffect } from "react";

/* ── Types (same as DebateFeed) ── */
export interface DebateMessage {
  id: string;
  sender: "user" | "ai";
  move: string;
  text: string;
  round: number;
  feedback?: { text: string; type: "strong" | "weak" };
}

interface VoiceDebateFeedProps {
  messages: DebateMessage[];
  isAiTyping: boolean;
  isAiSpeaking: boolean;
  isRecording: boolean;
  liveTranscript: string;
  selectedMove: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  stance: "for" | "against";
}

export default function VoiceDebateFeed({
  messages,
  isAiTyping,
  isAiSpeaking,
  isRecording,
  liveTranscript,
  selectedMove,
  onStartRecording,
  onStopRecording,
  stance,
}: VoiceDebateFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAiTyping, liveTranscript]);

  const micDisabled = isAiTyping || isAiSpeaking;

  const handleMicToggle = () => {
    if (micDisabled) return;
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background setup-panel-split border-y-0 relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* ── Messages Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} stance={stance} />
        ))}

        {/* ── AI Typing Indicator ── */}
        {isAiTyping && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 bubble-blue px-4 py-3 rounded-xl">
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}

        {/* ── Floor Transition ── */}
        {!isAiTyping && !isAiSpeaking && messages.length > 0 && messages[messages.length - 1].sender === "ai" && (
          <div className="flex items-center justify-center py-4 opacity-0 animate-[floorSweep_1.5s_ease-in-out_forwards]">
            <p className="font-space text-xs font-medium italic tracking-[0.4em] text-duo-gold opacity-80">
              THE FLOOR IS YOURS
            </p>
          </div>
        )}
      </div>

      {/* ── Voice Input Zone ── */}
      <div className="border-t border-duo-border p-6 flex flex-col items-center gap-4">
        {/* Active move label */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
            MOVE:
          </span>
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-purple uppercase font-bold">
            {selectedMove}
          </span>
        </div>

        {/* ── Mic Button ── */}
        <button
          onClick={handleMicToggle}
          disabled={micDisabled}
          className={`mic-btn ${isRecording ? "mic-btn-recording" : "animate-glow-pulse"} ${micDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {/* Pulsing rings when recording */}
          {isRecording && (
            <>
              <div className="mic-ring" />
              <div className="mic-ring" />
              <div className="mic-ring" />
            </>
          )}

          {/* Mic Icon */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isRecording ? "hsl(320, 80%, 60%)" : "hsl(248, 55%, 60%)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* Status text */}
        <p className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">
          {isRecording
            ? "LISTENING…"
            : isAiSpeaking
            ? "AI IS SPEAKING…"
            : isAiTyping
            ? "AI IS THINKING…"
            : "TAP TO SPEAK"}
        </p>

        {/* ── Live Transcript ── */}
        {(isRecording || liveTranscript) && (
          <div className="w-full max-w-[500px] min-h-[48px] bg-gradient-to-b from-duo-surface2 to-background border border-duo-purple/30 rounded-xl p-3 transition-all duration-300">
            <p className="font-space text-sm text-foreground leading-relaxed">
              {liveTranscript || (
                <span className="text-duo-dim italic">Listening for your voice…</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Message Bubble (same as DebateFeed) ── */
function MessageBubble({ message, stance }: { message: DebateMessage; stance: "for" | "against" }) {
  const isUser = message.sender === "user";
  const isFor = stance === "for";

  let themeArgs = {
    text: "",
    bg: "",
    border: "",
    bubble: "",
    shadow: "",
    label: ""
  };

  if (isUser) {
    if (isFor) {
      themeArgs = { text: "text-duo-cyan", bg: "bg-duo-cyan/10", border: "border-duo-cyan/30", bubble: "bubble-blue", shadow: "shadow-[0_0_15px_hsl(var(--duo-cyan)/0.2)]", label: "YOU" };
    } else {
      themeArgs = { text: "text-duo-magenta", bg: "bg-duo-magenta/10", border: "border-duo-magenta/30", bubble: "bubble-purple", shadow: "shadow-[0_0_15px_hsl(var(--duo-magenta)/0.2)]", label: "YOU" };
    }
  } else {
    if (isFor) {
      themeArgs = { text: "text-duo-magenta", bg: "bg-duo-magenta/10", border: "border-duo-magenta/30", bubble: "bubble-purple", shadow: "shadow-[0_0_15px_hsl(var(--duo-magenta)/0.2)]", label: "AI" };
    } else {
      themeArgs = { text: "text-duo-cyan", bg: "bg-duo-cyan/10", border: "border-duo-cyan/30", bubble: "bubble-blue", shadow: "shadow-[0_0_15px_hsl(var(--duo-cyan)/0.2)]", label: "AI" };
    }
  }

  const badgeColor = `${themeArgs.text} ${themeArgs.bg} ${themeArgs.border}`;
  const avatarBg = `bg-gradient-to-br from-background to-duo-surface2 border ${themeArgs.border} ${themeArgs.shadow}`;

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className={`flex items-start gap-3 max-w-[75%] ${isUser ? "" : "flex-row-reverse"}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-lg ${avatarBg}`}
        >
          <span className={`font-mono text-[9px] font-bold ${themeArgs.text}`}>
            {themeArgs.label}
          </span>
        </div>

        {/* Bubble */}
        <div className={`${themeArgs.bubble} p-3 flex flex-col gap-1.5 rounded-xl`}>
          {/* Round meta */}
          <span className="font-mono text-[0.65rem] tracking-[0.15em] text-duo-muted">
            Round {message.round} · {message.move}
          </span>

          {/* Move badge */}
          <span className={`font-mono text-[0.65rem] tracking-[0.15em] uppercase px-1.5 py-0.5 w-fit rounded-md ${badgeColor}`}>
            {message.move}
          </span>

          {/* Message text */}
          <p className="font-space text-[0.9rem] text-[#e8e6e0] leading-relaxed">{message.text}</p>

          {/* AI feedback tag */}
          {message.feedback && (
            <span
              className={`font-mono text-[9px] tracking-[0.1em] px-1.5 py-0.5 border w-fit mt-1 rounded-md ${
                message.feedback.type === "strong"
                  ? "text-duo-green border-duo-green/40"
                  : "text-duo-gold border-duo-gold/40"
              }`}
            >
              {message.feedback.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
