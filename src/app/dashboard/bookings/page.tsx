"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Inbox, User as UserIcon, Video, X } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Badge, Button, Card, EmptyState, PageLoader, cn } from "@/components/ui";
import { useToast } from "@/components/providers";
import { formatDateTime } from "@/lib/constants";

interface BookingRow {
  id: number;
  topic: string;
  note?: string | null;
  scheduledAt: string;
  durationMin: number;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
  direction: "sent" | "received";
  other: { id: number; name: string; avatarUrl?: string | null } | null;
}

const statusTone: Record<string, "amber" | "green" | "rose" | "slate" | "blue"> = {
  pending: "amber",
  accepted: "green",
  declined: "rose",
  cancelled: "slate",
  completed: "blue",
};

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function BookingsPage() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { data: meData } = useMe();
  const me = meData?.user;

  const [tab, setTab] = useState<"upcoming" | "requests" | "past">("upcoming");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [busy, setBusy] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => api<{ bookings: BookingRow[] }>("/api/bookings"),
    refetchInterval: 20_000,
  });

  const bookings = useMemo(() => (data?.bookings ?? []).sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)), [data]);
  const now = Date.now();

  const upcoming = bookings.filter((b) => ["pending", "accepted"].includes(b.status) && +new Date(b.scheduledAt) >= now - 3600_000);
  const requests = bookings.filter((b) => b.status === "pending" && b.direction === "received");
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();

  const visible = tab === "upcoming" ? upcoming : tab === "requests" ? requests : past;

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const b of bookings) {
      const d = new Date(b.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return map;
  }, [bookings]);

  const cells = monthMatrix(cursor.year, cursor.month);
  const monthName = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const act = async (b: BookingRow, action: string, successMsg: string) => {
    setBusy(b.id);
    try {
      await api(`/api/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      push("success", successMsg);
    } catch (err) {
      push("error", "Could not update booking", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  if (!me) return <PageLoader label="Loading bookings" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Schedule, accept and track your conversation sessions.</p>
        </div>
        {requests.length > 0 && <Badge tone="amber" className="px-3 py-1 text-xs">{requests.length} request{requests.length === 1 ? "" : "s"} waiting</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* List */}
        <div className="space-y-4">
          <div className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
            {(
              [
                ["upcoming", `Upcoming (${upcoming.length})`],
                ["requests", `Requests (${requests.length})`],
                ["past", `History (${past.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-[13px] font-bold transition",
                  tab === key ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <PageLoader />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title={tab === "requests" ? "No pending requests" : tab === "past" ? "No past sessions" : "Nothing scheduled"}
              body="Open a member's profile and use “Book session” to plan your next conversation."
            />
          ) : (
            visible.map((b) => (
              <Card key={b.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar src={b.other?.avatarUrl} name={b.other?.name || "?"} size={52} />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[15px] font-extrabold text-slate-900 dark:text-white">{b.topic}</p>
                      <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                      <Badge tone="slate">{b.direction === "sent" ? "You requested" : "Requested you"}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{b.other?.name}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDateTime(b.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{b.durationMin} min</span>
                    </p>
                    {b.note && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">“{b.note}”</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {b.status === "pending" && b.direction === "received" && (
                      <>
                        <Button size="sm" variant="success" loading={busy === b.id} onClick={() => act(b, "accept", "Session accepted")}>
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => act(b, "decline", "Session declined")}>
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </>
                    )}
                    {b.status === "pending" && b.direction === "sent" && (
                      <Button size="sm" variant="ghost" loading={busy === b.id} onClick={() => act(b, "cancel", "Request cancelled")}>Cancel</Button>
                    )}
                    {b.status === "accepted" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => push("info", "Session time", "Head to the member's profile to start a voice or video call.")}>
                          <Video className="h-3.5 w-3.5" /> Join via profile
                        </Button>
                        {b.direction === "received" && (
                          <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => act(b, "complete", "Marked as completed")}>Complete</Button>
                        )}
                        <Button size="sm" variant="ghost" loading={busy === b.id} onClick={() => act(b, "cancel", "Session cancelled")}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Calendar */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">{monthName}</p>
            <div className="flex gap-1">
              <button onClick={() => setCursor((c) => { const d = new Date(c.year, c.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setCursor((c) => { const d = new Date(c.year, c.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{d}</span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={i} />;
              const key = `${cursor.year}-${cursor.month}-${day}`;
              const dayBookings = bookingsByDay.get(key) ?? [];
              const isToday = new Date().toDateString() === new Date(cursor.year, cursor.month, day).toDateString();
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300",
                    isToday && "ring-1 ring-blue-500",
                    dayBookings.length > 0 && "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
                  )}
                >
                  {day}
                  {dayBookings.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span key={b.id} className={cn("h-1 w-1 rounded-full", b.status === "accepted" ? "bg-emerald-500" : b.status === "pending" ? "bg-amber-400" : "bg-slate-300")} />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-400 dark:border-white/[0.06]">
            <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Accepted session</p>
            <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending request</p>
          </div>
          {requests.length > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Inbox className="h-4 w-4" /> {requests.length} request{requests.length === 1 ? "" : "s"} need your answer
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
