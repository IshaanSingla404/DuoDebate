/* ═══════════════════════════════════════════════════════════════
   SCORING API — DuoDebate
   Purpose: Evaluate and score both the user's and AI's latest
   arguments in a debate round.
   Env key: GROQ_SCORE_API_KEY

   Request body:
   {
     motion: string,
     userStance: string,
     conversationHistory: { role: "user" | "assistant", content: string }[],
     userLastMessage: string,
     aiLastMessage: string
   }

   Response body:
   {
     userScore: number,   // 0–5
     aiScore: number,     // 0–5
     userReason: string,  // 1 sentence
     aiReason: string     // 1 sentence
   }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/* Named constant for the scoring system prompt */
const SCORING_SYSTEM_PROMPT = `You are a strict, impartial debate judge. Score each message out of 5.
Scoring is STRICT. A score of 3 means average. 4 means genuinely strong. 5 is reserved for exceptional, near-perfect arguments. Do not award 4 or 5 easily.
Consider: logical coherence, use of evidence/examples, direct rebuttal of opponent's point, rhetorical effectiveness, and relevance to the motion.
Also consider prior rounds — reward consistency and punish repetition.
Return ONLY a raw JSON object. No markdown, no explanation outside the JSON.
{
  "userScore": <number 0-5>,
  "aiScore": <number 0-5>,
  "userReason": "<1 sentence explaining user's score>",
  "aiReason": "<1 sentence explaining AI's score>"
}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_SCORE_API_KEY;

    if (!apiKey || apiKey === "your_groq_key_here") {
      return NextResponse.json(
        { error: "GROQ_SCORE_API_KEY is not configured. Add your key to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { motion, userStance, conversationHistory, userLastMessage, aiLastMessage } = body;

    if (!motion || !userStance || !conversationHistory || !userLastMessage || !aiLastMessage) {
      return NextResponse.json(
        { error: "Missing required fields (motion, userStance, conversationHistory, userLastMessage, aiLastMessage)" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Build context with full conversation and latest exchange highlighted
    const contextPrompt = `The debate motion is: "${motion}"
The user argues ${userStance.toUpperCase()} the motion.

Here is the conversation so far:
${conversationHistory.map((m: { role: string; content: string }) => `${m.role === "user" ? "USER" : "AI"}: ${m.content}`).join("\n\n")}

Score ONLY the latest exchange:
USER's latest argument: "${userLastMessage}"
AI's latest argument: "${aiLastMessage}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: SCORING_SYSTEM_PROMPT },
            { role: "user", content: contextPrompt },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 300,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from Groq API");

      const parsed = JSON.parse(content);

      // Clamp scores to 0–5 range
      return NextResponse.json({
        userScore: Math.min(5, Math.max(0, Number(parsed.userScore) || 0)),
        aiScore: Math.min(5, Math.max(0, Number(parsed.aiScore) || 0)),
        userReason: parsed.userReason || "",
        aiReason: parsed.aiReason || "",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to score arguments";
    console.error("Error in /api/score:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
