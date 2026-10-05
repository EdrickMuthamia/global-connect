import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { conversations, conversationParticipants, messages, notifications, users } from "@/db/schema";
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
  realUserName,
}: {
  conversationId: number;
  aiUserId: number;
  aiUserEmail: string;
  aiUserName: string;
  realUserId: number;
  realUserName: string;
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

  // Simulate typing delay (2–5 seconds)
  const delay = 2000 + Math.random() * 3000;
  await new Promise((r) => setTimeout(r, delay));

  let reply = "That is really interesting! Tell me more 😊";

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
          messages: [
            { role: "system", content: personaPrompt },
            ...chatHistory.slice(-8),
          ],
          max_tokens: 120,
          temperature: 0.85,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) reply = text;
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
      eq(conversationParticipants.conversationId, conversationId),
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
