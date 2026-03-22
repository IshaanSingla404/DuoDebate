/* ═══════════════════════════════════════════════════════════════
   VERDICT API — DuoDebate
   Purpose: Generate a dynamic AI-powered verdict analyzing the
   full debate and determining the winner.
   Env key: GROQ_VERDICT_API_KEY

   Request body:
   {
     motion: string,
     userStance: string,
     conversationHistory: { role: "user" | "assistant", content: string }[],
     totalUserScore: number,
     totalAiScore: number,
     roundScores: { round: number, userScore: number, aiScore: number }[]
   }

   Response body:
   {
     winner: "user" | "ai" | "draw",
     magnitude: "draw" | "close" | "clear" | "dominant",
     headline: string,
     analysis: string,
     keyMoment: string
   }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/* Named constant for the verdict system prompt */
const VERDICT_SYSTEM_PROMPT = `You are the chief judge of a debate competition. Analyze the full debate and deliver a verdict.

You will receive the debate motion, the full conversation transcript, total accumulated scores for both sides, and per-round score breakdowns.

Determine the winner based on total scores:
- If scores are equal: winner = "draw"
- If user has more points: winner = "user"
- If AI has more points: winner = "ai"

Determine the magnitude based on the absolute score difference:
- Score diff = 0: magnitude = "draw" — headline tone: "It was neck and neck."
- Score diff 1–3: magnitude = "close" — tone: "A close call, but the edge goes to..."
- Score diff 4–7: magnitude = "clear" — tone: "A clear victory for..."
- Score diff 8+: magnitude = "dominant" — tone: "A dominant, one-sided performance by..."

Analyze the actual messages (not just scores), identify the most important turning point, and write the analysis in second person addressing the user ("You opened strong...", "The AI caught up in round 3...").

Return ONLY a raw JSON object:
{
  "winner": "user" | "ai" | "draw",
  "magnitude": "draw" | "close" | "clear" | "dominant",
  "headline": "<short punchy verdict line>",
  "analysis": "<3-4 sentences: key turning points, strongest argument, where the tide turned>",
  "keyMoment": "<1 sentence: single most pivotal argument in the whole debate>"
}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_VERDICT_API_KEY;

    if (!apiKey || apiKey === "your_groq_key_here") {
      return NextResponse.json(
        { error: "GROQ_VERDICT_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { motion, userStance, conversationHistory, totalUserScore, totalAiScore, roundScores } = body;

    if (!motion || !userStance || !conversationHistory) {
      return NextResponse.json(
        { error: "Missing required fields (motion, userStance, conversationHistory)" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Build context with full transcript and score breakdown
    const contextPrompt = `Debate motion: "${motion}"
User's stance: ${userStance.toUpperCase()} the motion.

Full transcript:
${conversationHistory.map((m: { role: string; content: string }) => `${m.role === "user" ? "USER" : "AI"}: ${m.content}`).join("\n\n")}

Scores:
- Total User Score: ${totalUserScore ?? 0}
- Total AI Score: ${totalAiScore ?? 0}
- Score difference: ${Math.abs((totalUserScore ?? 0) - (totalAiScore ?? 0))}

Per-round breakdown:
${(roundScores || []).map((r: { round: number; userScore: number; aiScore: number }) => `Round ${r.round}: User ${r.userScore}/5 — AI ${r.aiScore}/5`).join("\n")}

Deliver your verdict.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: VERDICT_SYSTEM_PROMPT },
            { role: "user", content: contextPrompt },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.5,
          max_tokens: 500,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from Groq API");

      const parsed = JSON.parse(content);

      return NextResponse.json({
        winner: parsed.winner || "draw",
        magnitude: parsed.magnitude || "draw",
        headline: parsed.headline || "",
        analysis: parsed.analysis || "",
        keyMoment: parsed.keyMoment || "",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate verdict";
    console.error("Error in /api/verdict:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
