/* ═══════════════════════════════════════════════════════════════
   DEBATE FEED — Center column chat/debate area
   Messages, typing indicator, and input zone
   ═══════════════════════════════════════════════════════════════ */

import { useRef, useEffect } from "react";

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
}

export default function DebateFeed({
  messages,
  isAiTyping,
  selectedMove,
  inputValue,
  onInputChange,
  onSubmit,
}: DebateFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isAiTyping]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* ── Messages Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* ── AI Typing Indicator ── */}
        {isAiTyping && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 bg-duo-surface2 border border-duo-border px-4 py-3 border-r-2 border-r-duo-red rounded-xl">
              <span className="w-1.5 h-1.5 bg-duo-red animate-dot-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-red animate-dot-pulse" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 bg-duo-red animate-dot-pulse" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input Zone ── */}
      <div className="border-t border-duo-border p-4 flex flex-col gap-2">
        {/* Active move label */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-duo-dim uppercase">
            MOVE:
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-duo-purple uppercase font-bold">
            {selectedMove}
          </span>
        </div>

        {/* Textarea + Send */}
        <div className="flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="State your argument…"
            rows={2}
            className="flex-1 bg-duo-surface2 border border-duo-border text-foreground font-space text-sm p-3 resize-none min-h-[52px] max-h-[110px] rounded-xl placeholder:text-duo-dim focus:outline-none focus:border-duo-purple focus:shadow-[0_0_12px_hsl(248_100%_70%/0.2)] transition-all duration-200"
          />
          <button
            onClick={onSubmit}
            disabled={!inputValue.trim()}
            className="font-syne font-bold text-sm tracking-wider uppercase px-6 py-3 bg-duo-purple text-primary-foreground rounded-xl hover:brightness-125 hover:shadow-[0_0_16px_hsl(248_100%_70%/0.4)] disabled:opacity-[0.35] transition-all duration-200 active:scale-[0.97]"
          >
            ARGUE →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message }: { message: DebateMessage }) {
  const isUser = message.sender === "user";
  const borderColor = isUser ? "border-l-2 border-l-duo-purple" : "border-r-2 border-r-duo-red";
  const badgeColor = isUser ? "text-duo-purple bg-duo-purple/10" : "text-duo-red bg-duo-red/10";

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className={`flex items-start gap-3 max-w-[75%] ${isUser ? "" : "flex-row-reverse"}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 flex items-center justify-center shrink-0 ${
            isUser ? "bg-duo-surface2 border border-duo-purple/30" : "bg-duo-surface2 border border-duo-red/30"
          }`}
        >
          <span className={`font-mono text-[9px] font-bold ${isUser ? "text-duo-purple" : "text-duo-red"}`}>
            {isUser ? "YOU" : "AI"}
          </span>
        </div>

        {/* Bubble */}
        <div className={`bg-duo-surface2 ${borderColor} p-3 flex flex-col gap-1.5`}>
          {/* Round meta */}
          <span className="font-mono text-[9px] tracking-[0.15em] text-duo-dim">
            Round {message.round} · {message.move}
          </span>

          {/* Move badge */}
          <span className={`font-mono text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 w-fit ${badgeColor}`}>
            {message.move}
          </span>

          {/* Message text */}
          <p className="font-space text-sm text-foreground leading-relaxed">{message.text}</p>

          {/* AI feedback tag */}
          {message.feedback && (
            <span
              className={`font-mono text-[9px] tracking-[0.1em] px-1.5 py-0.5 border w-fit mt-1 ${
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
