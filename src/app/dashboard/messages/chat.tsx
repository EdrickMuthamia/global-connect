"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Check, CheckCheck, ImagePlus, MessageCircle, Search, Send } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Button, EmojiButton, EmptyState, ImagePicker, Input, PageLoader, cn } from "@/components/ui";
import { useToast } from "@/components/providers";
import { isOnline, timeAgo } from "@/lib/constants";

interface ConversationSummary {
  id: number;
  other: { id: number; name: string; avatarUrl?: string | null; lastActiveAt?: string | null; isVerified?: boolean };
  lastMessage?: { kind: string; content?: string | null; createdAt: string; senderId: number } | null;
  unreadCount: number;
}

interface MessageRow {
  id: number;
  senderId: number;
  kind: "text" | "image";
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export function Chat({ initialConversation }: { initialConversation: number | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { data: meData } = useMe();
  const me = meData?.user;

  const [activeId, setActiveId] = useState<number | null>(initialConversation);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: convData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: ConversationSummary[] }>("/api/conversations"),
    refetchInterval: 5000,
  });
  const conversations = useMemo(() => convData?.conversations ?? [], [convData]);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  const { data: thread } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => api<{ messages: MessageRow[]; otherLastReadAt: string | null }>(`/api/conversations/${activeId}/messages`),
    refetchInterval: 3000,
    enabled: activeId !== null,
  });

  const { data: typingData } = useQuery({
    queryKey: ["typing", activeId],
    queryFn: () => api<{ typing: string[] }>(`/api/conversations/${activeId}/typing`),
    refetchInterval: 2500,
    enabled: activeId !== null,
    retry: false,
  });

  const messages = useMemo(() => thread?.messages ?? [], [thread]);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, typingData?.typing?.length]);

  useEffect(() => {
    if (activeId) queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [activeId, queryClient]);

  const filtered = conversations.filter((c) => c.other.name.toLowerCase().includes(search.toLowerCase()));

  const openConversation = (id: number) => {
    setActiveId(id);
    router.replace(`/dashboard/messages?c=${id}`, { scroll: false });
  };

  const sendTyping = () => {
    if (!activeId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    api(`/api/conversations/${activeId}/typing`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
  };

  const send = async (imageUrl?: string) => {
    if (!activeId) return;
    const content = draft.trim();
    if (!content && !imageUrl) return;
    setSending(true);
    try {
      await api(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, imageUrl }),
      });
      setDraft("");
      inputRef.current?.focus();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", activeId] }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "NEEDS_ACTIVATION") {
        push("info", "Activation required", "Messaging unlocks once your account is active.");
        router.push("/dashboard/activate");
      } else {
        push("error", "Message not sent", err instanceof ApiClientError ? err.message : "Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  if (!me) return <PageLoader label="Loading messages" />;

  const otherLastReadAt = thread?.otherLastReadAt ? new Date(thread.otherLastReadAt).getTime() : 0;
  const lastMineId = [...messages].reverse().find((m) => m.senderId === me.id)?.id;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_40px_-16px_rgba(15,23,42,0.12)] dark:border-white/[0.08] dark:bg-white/[0.03] lg:h-[calc(100vh-170px)]">
      <div className="flex h-full flex-col lg:flex-row">
        {/* Conversation list */}
        <div className={cn("w-full flex-col border-b border-slate-100 dark:border-white/[0.06] lg:flex lg:w-[340px] lg:border-b-0 lg:border-r", activeId ? "hidden lg:flex" : "flex")}>
          <div className="border-b border-slate-100 p-4 dark:border-white/[0.06]">
            <h1 className="font-display mb-3 text-lg font-extrabold text-slate-900 dark:text-white">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" className="h-9 pl-9 text-[13px]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon={<MessageCircle className="h-6 w-6" />}
                  title="No conversations"
                  body="Find a member you like and start chatting."
                  action={<Link href="/dashboard/members"><Button size="sm">Browse members</Button></Link>}
                  className="border-0 py-6"
                />
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition",
                  activeId === c.id ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.04]",
                )}
              >
                <Avatar src={c.other.avatarUrl} name={c.other.name} size={46} online={isOnline(c.other.lastActiveAt)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                      {c.other.name}
                      {c.other.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
                    </p>
                    {c.lastMessage && <span className="shrink-0 text-[10px] font-semibold text-slate-400">{timeAgo(c.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-xs", c.unreadCount > 0 ? "font-semibold text-slate-700 dark:text-slate-200" : "text-slate-400")}>
                      {c.lastMessage
                        ? `${c.lastMessage.senderId === me.id ? "You: " : ""}${c.lastMessage.kind === "image" ? "Sent a photo" : c.lastMessage.content}`
                        : "Say hello…"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{c.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("min-h-[70vh] flex-1 flex-col lg:flex lg:min-h-0", activeId ? "flex" : "hidden lg:flex")}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={<MessageCircle className="h-7 w-7" />}
                title="Pick a conversation"
                body="Select a chat on the left, or discover someone new to practice with."
                action={<Link href="/dashboard/members"><Button>Find members</Button></Link>}
                className="border-0"
              />
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
                <button onClick={() => setActiveId(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" aria-label="Back">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar src={active.other.avatarUrl} name={active.other.name} size={40} online={isOnline(active.other.lastActiveAt)} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
                    {active.other.name}
                    {active.other.isVerified && <BadgeCheck className="h-4 w-4 text-blue-600" />}
                  </p>
                  <p className={cn("text-[11px] font-semibold", isOnline(active.other.lastActiveAt) ? "text-emerald-500" : "text-slate-400")}>
                    {typingData?.typing?.length ? "typing…" : isOnline(active.other.lastActiveAt) ? "Online now" : `Active ${timeAgo(active.other.lastActiveAt)}`}
                  </p>
                </div>
                <Link href={`/dashboard/members/${active.other.id}`}>
                  <Button variant="ghost" size="sm">View profile</Button>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-1.5 overflow-y-auto bg-slate-50/60 px-4 py-4 dark:bg-transparent">
                {messages.map((m, i) => {
                  const mine = m.senderId === me.id;
                  const prev = messages[i - 1];
                  const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);
                  const isLastMine = mine && m.id === lastMineId;
                  const seen = isLastMine && otherLastReadAt >= new Date(m.createdAt).getTime();
                  return (
                    <div key={m.id}>
                      <div className={cn("flex items-end gap-2", mine && "justify-end")}>
                        {showAvatar ? <Avatar src={active.other.avatarUrl} name={active.other.name} size={26} /> : !mine && <span className="w-[26px]" />}
                        <div
                          className={cn(
                            "max-w-[78%] px-3.5 py-2.5 text-[14px] leading-relaxed sm:max-w-[65%]",
                            mine
                              ? "bubble-out bg-blue-600 text-white shadow-[0_6px_20px_-8px_rgba(37,99,235,0.6)]"
                              : "bubble-in border border-slate-200/70 bg-white text-slate-800 dark:border-white/[0.07] dark:bg-white/[0.07] dark:text-slate-100",
                          )}
                        >
                          {m.kind === "image" && m.imageUrl && (
                            <img src={m.imageUrl} alt="Shared" className="mb-1 max-h-64 rounded-xl" />
                          )}
                          {m.content && <span className="whitespace-pre-wrap break-words">{m.content}</span>}
                          <span className={cn("mt-0.5 block text-right text-[9px] font-semibold opacity-70")}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      {isLastMine && (
                        <p className="mt-1 flex items-center justify-end gap-1 pr-1 text-[10px] font-semibold text-slate-400">
                          {seen ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5" />}
                          {seen ? "Seen" : "Sent"}
                        </p>
                      )}
                    </div>
                  );
                })}
                {typingData?.typing && typingData.typing.length > 0 && (
                  <div className="flex items-end gap-2">
                    <Avatar src={active.other.avatarUrl} name={active.other.name} size={26} />
                    <div className="bubble-in flex items-center gap-1.5 border border-slate-200/70 bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.07]">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-slate-100 p-3 dark:border-white/[0.06]">
                <div className="flex items-end gap-1.5">
                  <EmojiButton onPick={(e) => setDraft((d) => d + e)} />
                  <ImagePicker onData={(d) => send(d)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/10">
                    <ImagePlus className="h-5 w-5" />
                  </ImagePicker>
                  <textarea
                    ref={inputRef}
                    value={draft}
                    rows={1}
                    placeholder={`Message ${active.other.name.split(" ")[0]}…`}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      sendTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                  />
                  <Button size="icon" onClick={() => send()} loading={sending} disabled={!draft.trim()} className="h-10 w-10 shrink-0 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
