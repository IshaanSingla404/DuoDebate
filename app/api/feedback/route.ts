/* ═══════════════════════════════════════════════════════════════
   FEEDBACK API — DuoDebate
   Purpose: Provide quick per-round feedback on the user's
   latest argument — what landed, what didn't, one specific tip.
   Env key: GROQ_VERDICT_API_KEY

   Request body:
   { motion: string, userStance: string, userMessage: string, aiMessage: string }

   Response body:
   { feedback: string }  // 2-3 sentences, under 60 words
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/* Named constant for the feedback system prompt */
const FEEDBACK_SYSTEM_PROMPT = `You are a blunt, specific debate coach. Analyze the user's latest debate argument and give targeted feedback.

Rules:
- Be blunt, specific, and brief. No padding.
- Point to exactly one strength and one weakness in the user's message.
- Under 60 words total.
- Address the user in second person ("You...", "Your...").
- Do NOT be generic ("be more specific"). Reference actual content from the message.

Return ONLY a raw JSON object:
{
  "feedback": "<2-3 sentences of feedback>"
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
    const { motion, userStance, userMessage, aiMessage } = body;

    if (!motion || !userStance || !userMessage || !aiMessage) {
      return NextResponse.json(
        { error: "Missing required fields (motion, userStance, userMessage, aiMessage)" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const contextPrompt = `Debate motion: "${motion}"
User's stance: ${userStance.toUpperCase()}

User's argument: "${userMessage}"
AI opponent's argument: "${aiMessage}"

Give the user targeted feedback on their argument.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const completion = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
            { role: "user", content: contextPrompt },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.5,
          max_tokens: 200,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from Groq API");

      const parsed = JSON.parse(content);
      return NextResponse.json({
        feedback: parsed.feedback || "Unable to generate feedback.",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Feedback generation failed";
    console.error("Error in /api/feedback:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
