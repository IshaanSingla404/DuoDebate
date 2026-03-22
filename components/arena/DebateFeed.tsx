"use client";
/* ═══════════════════════════════════════════════════════════════
   DEBATE FEED — Center column chat/debate area
   Messages, typing indicator, and input zone
   ═══════════════════════════════════════════════════════════════ */

import { useRef, useEffect, useState } from "react";

/* ── Types ── */
export interface DebateMessage {
  id: string;
  sender: "user" | "ai";
  move: string;
  text: string;
  round: number;
  feedback?: { text: string; type: "strong" | "weak" };
}

interface DebateFeedProps {
  messages: DebateMessage[];
  isAiTyping: boolean;
  selectedMove: string;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  stance: "for" | "against";
  isInputDisabled: boolean;
  disabledMessage?: string;
}

export default function DebateFeed({
  messages, isAiTyping, selectedMove, inputValue, onInputChange, onSubmit, stance,
  isInputDisabled, disabledMessage,
}: DebateFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDisabledMsg, setShowDisabledMsg] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAiTyping]);

  /* Shows inline disabled message for 3 seconds then fades */
  const handleDisabledClick = () => {
    if (!isInputDisabled || !disabledMessage) return;
    setShowDisabledMsg(true);
    setTimeout(() => setShowDisabledMsg(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background setup-panel-split border-y-0 relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* ── Messages Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} stance={stance} />
        ))}
        {isAiTyping && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 bubble-blue px-4 py-3 rounded-xl">
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-blue animate-dot-pulse" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input Zone ── */}
      <div className="border-t border-duo-border p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-muted uppercase">MOVE:</span>
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-duo-purple uppercase font-bold">{selectedMove}</span>
        </div>
        <div className="flex items-end gap-3" onClick={isInputDisabled ? handleDisabledClick : undefined}>
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
            placeholder={isInputDisabled ? "Debate concluded." : "State your argument…"}
            rows={2}
            disabled={isInputDisabled}
            className={`flex-1 bg-gradient-to-b from-duo-surface2 to-background border border-duo-purple/30 text-foreground font-space text-sm p-3 resize-none min-h-[52px] max-h-[110px] rounded-xl placeholder:text-duo-dim focus:outline-none focus:border-duo-purple focus:shadow-[0_0_12px_hsl(248_100%_70%/0.2)] transition-all duration-200 ${isInputDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
          />
          <button
            onClick={onSubmit}
            disabled={!inputValue.trim() || isInputDisabled}
            className={`btn-arena px-6 py-3 font-syne font-bold text-sm tracking-wider uppercase disabled:opacity-[0.35] transition-all duration-200 active:scale-[0.97] ${isInputDisabled ? "cursor-not-allowed" : ""}`}
          >ARGUE →</button>
        </div>
        {showDisabledMsg && disabledMessage && (
          <p className="font-mono text-[0.65rem] tracking-[0.1em] text-duo-magenta/80 text-center animate-[fadeInOut_3s_ease-in-out_forwards]">{disabledMessage}</p>
        )}
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message, stance }: { message: DebateMessage; stance: "for" | "against" }) {
  const isUser = message.sender === "user";
  const isFor = stance === "for";
  let themeArgs = { text: "", bg: "", border: "", bubble: "", shadow: "", label: "" };

  if (isUser) {
    if (isFor) { themeArgs = { text: "text-duo-cyan", bg: "bg-duo-cyan/10", border: "border-duo-cyan/30", bubble: "bubble-blue", shadow: "shadow-[0_0_15px_hsl(var(--duo-cyan)/0.2)]", label: "YOU" }; }
    else { themeArgs = { text: "text-duo-magenta", bg: "bg-duo-magenta/10", border: "border-duo-magenta/30", bubble: "bubble-purple", shadow: "shadow-[0_0_15px_hsl(var(--duo-magenta)/0.2)]", label: "YOU" }; }
  } else {
    if (isFor) { themeArgs = { text: "text-duo-magenta", bg: "bg-duo-magenta/10", border: "border-duo-magenta/30", bubble: "bubble-purple", shadow: "shadow-[0_0_15px_hsl(var(--duo-magenta)/0.2)]", label: "AI" }; }
    else { themeArgs = { text: "text-duo-cyan", bg: "bg-duo-cyan/10", border: "border-duo-cyan/30", bubble: "bubble-blue", shadow: "shadow-[0_0_15px_hsl(var(--duo-cyan)/0.2)]", label: "AI" }; }
  }

  const badgeColor = `${themeArgs.text} ${themeArgs.bg} ${themeArgs.border}`;
  const avatarBg = `bg-gradient-to-br from-background to-duo-surface2 border ${themeArgs.border} ${themeArgs.shadow}`;
  const roundLabel = message.round === 0 ? "Opening" : `Round ${message.round}`;

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className={`flex items-start gap-3 max-w-[75%] ${isUser ? "" : "flex-row-reverse"}`}>
        <div className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-lg ${avatarBg}`}>
          <span className={`font-mono text-[9px] font-bold ${themeArgs.text}`}>{themeArgs.label}</span>
        </div>
        <div className={`${themeArgs.bubble} p-3 flex flex-col gap-1.5 rounded-xl`}>
          <span className="font-mono text-[0.65rem] tracking-[0.15em] text-duo-muted">{roundLabel} · {message.move}</span>
          <span className={`font-mono text-[0.65rem] tracking-[0.15em] uppercase px-1.5 py-0.5 w-fit rounded-md ${badgeColor}`}>{message.move}</span>
          <p className="font-space text-[0.9rem] text-[#e8e6e0] leading-relaxed">{message.text}</p>
          {message.feedback && (
            <span className={`font-mono text-[9px] tracking-[0.1em] px-1.5 py-0.5 border w-fit mt-1 rounded-md ${
              message.feedback.type === "strong" ? "text-duo-green border-duo-green/40" : "text-duo-gold border-duo-gold/40"
            }`}>{message.feedback.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}
