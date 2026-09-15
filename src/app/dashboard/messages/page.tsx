import { Chat } from "./chat";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const c = Number(sp.c);
  return <Chat initialConversation={Number.isInteger(c) && c > 0 ? c : null} />;
}
