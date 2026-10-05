import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const SYSTEM_PROMPT = `You are the Global Connect AI Assistant — a friendly, helpful guide built into the Global Connect platform.

Global Connect is a platform where people connect through text, voice and video conversations to learn languages, exchange cultures and make international friends.

Key facts:
- Account activation costs KSh 90 via M-Pesa Paybill 542542, Account No. 01609490286150
- After paying, users submit their M-Pesa confirmation code on the Activate page; admin verifies within a few hours
- Members can message, voice call, video call, book sessions, leave reviews, report/block others
- Calls and bookings require an active (paid) account
- Verified badge = admin-approved trusted member
- Email verification codes are shown in the UI (demo mode, no SMTP)
- Admin panel covers analytics, user management, payment verification, report moderation, FAQs/announcements

Keep answers short, friendly and helpful. If asked something unrelated to the platform, politely redirect.`;

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const messages = [
    ...history.slice(-6).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://globalconnect.app",
          "X-Title": "Global Connect",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return NextResponse.json({ reply });
      }
    } catch {}
  }

  // Keyword fallback (works with no API key)
  const lower = message.toLowerCase();
  let reply = "I'm here to help! Ask me about activation, payments, calls, bookings, or any platform feature.";

  if (lower.includes("activat") || lower.includes("mpesa") || lower.includes("ksh") || lower.includes("pay")) {
    reply = "To activate your account send KSh 90 via M-Pesa:\n• Paybill: **542542**\n• Account No: **01609490286150**\n• Amount: **KSh 90**\n\nThen go to the Activate page, paste your M-Pesa confirmation code and upload a screenshot. An admin verifies within a few hours.";
  } else if (lower.includes("call") || lower.includes("video") || lower.includes("voice")) {
    reply = "Voice and video calls are available to active members. Visit a member's profile and click Voice or Video call. You need an activated account (KSh 90) to use this feature.";
  } else if (lower.includes("message") || lower.includes("chat")) {
    reply = "Visit any member's profile and click Message to start chatting. Chat supports text, emojis and image sharing with real-time typing indicators.";
  } else if (lower.includes("book")) {
    reply = "Go to a member's profile and click 'Book session'. Pick a topic, date/time and duration. The member will accept or decline your request.";
  } else if (lower.includes("verif")) {
    reply = "The blue ✓ badge means the member has been verified by our admin team as a genuine, trusted user.";
  } else if (lower.includes("password") || lower.includes("reset")) {
    reply = "Go to the login page and click 'Forgot password'. Enter your email to receive a 6-digit reset code (displayed in the UI in demo mode).";
  } else if (lower.includes("report") || lower.includes("block")) {
    reply = "Visit a member's profile to report or block them. Reports are reviewed by our team within 24 hours. Blocked members cannot contact you.";
  } else if (lower.includes("review") || lower.includes("rating") || lower.includes("star")) {
    reply = "After a session, visit the member's profile to leave a star rating and written review. You can leave one review per member pair.";
  }

  return NextResponse.json({ reply });
}
