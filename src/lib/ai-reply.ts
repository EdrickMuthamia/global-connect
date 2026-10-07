import { eq, asc, and } from "drizzle-orm";
import { db } from "@/db";
import { conversations, conversationParticipants, messages, notifications } from "@/db/schema";
import { getPersonaPrompt } from "@/lib/ai-personas";

/**
 * Fire-and-forget: after a real user sends a message to an AI persona member,
 * this generates a reply and inserts it into the DB after a short delay.
 */
export async function triggerAiReply({
  conversationId,
  aiUserId,
  aiUserEmail,
  aiUserName,
  realUserId,
}: {
  conversationId: number;
  aiUserId: number;
  aiUserEmail: string;
  aiUserName: string;
  realUserId: number;
}) {
  const personaPrompt = getPersonaPrompt(aiUserEmail);
  if (!personaPrompt) return;

  // Fetch last 10 messages for context
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(10);

  const chatHistory = history.map((m) => ({
    role: m.senderId === aiUserId ? "assistant" : "user",
    content: m.content ?? "",
  }));

  // Short delay to simulate typing (safe for serverless — max 1.5s)
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));

  let reply = "That is really interesting! Tell me more 😊";

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const contents = [
        { role: "user", parts: [{ text: personaPrompt + "\n\nUnderstood. Stay in character." }] },
        { role: "model", parts: [{ text: "Got it! I'm ready." }] },
        ...chatHistory.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents, generationConfig: { temperature: 0.85, maxOutputTokens: 200 } }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 3) reply = text;
      }
    } catch {}
  } else {
    // Fallback keyword replies per persona feel
    const lastMsg = chatHistory[chatHistory.length - 1]?.content?.toLowerCase() ?? "";
    if (lastMsg.includes("hello") || lastMsg.includes("hi") || lastMsg.includes("habari")) {
      reply = `Hello! Great to hear from you 😊 How can I help you today?`;
    } else if (lastMsg.includes("swahili")) {
      reply = `Swahili is such a beautiful language! "Karibu" means welcome — a great word to start with 🌍`;
    } else if (lastMsg.includes("call") || lastMsg.includes("video")) {
      reply = `A call sounds great! Feel free to book a session on my profile and we can connect properly 📞`;
    } else if (lastMsg.includes("book") || lastMsg.includes("session")) {
      reply = `I would love that! Go ahead and book a session on my profile — I will accept it right away 😊`;
    } else if (lastMsg.includes("thank") || lastMsg.includes("asante")) {
      reply = `You are so welcome! It is always a pleasure chatting with you 🙏`;
    } else if (lastMsg.includes("?")) {
      reply = `That is a great question! I would love to discuss this more — shall we book a session?`;
    }
  }

  // Insert the AI reply
  const [msg] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId: aiUserId,
      kind: "text",
      content: reply,
    })
    .returning();

  // Update conversation lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: msg.createdAt })
    .where(eq(conversations.id, conversationId));

  // Mark AI member as having read up to now
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, aiUserId),
      ),
    );

  // Notify the real user
  await db.insert(notifications).values({
    userId: realUserId,
    type: "message",
    title: `New message from ${aiUserName}`,
    body: reply.slice(0, 120),
    link: `/dashboard/messages?c=${conversationId}`,
  });
}
