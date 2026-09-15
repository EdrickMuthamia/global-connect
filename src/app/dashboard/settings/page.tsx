"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, KeyRound, MailCheck, Moon, Monitor, ShieldCheck, Sun } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Badge, Button, Card, Field, Input, PageLoader, Skeleton, cn } from "@/components/ui";
import { useToast } from "@/components/providers";
import { timeAgo } from "@/lib/constants";

interface BlockedRow {
  blockId: number;
  createdAt: string;
  user: { id: number; name: string; avatarUrl?: string | null; country?: string | null };
}

export default function SettingsPage() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { data: meData } = useMe();
  const me = meData?.user;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [theme, setTheme] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("gc-theme") || "system" : "system"));

  const { data: blockedData, isLoading: blockedLoading } = useQuery({
    queryKey: ["blocks"],
    queryFn: () => api<{ blocked: BlockedRow[] }>("/api/blocks"),
  });

  const applyTheme = (t: string) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("gc-theme");
        document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        localStorage.setItem("gc-theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      }
    } catch {}
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      push("error", "Passwords don't match", "Please re-type your new password.");
      return;
    }
    setSavingPw(true);
    try {
      await api("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      push("success", "Password updated", "Your account is secured with the new password.");
    } catch (err) {
      push("error", "Could not update password", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setSavingPw(false);
    }
  };

  const unblock = async (userId: number) => {
    try {
      await api("/api/blocks", { method: "DELETE", body: JSON.stringify({ userId }) });
      await queryClient.invalidateQueries({ queryKey: ["blocks"] });
      push("success", "Member unblocked");
    } catch {
      push("error", "Could not unblock");
    }
  };

  const resendVerification = async () => {
    try {
      const res = await api<{ devCode?: string }>("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ email: me?.email, resend: true }) });
      push("info", "Verification code sent", res.devCode ? `Demo delivery — your code is ${res.devCode}` : "Check your inbox.");
    } catch {
      push("error", "Could not resend", "Please try again in a minute.");
    }
  };

  if (!me) return <PageLoader label="Loading settings" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Security, appearance and privacy controls.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security */}
        <Card className="p-6">
          <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
            <KeyRound className="h-5 w-5 text-blue-600" /> Password & security
          </h2>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <Field label="Current password">
              <Input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters with letters and numbers.">
              <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={savingPw}>Update password</Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04]">
            <ShieldCheck className={cn("h-5 w-5", (me as unknown as { emailVerified?: boolean }).emailVerified ? "text-emerald-500" : "text-amber-500")} />
            <div className="flex-1 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-200">
                {(me as unknown as { emailVerified?: boolean }).emailVerified ? "Email verified" : "Email not verified yet"}
              </p>
              <p className="text-slate-400">{me.email}</p>
            </div>
            {!(me as unknown as { emailVerified?: boolean }).emailVerified && (
              <Button size="sm" variant="outline" onClick={resendVerification}>
                <MailCheck className="h-3.5 w-3.5" /> Verify now
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Appearance */}
          <Card className="p-6">
            <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Monitor className="h-5 w-5 text-blue-600" /> Appearance
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Monitor },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition",
                    theme === t.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:text-slate-400",
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-xs font-extrabold">{t.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Blocked */}
          <Card className="p-6">
            <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Ban className="h-5 w-5 text-rose-500" /> Blocked members
            </h2>
            <div className="mt-4 space-y-2">
              {blockedLoading ? (
                [1, 2].map((i) => <Skeleton key={i} className="h-14" />)
              ) : (blockedData?.blocked ?? []).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-400 dark:bg-white/[0.04]">
                  You haven&apos;t blocked anyone. Blocked members can&apos;t message or call you, and disappear from your search.
                </p>
              ) : (
                blockedData!.blocked.map((b) => (
                  <div key={b.blockId} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/[0.06]">
                    <Avatar src={b.user.avatarUrl} name={b.user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{b.user.name}</p>
                      <p className="text-[11px] text-slate-400">Blocked {timeAgo(b.createdAt)}</p>
                    </div>
                    <Badge tone="rose">Blocked</Badge>
                    <Button size="sm" variant="outline" onClick={() => unblock(b.user.id)}>Unblock</Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
