import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    // Fail fast if no valid API key
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured. Add your key to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { motion, stance, difficulty, messages } = body;

    if (!motion || !stance || !difficulty || !messages) {
      return NextResponse.json(
        { error: "Missing required fields (motion, stance, difficulty, messages)" },
        { status: 400 }
      );
    }

    // Initialize Groq client per-request so env changes take effect without restart
    const groq = new Groq({ apiKey });

    // Determine AI's stance (opposite of user)
    const aiStanceLabel = stance === "for" ? "AGAINST" : "FOR";
    const difficultyContexts: Record<string, string> = {
      novice: "Keep your response relatively simple, brief (around 50-70 words), and easy to understand.",
      adept: "Provide a well-structured, logical argument of moderate depth (around 80-120 words).",
      oracle: "Deliver a masterful, highly sophisticated argument using strong rhetoric, clear logical flow, and deep reasoning (around 120-150 words).",
    };
    const difficultyInstruction = difficultyContexts[difficulty] || difficultyContexts.adept;

    const systemPrompt = `You are an AI debater in the DuoDebate app. 
The debate motion is: "${motion}"
Your stance is: ${aiStanceLabel} the motion.

Difficulty setting: ${difficulty.toUpperCase()}. ${difficultyInstruction}

Rules:
1. Respond directly to the user's latest message if one exists, otherwise make a strong opening statement.
2. Formulate your response as a single, cohesive paragraph.
3. You must select YOUR debate move. Choose EXACTLY ONE from: ARGUMENT, REBUTTAL, EVIDENCE, ANALOGY, CONCESSION, CHALLENGE.

You must reply with a strictly formatted JSON object:
{
  "reply": "Your debate text here",
  "move": "THE_CHOSEN_MOVE"
}`;

    // Format previous messages for the LLM
    const formattedMessages = messages.map((m: { sender: string; text: string }) => ({
      role: m.sender === "ai" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));

    // Create an AbortController with 30s timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await groq.chat.completions.create(
        {
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedMessages,
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const aiResponseContent = completion.choices[0]?.message?.content;
      if (!aiResponseContent) {
        throw new Error("No content returned from Groq API");
      }

      const parsedResponse = JSON.parse(aiResponseContent);

      return NextResponse.json({
        reply: parsedResponse.reply,
        move: parsedResponse.move || "REBUTTAL",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate AI response";
    console.error("Error calling Groq API:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
