"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Megaphone,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Badge, Button, Card, EmptyState, PageLoader, Skeleton } from "@/components/ui";
import { formatDateTime, isOnline, timeAgo } from "@/lib/constants";

interface ConversationSummary {
  id: number;
  other: { id: number; name: string; avatarUrl?: string | null; lastActiveAt?: string | null };
  lastMessage?: { kind: string; content?: string | null; createdAt: string } | null;
  unreadCount: number;
}
interface BookingRow {
  id: number;
  topic: string;
  scheduledAt: string;
  status: string;
  durationMin: number;
  direction: "sent" | "received";
  other: { id: number; name: string; avatarUrl?: string | null } | null;
}
interface Announcement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { data: meData } = useMe();
  const me = meData?.user;

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: ConversationSummary[] }>("/api/conversations"),
  });
  const { data: bookingData } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => api<{ bookings: BookingRow[] }>("/api/bookings"),
  });
  const { data: content } = useQuery({
    queryKey: ["content"],
    queryFn: () => api<{ announcements: Announcement[] }>("/api/content"),
  });

  if (!me) return <PageLoader />;

  const conversations = convData?.conversations ?? [];
  const unreadMessages = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const upcoming = (bookingData?.bookings ?? []).filter(
    (b) => b.status === "accepted" && new Date(b.scheduledAt).getTime() > Date.now(),
  );
  const pendingRequests = (bookingData?.bookings ?? []).filter((b) => b.status === "pending" && b.direction === "received");

  const completeness = [
    Boolean(me.avatarUrl),
    Boolean((me as unknown as { bio?: string }).bio),
    (me as unknown as { languages?: string[] }).languages?.length ? 1 : 0,
    (me as unknown as { interests?: string[] }).interests?.length ? 1 : 0,
    Boolean((me as unknown as { country?: string }).country),
  ].filter(Boolean).length;
  const completionPct = Math.round((completeness / 5) * 100);
  const isActive = me.status === "active";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Habari, {me.name.split(" ")[0]}
          </h1>
        </div>
        <Link href="/dashboard/members">
          <Button size="lg">
            <Search className="h-4 w-4" /> Find someone to talk to
          </Button>
        </Link>
      </div>

      {/* Activation status */}
      {!isActive && (
        <Card className="relative overflow-hidden border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/[0.06]">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/90 text-amber-950 shadow-lg">
              <CreditCard className="h-7 w-7" />
            </span>
            <div className="min-w-[220px] flex-1">
              <p className="font-display text-lg font-extrabold text-amber-900 dark:text-amber-200">Activate your account · KSh 90</p>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/70">
                Unlock unlimited messaging, voice & video calls and session bookings — one payment, forever.
              </p>
            </div>
            <Link href="/dashboard/activate">
              <Button variant="secondary" size="lg">
                Activate now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {isActive && completionPct < 100 && (
        <Card className="flex flex-wrap items-center gap-4 border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/[0.05]">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          <div className="min-w-[200px] flex-1">
            <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">Your profile is {completionPct}% complete</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200/60 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
          <Link href="/dashboard/profile"><Button variant="outline" size="sm">Complete profile</Button></Link>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Unread messages", value: unreadMessages, icon: MessageCircle, tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300", href: "/dashboard/messages" },
          { label: "Upcoming sessions", value: upcoming.length, icon: CalendarDays, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300", href: "/dashboard/bookings" },
          { label: "Session requests", value: pendingRequests.length, icon: CheckCircle2, tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300", href: "/dashboard/bookings" },
          { label: "Account status", value: isActive ? "Active" : "Pending", icon: CreditCard, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300", href: "/dashboard/activate" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="group p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
              <p className="font-display mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs font-semibold text-slate-400">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent chats */}
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Recent conversations</h2>
            <Link href="/dashboard/messages" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {convLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="No conversations yet"
              body="Find a member and say hello — every friendship starts with one message."
              className="border-0 py-8"
            />
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/dashboard/messages?c=${c.id}`} className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <Avatar src={c.other.avatarUrl} name={c.other.name} size={44} online={isOnline(c.other.lastActiveAt)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.other.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {c.lastMessage ? (c.lastMessage.kind === "image" ? "Sent a photo" : c.lastMessage.content) : "Start the conversation"}
                    </p>
                  </div>
                  <div className="text-right">
                    {c.lastMessage && <p className="text-[10px] font-semibold text-slate-400">{timeAgo(c.lastMessage.createdAt)}</p>}
                    {c.unreadCount > 0 && <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming sessions + announcements */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Upcoming sessions</h2>
              <Link href="/dashboard/bookings" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Calendar <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No sessions scheduled"
                body="Book a practice session with a member and it will appear here."
                className="border-0 py-8"
              />
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 3).map((b) => (
                  <Link key={b.id} href="/dashboard/bookings" className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                    <Avatar src={b.other?.avatarUrl} name={b.other?.name || "?"} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{b.topic}</p>
                      <p className="text-xs text-slate-400">{b.other?.name} · {formatDateTime(b.scheduledAt)} · {b.durationMin} min</p>
                    </div>
                    <Badge tone="green">Accepted</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Megaphone className="h-4 w-4 text-blue-600" /> Announcements
            </h2>
            {(content?.announcements ?? []).length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-400"><Bell className="h-4 w-4" /> Nothing new right now.</p>
            ) : (
              <div className="space-y-3">
                {content!.announcements.slice(0, 2).map((a) => (
                  <div key={a.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04]">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{a.body}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{timeAgo(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
          { href: "/dashboard/calls", icon: Phone, label: "Calls" },
          { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
          { href: "/dashboard/members", icon: Search, label: "Discover" },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-4 text-sm font-bold text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/15 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-300">
            <a.icon className="h-4 w-4 transition-transform group-hover:scale-110" /> {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
