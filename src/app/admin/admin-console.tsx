"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Flag,
  LayoutDashboard,
  Megaphone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api, ApiClientError, downloadCsv } from "@/lib/client";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select, Skeleton, Stars, Textarea, cn } from "@/components/ui";
import { useToast } from "@/components/providers";
import { formatKes, timeAgo } from "@/lib/constants";

/* --------------------------------- Types ----------------------------------- */

interface AdminUser {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  country?: string | null;
  role?: string;
  status?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  createdAt: string;
  lastActiveAt?: string | null;
}

interface PaymentRow {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  method: string;
  note?: string | null;
  status: string;
  hasProof: boolean;
  createdAt: string;
  user: AdminUser;
}

interface ReportRow {
  id: number;
  reason: string;
  details?: string | null;
  status: string;
  resolutionNote?: string | null;
  createdAt: string;
  reporter: AdminUser | null;
  reportedUser: AdminUser | null;
}

interface StatsData {
  stats: Record<string, number>;
  growth: { label: string; count: number }[];
  recentUsers: AdminUser[];
}

interface ContentData {
  faqs: { id: number; question: string; answer: string; sortOrder: number; published: boolean }[];
  announcements: { id: number; title: string; body: string; published: boolean; createdAt: string }[];
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Members", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "content", label: "Content", icon: Megaphone },
];

const statusTone = (s?: string): "green" | "amber" | "rose" | "slate" =>
  s === "active" ? "green" : s === "pending_activation" ? "amber" : s === "suspended" ? "rose" : s === "banned" ? "rose" : "slate";

/* ------------------------------- Overview tab ------------------------------ */

function OverviewTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => api<StatsData>("/api/admin/stats") });
  if (isLoading || !data) return <PageLoader label="Loading analytics" />;
  const s = data.stats;
  const maxGrowth = Math.max(1, ...data.growth.map((g) => g.count));

  const cards = [
    { label: "Total members", value: s.total_users, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", icon: Users },
    { label: "Active accounts", value: s.active_users, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300", icon: CheckCircle2 },
    { label: "Pending activation", value: s.pending_users, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", icon: CreditCard },
    { label: "Verified badges", value: s.verified_users, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300", icon: BadgeCheck },
    { label: "Payments pending", value: s.pending_payments, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", icon: CreditCard },
    { label: "Revenue (approved)", value: formatKes(s.revenue_kes), tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300", icon: BarChart3 },
    { label: "Open reports", value: s.open_reports, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300", icon: Flag },
    { label: "Bookings made", value: s.total_bookings, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", icon: CheckCircle2 },
    { label: "Messages sent", value: s.total_messages, tone: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300", icon: BarChart3 },
    { label: "Calls placed", value: s.total_calls, tone: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300", icon: BarChart3 },
    { label: "Reviews written", value: s.total_reviews, tone: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300", icon: Star },
    { label: "Avg. rating", value: Number(s.avg_rating || 0).toFixed(1), tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", icon: Star },
    { label: "Page views (today)", value: s.page_views_today, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", icon: BarChart3 },
    { label: "Page views (7 days)", value: s.page_views_week, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", icon: BarChart3 },
    { label: "Total page views", value: s.total_page_views, tone: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", c.tone)}><c.icon className="h-4 w-4" /></span>
            <p className="font-display mt-2.5 text-xl font-extrabold text-slate-900 dark:text-white">{c.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">New members — last 14 days</h3>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {data.growth.map((g, i) => (
              <div key={i} className="group relative flex-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600/70 to-emerald-500/80 transition-all group-hover:from-blue-600 group-hover:to-emerald-400"
                  style={{ height: `${Math.max(4, (g.count / maxGrowth) * 160)}px` }}
                />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                  {g.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>{data.growth[0]?.label}</span>
            <span>{data.growth[data.growth.length - 1]?.label}</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">Latest signups</h3>
          <div className="mt-4 space-y-2.5">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar src={u.avatarUrl} name={u.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{u.email}</p>
                </div>
                <Badge tone={statusTone(u.status)}>{u.status === "pending_activation" ? "pending" : u.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------- Users tab -------------------------------- */

function UsersTab() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-users", q, status],
    queryFn: () => api<{ users: AdminUser[] }>(`/api/admin/users?${params}`),
    placeholderData: (p) => p,
  });
  const users = data?.users ?? [];

  const act = async (u: AdminUser, action: string) => {
    if ((action === "ban" || action === "suspend") && !window.confirm(`${action === "ban" ? "Ban" : "Suspend"} ${u.name}? They will immediately lose access.`)) return;
    setBusy(u.id);
    try {
      await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId: u.id, action }) });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      push("success", "Member updated", `${u.name}: ${action}`);
    } catch (err) {
      push("error", "Action failed", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    // Fetch all payments to join with members
    const payData = await api<{ payments: PaymentRow[] }>("/api/admin/payments");
    const payMap = new Map(payData.payments.map((p) => [p.user.id, p]));
    downloadCsv(
      `global-connect-members-${new Date().toISOString().slice(0, 10)}.csv`,
      users.map((u) => {
        const p = payMap.get(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email ?? "",
          country: u.country ?? "",
          account_status: u.status ?? "",
          verified: u.isVerified ? "Yes" : "No",
          payment_status: p?.status ?? "none",
          payment_reference: p?.reference ?? "",
          amount_kes: p ? (p.amount / 100).toFixed(2) : "",
          payment_method: p?.method ?? "",
          payment_date: p?.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "",
          joined: new Date(u.createdAt).toISOString().slice(0, 10),
        };
      }),
    );
    push("success", "Export ready", "Member payment report downloaded.");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or country…" className="h-10 pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-44">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending_activation">Pending activation</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </Select>
        <Button variant="outline" size="sm" onClick={() => exportCsv().catch(() => push("error", "Export failed"))} className="h-10">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        {isFetching && <span className="text-xs font-semibold text-slate-400">Refreshing…</span>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title="No members found" body="Try adjusting your search or filters." className="border-0" />
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-white/[0.06]">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Verified</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
              {users.map((u) => (
                <tr key={u.id} className="align-middle">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatarUrl} name={u.name} size={38} />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}{u.role === "admin" && <Badge tone="violet" className="ml-2">admin</Badge>}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500">{u.country || "—"}</td>
                  <td className="py-3 pr-4"><Badge tone={statusTone(u.status)}>{u.status?.replace("_", " ")}</Badge></td>
                  <td className="py-3 pr-4">
                    <button onClick={() => act(u, u.isVerified ? "unverify" : "verify")} disabled={busy === u.id} className={cn("flex items-center gap-1 text-xs font-bold", u.isVerified ? "text-blue-600" : "text-slate-400 hover:text-blue-600")}>
                      <BadgeCheck className="h-4 w-4" /> {u.isVerified ? "Verified" : "Verify"}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-400">{timeAgo(u.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1.5">
                      {u.role !== "admin" && (
                        <>
                          {u.status !== "active" && (
                            <Button size="sm" variant="outline" loading={busy === u.id} onClick={() => act(u, u.status === "suspended" || u.status === "banned" ? "restore" : "activate")}>
                              {u.status === "suspended" || u.status === "banned" ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                              {u.status === "suspended" || u.status === "banned" ? "Restore" : "Activate"}
                            </Button>
                          )}
                          {u.status === "active" && (
                            <Button size="sm" variant="outline" loading={busy === u.id} onClick={() => act(u, "suspend")}>Suspend</Button>
                          )}
                          {u.status !== "banned" && (
                            <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600" loading={busy === u.id} onClick={() => act(u, "ban")}>
                              <Ban className="h-3.5 w-3.5" /> Ban
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------- Payments tab ------------------------------ */

function PaymentsTab() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState<number | null>(null);
  const [proof, setProof] = useState<{ id: number; url: string; reference: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", status],
    queryFn: () => api<{ payments: PaymentRow[] }>(`/api/admin/payments?status=${status}`),
  });
  const payments = data?.payments ?? [];

  const review = async (p: PaymentRow, action: "approve" | "reject") => {
    const note = action === "reject" ? window.prompt("Reason for rejection (shown to the member):", "Reference could not be verified.") ?? "" : "";
    if (action === "approve" && !window.confirm(`Approve ${formatKes(p.amount)} from ${p.user.name} and activate their account?`)) return;
    setBusy(p.id);
    try {
      await api("/api/admin/payments", { method: "PATCH", body: JSON.stringify({ id: p.id, action, note }) });
      await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      push("success", action === "approve" ? "Account activated" : "Payment rejected", `${p.user.name} has been notified.`);
    } catch (err) {
      push("error", "Action failed", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  const openProof = async (p: PaymentRow) => {
    try {
      const res = await api<{ payment: { proofUrl?: string | null } }>(`/api/admin/payments?id=${p.id}`);
      if (res.payment.proofUrl) setProof({ id: p.id, url: res.payment.proofUrl, reference: p.reference });
      else push("info", "No screenshot attached");
    } catch {
      push("error", "Could not load proof");
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-4 py-2 text-xs font-extrabold capitalize transition", status === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300")}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">{payments.length} records</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            downloadCsv(
              `global-connect-payments-${status}-${new Date().toISOString().slice(0, 10)}.csv`,
              payments.map((p) => ({
                payment_id: p.id,
                member_name: p.user.name,
                email: p.user.email ?? "",
                country: p.user.country ?? "",
                account_status: p.user.status ?? "",
                verified: p.user.isVerified ? "Yes" : "No",
                mpesa_reference: p.reference,
                amount_kes: (p.amount / 100).toFixed(2),
                currency: p.currency,
                payment_method: p.method,
                payment_status: p.status,
                note: p.note ?? "",
                submitted_date: new Date(p.createdAt).toISOString().slice(0, 10),
              })),
            );
          }}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard className="h-6 w-6" />} title={`No ${status} payments`} body="Payment submissions from members will appear here for verification." className="border-0" />
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 p-4 dark:border-white/[0.06]">
              <Avatar src={p.user.avatarUrl} name={p.user.name} size={44} />
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{p.user.name} <span className="font-normal text-slate-400">· {p.user.email}</span></p>
                <p className="mt-0.5 font-mono text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400">{p.reference}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{formatKes(p.amount)} · {p.method.replace(/_/g, " ")} · {timeAgo(p.createdAt)}</p>
                {p.note && <p className="mt-1 text-[11px] italic text-slate-400">“{p.note}”</p>}
              </div>
              <Badge tone={p.status === "approved" ? "green" : p.status === "rejected" ? "rose" : "amber"}>{p.status}</Badge>
              <div className="flex gap-2">
                {p.hasProof && (
                  <Button size="sm" variant="ghost" onClick={() => openProof(p)}>
                    <Eye className="h-3.5 w-3.5" /> Proof
                  </Button>
                )}
                {p.status === "pending" && (
                  <>
                    <Button size="sm" variant="success" loading={busy === p.id} onClick={() => review(p, "approve")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-500" loading={busy === p.id} onClick={() => review(p, "reject")}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={!!proof} onClose={() => setProof(null)} title={`Payment proof · ${proof?.reference ?? ""}`} wide>
        {proof && <img src={proof.url} alt="Payment proof" className="w-full rounded-2xl" />}
      </Modal>
    </Card>
  );
}

/* -------------------------------- Reports tab ------------------------------ */

function ReportsTab() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("open");
  const [busy, setBusy] = useState<number | null>(null);
  const [actionModal, setActionModal] = useState<{ report: ReportRow; action: "resolve" | "dismiss" } | null>(null);
  const [note, setNote] = useState("");
  const [suspend, setSuspend] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => api<{ reports: ReportRow[] }>(`/api/admin/reports?status=${status}`),
  });
  const reports = data?.reports ?? [];

  const submit = async () => {
    if (!actionModal) return;
    setBusy(actionModal.report.id);
    try {
      await api("/api/admin/reports", {
        method: "PATCH",
        body: JSON.stringify({ id: actionModal.report.id, action: actionModal.action, note, suspendUser: suspend }),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      push("success", `Report ${actionModal.action === "resolve" ? "resolved" : "dismissed"}`);
      setActionModal(null);
      setNote("");
      setSuspend(false);
    } catch (err) {
      push("error", "Action failed", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        {["open", "resolved", "dismissed"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-4 py-2 text-xs font-extrabold capitalize transition", status === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300")}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">{reports.length} reports</span>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-24" />)
        ) : reports.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title={`No ${status} reports`} body="Member reports about abuse or spam will appear here." className="border-0" />
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar src={r.reporter?.avatarUrl} name={r.reporter?.name || "?"} size={36} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.reporter?.name}</span>
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">reported</span>
                <div className="flex items-center gap-2">
                  <Avatar src={r.reportedUser?.avatarUrl} name={r.reportedUser?.name || "?"} size={36} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.reportedUser?.name}</span>
                </div>
                <span className="ml-auto text-[11px] font-semibold text-slate-400">{timeAgo(r.createdAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-start gap-3">
                <div className="min-w-[200px] flex-1">
                  <Badge tone="rose">{r.reason}</Badge>
                  {r.details && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">{r.details}</p>}
                  {r.resolutionNote && <p className="mt-2 text-[11px] text-slate-400">Resolution: {r.resolutionNote}</p>}
                  {r.reportedUser?.status === "suspended" && <Badge tone="rose" className="mt-2">reported user suspended</Badge>}
                </div>
                {r.status === "open" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => { setActionModal({ report: r, action: "resolve" }); setNote(""); setSuspend(false); }}>
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setActionModal({ report: r, action: "dismiss" }); setNote(""); setSuspend(false); }}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal?.action === "resolve" ? "Resolve report" : "Dismiss report"}>
        <div className="space-y-4">
          <Field label="Resolution note (shared with the reporter)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What action was taken?" />
          </Field>
          {actionModal?.action === "resolve" && (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
              <input type="checkbox" checked={suspend} onChange={(e) => setSuspend(e.target.checked)} className="h-4 w-4 rounded accent-rose-600" />
              Also suspend {actionModal.report.reportedUser?.name}&apos;s account
            </label>
          )}
          <Button variant={actionModal?.action === "resolve" ? "success" : "secondary"} className="w-full" loading={busy !== null} onClick={submit}>
            Confirm
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

/* -------------------------------- Content tab ------------------------------ */

function ContentTab() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => api<ContentData>("/api/admin/content"),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-content"] });

  const createFaq = async () => {
    setBusy(true);
    try {
      await api("/api/admin/content", { method: "POST", body: JSON.stringify({ kind: "faq", question: q, answer: a }) });
      setQ("");
      setA("");
      await refresh();
      push("success", "FAQ published");
    } catch (err) {
      push("error", "Could not create FAQ", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const createAnnouncement = async () => {
    setBusy(true);
    try {
      await api("/api/admin/content", { method: "POST", body: JSON.stringify({ kind: "announcement", title, body }) });
      setTitle("");
      setBody("");
      await refresh();
      push("success", "Announcement published");
    } catch (err) {
      push("error", "Could not publish", err instanceof ApiClientError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const patch = async (payload: Record<string, unknown>) => {
    try {
      await api("/api/admin/content", { method: "PATCH", body: JSON.stringify(payload) });
      await refresh();
    } catch {
      push("error", "Update failed");
    }
  };

  const remove = async (kind: string, id: number) => {
    if (!window.confirm("Delete this item permanently?")) return;
    try {
      await api("/api/admin/content", { method: "DELETE", body: JSON.stringify({ kind, id }) });
      await refresh();
      push("success", "Deleted");
    } catch {
      push("error", "Delete failed");
    }
  };

  if (isLoading || !data) return <PageLoader label="Loading content" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* FAQs */}
      <Card className="p-6">
        <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">FAQs ({data.faqs.length})</h3>
        <div className="mt-4 space-y-3 border-b border-slate-100 pb-5 dark:border-white/[0.06]">
          <Field label="Question"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="How do I…?" /></Field>
          <Field label="Answer"><Textarea value={a} onChange={(e) => setA(e.target.value)} rows={2} placeholder="The answer is…" /></Field>
          <Button size="sm" onClick={createFaq} loading={busy} disabled={q.trim().length < 4 || a.trim().length < 4}>
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {data.faqs.map((f) => (
            <div key={f.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{f.question}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => patch({ kind: "faq", id: f.id, published: !f.published })} className={cn("rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase", f.published ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-400 dark:bg-white/10")}>
                    {f.published ? "Live" : "Hidden"}
                  </button>
                  <button onClick={() => remove("faq", f.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.answer}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Announcements */}
      <Card className="p-6">
        <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Announcements ({data.announcements.length})</h3>
        <div className="mt-4 space-y-3 border-b border-slate-100 pb-5 dark:border-white/[0.06]">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Big news…" /></Field>
          <Field label="Message"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Share the details…" /></Field>
          <Button size="sm" onClick={createAnnouncement} loading={busy} disabled={title.trim().length < 4 || body.trim().length < 4}>
            <Plus className="h-4 w-4" /> Publish announcement
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {data.announcements.map((ann) => (
            <div key={ann.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/[0.06]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{ann.title}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => patch({ kind: "announcement", id: ann.id, published: !ann.published })} className={cn("rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase", ann.published ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-400 dark:bg-white/10")}>
                    {ann.published ? "Live" : "Hidden"}
                  </button>
                  <button onClick={() => remove("announcement", ann.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{ann.body}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{timeAgo(ann.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------- Console --------------------------------- */

export function AdminConsole({ initialTab }: { initialTab: string }) {
  const router = useRouter();
  const [tab, setTab] = useState(() => (TABS.some((t) => t.id === initialTab) ? initialTab : "overview"));

  useEffect(() => {
    if (TABS.some((t) => t.id === initialTab)) setTab(initialTab);
  }, [initialTab]);

  const switchTab = (id: string) => {
    setTab(id);
    router.replace(`/admin?tab=${id}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            <ShieldCheck className="h-7 w-7 text-blue-600" /> Admin console
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Payments, members, reports and platform health — all in one place.</p>
        </div>
        <Link href="/" className="text-xs font-bold text-slate-400 hover:text-blue-600">View public site →</Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition",
              tab === t.id ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "content" && <ContentTab />}
    </div>
  );
}
