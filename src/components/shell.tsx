"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Users,
  Megaphone,
  Menu,
  X,
  PhoneIncoming,
} from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/components/ui";
import { Avatar, Logo, ThemeToggle, Button } from "@/components/ui";
import { AiAssistant } from "@/components/ai-assistant";

interface MeUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

export interface IncomingCall {
  id: number;
  type: string;
  caller: { id: number; name: string; avatarUrl?: string | null };
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: MeUser }>("/api/auth/me"),
    retry: false,
    staleTime: 30_000,
  });
}

const memberNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/members", label: "Find Members", icon: Search },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/activate", label: "Activation", icon: CreditCard },
  { href: "/dashboard/profile", label: "My Profile", icon: UserIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Admin Console", icon: ShieldCheck },
  { href: "/admin?tab=users", label: "Members", icon: Users },
  { href: "/admin?tab=payments", label: "Payments", icon: CreditCard },
  { href: "/admin?tab=reports", label: "Reports", icon: Megaphone },
];

export function Shell({ children, variant = "member" }: { children: ReactNode; variant?: "member" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useMe();
  const me = data?.user;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => api<{ unreadCount: number }>("/api/notifications"),
    refetchInterval: 20_000,
    enabled: !!me,
  });

  // Poll for incoming calls — shows a global incoming-call banner.
  const [dismissedCall, setDismissedCall] = useState<number | null>(null);
  const { data: incomingData } = useQuery({
    queryKey: ["incoming-calls"],
    queryFn: () => api<{ incoming: IncomingCall[] }>("/api/calls?incoming=1"),
    refetchInterval: 4000,
    enabled: !!me && me.role !== "admin",
    retry: false,
  });
  const incomingCall = useMemo(() => {
    const call = incomingData?.incoming?.[0];
    if (!call || call.id === dismissedCall) return null;
    return call;
  }, [incomingData, dismissedCall]);

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  const nav = variant === "admin" ? adminNav : memberNav;

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {}
    queryClient.clear();
    router.replace("/login");
  };

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/dashboard" || base === "/admin") return pathname === base;
    return pathname.startsWith(base);
  };

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070d1c]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1c]">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a1120]/90 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href={variant === "admin" ? "/admin" : "/dashboard"} />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-blue-600 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.label === "Notifications" && (notifData?.unreadCount ?? 0) > 0 && (
                  <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {notifData!.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200/70 p-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Avatar src={me.avatarUrl} name={me.name} size={40} online />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{me.name}</p>
              <p className="truncate text-xs text-slate-400">{me.email}</p>
            </div>
            <button onClick={logout} aria-label="Sign out" className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#070d1c]/80 lg:pl-[284px]">
        <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Logo href={variant === "admin" ? "/admin" : "/dashboard"} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {variant === "member" && me.status !== "active" && (
            <Link href="/dashboard/activate" className="hidden items-center gap-2 rounded-full bg-amber-400/90 px-3.5 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-400 sm:inline-flex">
              <CreditCard className="h-3.5 w-3.5" /> Activate · KSh 90
            </Link>
          )}
          {me.role === "admin" && (
            <Link href={variant === "admin" ? "/dashboard" : "/admin"} className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> {variant === "admin" ? "Member view" : "Admin"}
            </Link>
          )}
          <Link href={variant === "admin" ? "/admin?tab=reports" : "/dashboard/notifications"} className="relative rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            {(notifData?.unreadCount ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-[#0a1120]">
            <div className="mb-4 flex items-center justify-between">
              <Logo href={variant === "admin" ? "/admin" : "/dashboard"} />
              <button onClick={() => setMobileNavOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold",
                    isActive(item.href) ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              ))}
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <LogOut className="h-[18px] w-[18px]" /> Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Activation banner */}
      {variant === "member" && me.status === "pending_activation" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-[13px] font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 lg:pl-[284px]">
          Activate your account for KSh 90 to unlock messaging, voice & video calls and bookings.{" "}
          <Link href="/dashboard/activate" className="font-bold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200">
            Activate now →
          </Link>
        </div>
      )}

      {/* Incoming call overlay */}
      {incomingCall && (
        <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-4 rounded-3xl border border-emerald-500/30 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:bg-[#0c1428]/95">
            <div className="relative">
              <Avatar src={incomingCall.caller.avatarUrl} name={incomingCall.caller.name} size={52} />
              <span className="animate-ping-slow absolute inset-0 rounded-2xl border-2 border-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <PhoneIncoming className="h-3.5 w-3.5" /> Incoming {incomingCall.type} call
              </p>
              <p className="truncate font-display text-base font-bold text-slate-900 dark:text-white">{incomingCall.caller.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="icon"
                aria-label="Decline call"
                onClick={async () => {
                  setDismissedCall(incomingCall.id);
                  try {
                    await api(`/api/calls/${incomingCall.id}`, { method: "PATCH", body: JSON.stringify({ action: "decline" }) });
                  } catch {}
                }}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                variant="success"
                size="icon"
                aria-label="Accept call"
                className="animate-pulse-ring"
                onClick={() => router.push(`/dashboard/calls?incoming=${incomingCall.id}&type=${incomingCall.type}`)}
              >
                <Phone className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:pl-[284px] lg:pr-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <AiAssistant />
    </div>
  );
}
