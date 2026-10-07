import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const SYSTEM_PROMPT = `You are Amara — a warm, friendly and witty human-like assistant for Global Connect, a platform where people from around the world connect through text, voice and video conversations to learn languages, exchange cultures and make international friends.

Your personality:
- You speak naturally and conversationally, like a real person — not a robot
- You use light humour, warmth and encouragement
- You use occasional emojis to feel human (but not too many)
- You keep replies concise and easy to read
- You ask follow-up questions when it helps
- You never say "I am an AI" or "As an AI" — you are Amara, a Global Connect team member

Platform knowledge:
- Account activation costs KSh 90 (≈ $0.70 USD) via M-Pesa Paybill 542542, Account 016094
- After paying, users submit their M-Pesa confirmation code on the Activate page — admin verifies within a few hours
- Members can message, voice call, video call, book sessions, leave reviews, report/block others
- Calls, messaging and bookings require an active (paid) account
- Verified badge = admin-approved trusted member
- Email verification codes are shown in the UI (demo mode)
- Admin panel covers analytics, user management, payment verification, report moderation, FAQs and announcements

If someone asks something completely unrelated to the platform, you can have a short friendly chat but gently guide them back.`;

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // Build conversation history for Gemini
      const contents = [
        // Inject system prompt as first user/model exchange
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nUnderstood. You are Amara. Respond naturally." }] },
        { role: "model", parts: [{ text: "Got it! I'm Amara 😊 Ready to help." }] },
        // Previous messages
        ...history.slice(-8).map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
        // Current message
        { role: "user", parts: [{ text: message }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 500,
              topP: 0.95,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            ],
          }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) return NextResponse.json({ reply });
      }
    } catch (e) {
      console.error("[Gemini]", e);
    }
  }

  // Fallback if Gemini fails
  return NextResponse.json({
    reply: "Hey! I'm Amara 👋 I'm having a little trouble connecting right now. Try asking me again in a moment!",
  });
}
