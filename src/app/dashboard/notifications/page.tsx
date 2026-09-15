"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CalendarDays, CheckCheck, CreditCard, Flag, Megaphone, MessageCircle, Phone } from "lucide-react";
import { api } from "@/lib/client";
import { Button, Card, EmptyState, PageLoader, cn } from "@/components/ui";
import { timeAgo } from "@/lib/constants";

interface NotificationRow {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, { icon: typeof Bell; tone: string }> = {
  message: { icon: MessageCircle, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" },
  booking: { icon: CalendarDays, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
  payment: { icon: CreditCard, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  report: { icon: Flag, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  call: { icon: Phone, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" },
  system: { icon: Megaphone, tone: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: NotificationRow[]; unreadCount: number }>("/api/notifications"),
    refetchInterval: 20_000,
  });

  const markAll = async () => {
    await api("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] }),
    ]);
  };

  const open = async (n: NotificationRow) => {
    if (!n.read) {
      api("/api/notifications", { method: "PATCH", body: JSON.stringify({ ids: [n.id] }) }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      });
    }
    if (n.link) router.push(n.link);
  };

  if (isLoading || !data) return <PageLoader label="Loading notifications" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Messages, bookings, payments and platform updates.</p>
        </div>
        {data.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="h-4 w-4" /> Mark all read ({data.unreadCount})
          </Button>
        )}
      </div>

      {data.notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-6 w-6" />}
          title="All quiet for now"
          body="When members message you, request sessions, or your payment is verified — you'll see it here."
        />
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {data.notifications.map((n) => {
            const meta = typeIcon[n.type] ?? typeIcon.system;
            return (
              <button key={n.id} onClick={() => open(n)} className={cn("flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.03]", !n.read && "bg-blue-50/50 dark:bg-blue-500/[0.06]")}>
                <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", meta.tone)}>
                  <meta.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read ? "font-extrabold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{n.body}</p>}
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />}
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
