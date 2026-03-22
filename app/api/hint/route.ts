/* ═══════════════════════════════════════════════════════════════
   HINT API — DuoDebate
   Purpose: Provide a single tactical suggestion for the user's
   next argument based on current debate state.
   Env key: GROQ_VERDICT_API_KEY

   Request body:
   {
     motion: string,
     userStance: string,
     conversationHistory: { role: "user" | "assistant", content: string }[],
     aiLastMessage: string
   }

   Response body:
   { hint: string }  // 1-2 sentences, under 40 words
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/* Named constant for the hint system prompt */
const HINT_SYSTEM_PROMPT = `You are a debate strategist. Give the user ONE specific argument angle or rhetorical move they can use in their next message.

Rules:
- Give ONE specific, usable tactical suggestion.
- NOT generic advice ("be more specific"). Give actual content ("You could argue that...").
- Under 40 words.
- Address the user directly ("You could...", "Try arguing that...").
- Base your hint on what the AI opponent just said — suggest a rebuttal angle.

Return ONLY a raw JSON object:
{
  "hint": "<1-2 sentence tactical suggestion>"
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
    const { motion, userStance, conversationHistory, aiLastMessage } = body;

    if (!motion || !userStance || !conversationHistory || !aiLastMessage) {
      return NextResponse.json(
        { error: "Missing required fields (motion, userStance, conversationHistory, aiLastMessage)" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const contextPrompt = `Debate motion: "${motion}"
User's stance: ${userStance.toUpperCase()}

Conversation so far:
${conversationHistory.map((m: { role: string; content: string }) => `${m.role === "user" ? "USER" : "AI"}: ${m.content}`).join("\n\n")}

The AI opponent just said: "${aiLastMessage}"

Give the user ONE specific tactical suggestion for their next argument.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const completion = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: HINT_SYSTEM_PROMPT },
            { role: "user", content: contextPrompt },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.6,
          max_tokens: 150,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content returned from Groq API");

      const parsed = JSON.parse(content);
      return NextResponse.json({
        hint: parsed.hint || "Unable to generate hint.",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hint generation failed";
    console.error("Error in /api/hint:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
