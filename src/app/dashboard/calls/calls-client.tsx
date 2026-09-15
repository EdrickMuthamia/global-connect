"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search, Video } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { CallInterface } from "@/components/call-interface";
import { Avatar, Badge, Button, Card, EmptyState, PageLoader } from "@/components/ui";
import { useToast } from "@/components/providers";
import { timeAgo } from "@/lib/constants";

interface CallRow {
  id: number;
  type: "voice" | "video";
  status: string;
  direction: "outgoing" | "incoming";
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  other: { id: number; name: string; avatarUrl?: string | null } | null;
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const secs = Math.max(0, Math.round((+new Date(end) - +new Date(start)) / 1000));
  if (secs < 1) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function CallsClient({ activeCallId }: { activeCallId: number | null }) {
  const router = useRouter();
  const { push } = useToast();
  const { data: meData } = useMe();
  const me = meData?.user;
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api<{ calls: CallRow[] }>("/api/calls"),
    enabled: !activeCallId,
    refetchInterval: 15_000,
  });

  if (activeCallId) {
    return (
      <div className="mx-auto max-w-3xl">
        <CallInterface callId={activeCallId} />
      </div>
    );
  }

  const calls = data?.calls ?? [];

  const callBack = async (row: CallRow, type: "voice" | "video") => {
    if (!row.other) return;
    if (me?.status !== "active") {
      push("info", "Activation required", "Activate your account to make calls.");
      router.push("/dashboard/activate");
      return;
    }
    setBusyId(row.id);
    try {
      const res = await api<{ call: { id: number } }>("/api/calls", {
        method: "POST",
        body: JSON.stringify({ calleeId: row.other.id, type }),
      });
      router.push(`/dashboard/calls?outgoing=${res.call.id}`);
    } catch (err) {
      push("error", "Could not start call", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Calls</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browser voice & video calls — nothing to install.</p>
        </div>
        <Link href="/dashboard/members"><Button><Search className="h-4 w-4" /> Call someone new</Button></Link>
      </div>

      {isLoading ? (
        <PageLoader label="Loading calls" />
      ) : calls.length === 0 ? (
        <EmptyState
          icon={<Phone className="h-6 w-6" />}
          title="No calls yet"
          body="Your voice and video call history will appear here. Start by calling a member from their profile."
        />
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {calls.map((c) => {
            const missed = c.status === "missed" || c.status === "declined";
            const duration = formatDuration(c.startedAt, c.endedAt);
            const Icon = missed ? PhoneMissed : c.direction === "outgoing" ? PhoneOutgoing : PhoneIncoming;
            return (
              <div key={c.id} className="flex items-center gap-4 p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${missed ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <Avatar src={c.other?.avatarUrl} name={c.other?.name || "?"} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.other?.name ?? "Unknown member"}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="capitalize">{c.type}</span>
                    <span>·</span>
                    <span className="capitalize">{c.status}{duration ? ` · ${duration}` : ""}</span>
                  </p>
                </div>
                <span className="hidden text-xs font-semibold text-slate-400 sm:block">{timeAgo(c.createdAt)}</span>
                {c.other && (
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" loading={busyId === c.id} onClick={() => callBack(c, "voice")} aria-label="Voice call" className="h-9 w-9">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => callBack(c, "video")} aria-label="Video call" className="h-9 w-9">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Badge tone={missed ? "rose" : "green"} className="hidden md:inline-flex">{c.status}</Badge>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
