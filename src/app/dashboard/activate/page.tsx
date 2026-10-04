"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, Copy, FileImage, Landmark, PartyPopper, Send, Wallet } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Badge, Button, Card, Field, ImagePicker, Input, PageLoader, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers";
import { ACTIVATION_FEE_EQUIV, SITE, timeAgo } from "@/lib/constants";

interface Payment {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null;
  createdAt: string;
}

function CopyButton({ value }: { value: string }) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          push("success", "Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/10"
      aria-label="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function ActivatePage() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { data: meData } = useMe();
  const me = meData?.user;

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => api<{ payments: Payment[] }>("/api/payments"),
  });

  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!me || isLoading) return <PageLoader label="Loading activation" />;

  const isActive = me.status === "active";
  const payments = paymentsData?.payments ?? [];
  const pending = payments.find((p) => p.status === "pending");
  const rejected = payments.find((p) => p.status === "rejected");

  const submit = async () => {
    setSubmitting(true);
    try {
      await api("/api/payments", { method: "POST", body: JSON.stringify({ reference, note, proofUrl }) });
      setReference("");
      setNote("");
      setProofUrl(null);
      await queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      push("success", "Payment submitted", "An admin will verify it shortly — usually within a few hours.");
    } catch (err) {
      push("error", "Could not submit", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Account activation</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Activate your account for <span className="font-bold text-emerald-600">KSh 90</span> to unlock all platform features.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIVATION_FEE_EQUIV.map((f) => (
            <span key={f.currency} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              ≈ {f.symbol}{f.amount} {f.currency}
            </span>
          ))}
        </div>
      </div>

      {isActive && (
        <Card className="relative overflow-hidden border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/[0.05]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-[0_16px_40px_-10px_rgba(16,185,129,0.7)]">
            <PartyPopper className="h-8 w-8" />
          </span>
          <p className="font-display mt-4 text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">Your account is Active</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-emerald-800/80 dark:text-emerald-300/70">
            Enjoy unlimited messaging, voice & video calls and session bookings. Asante sana for being part of Global Connect!
          </p>
        </Card>
      )}

      {!isActive && (
        <Card className="border-emerald-300/60 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white dark:border-emerald-500/30">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">🔓 One-time activation — unlock everything</p>
          <p className="mt-2 text-2xl font-extrabold">Send KSh 90 via M-Pesa right now</p>
          <p className="mt-1 text-sm opacity-90">Business: <span className="font-extrabold">{SITE.paybillName}</span> — you will see this name on your M-Pesa screen to confirm you are paying the right account.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/20 px-5 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">Paybill</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-2xl font-extrabold">{SITE.paybill}</span>
                <CopyButton value={SITE.paybill} />
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 px-5 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">Account No.</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-2xl font-extrabold">{SITE.paybillAccount}</span>
                <CopyButton value={SITE.paybillAccount} />
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 px-5 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-75">Amount</p>
              <p className="mt-1 font-mono text-2xl font-extrabold">KSh 90</p>
            </div>
          </div>
          <p className="mt-4 text-xs opacity-75">After paying, scroll down and submit your M-Pesa confirmation code. An admin activates your account within a few hours.</p>
        </Card>
      )}

      {!isActive && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Instructions */}
          <Card className="p-6">
            <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Wallet className="h-5 w-5 text-emerald-600" /> How to pay (M-Pesa)
            </h2>
            <ol className="mt-5 space-y-5">
              {[
                { title: "Open M-Pesa on your phone", body: "Go to Lipa na M-Pesa → Pay Bill." },
                { title: "Enter the business number", body: undefined, value: SITE.paybill, label: "Paybill" },
                { title: "Enter the account number", body: undefined, value: SITE.paybillAccount, label: "Account No." },
                { title: "Send KSh 90", body: "Complete the payment with your M-Pesa PIN. You'll receive a confirmation SMS from M-Pesa." },
                { title: "Submit your confirmation code", body: "Paste the M-Pesa code (e.g. QK7H2XYZ91) in the form. An admin verifies and activates your account." },
              ].map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-display text-sm font-extrabold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                    {s.value ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-blue-700 dark:bg-white/[0.08] dark:text-blue-300">{s.value}</code>
                        <CopyButton value={s.value} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</span>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04]">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Automatic M-Pesa (STK push) and international card payments are coming soon — the payment system is already designed for them.
              </p>
            </div>
          </Card>

          {/* Submit form + history */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Submit payment confirmation</h2>
              {rejected && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  Your last submission was rejected{rejected.reviewNote ? `: ${rejected.reviewNote}` : "."} Please double-check the code and resubmit.
                </p>
              )}
              {pending && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  Reference <b>{pending.reference}</b> is pending review (submitted {timeAgo(pending.createdAt)}). You can update it below.
                </p>
              )}
              <div className="mt-4 space-y-4">
                <Field label="M-Pesa confirmation code" hint="The 10-character code from your M-Pesa SMS.">
                  <Input value={reference} onChange={(e) => setReference(e.target.value.toUpperCase().slice(0, 20))} placeholder="e.g. QK7H2XYZ91" className="font-mono tracking-widest" />
                </Field>
                <Field label="Note (optional)">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={2} placeholder="Phone number used, time of payment…" />
                </Field>
                <div>
                  <p className="mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Screenshot (optional)</p>
                  {proofUrl ? (
                    <div className="relative w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofUrl} alt="Payment proof" className="max-h-44 rounded-2xl border border-slate-200 dark:border-white/10" />
                      <button onClick={() => setProofUrl(null)} className="absolute -right-2 -top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">✕</button>
                    </div>
                  ) : (
                    <ImagePicker onData={setProofUrl} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-6 text-sm font-semibold text-slate-400 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/15">
                      <FileImage className="h-5 w-5" /> Upload M-Pesa SMS screenshot
                    </ImagePicker>
                  )}
                </div>
                <Button size="lg" className="w-full" onClick={submit} loading={submitting} disabled={reference.trim().length < 6}>
                  <Send className="h-4 w-4" /> {pending ? "Update submission" : "Submit for verification"}
                </Button>
              </div>
            </Card>

            {payments.length > 0 && (
              <Card className="p-6">
                <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">Submission history</h3>
                <div className="mt-3 space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
                      <BadgeCheck className={`h-4 w-4 ${p.status === "approved" ? "text-emerald-500" : p.status === "rejected" ? "text-rose-500" : "text-amber-500"}`} />
                      <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{p.reference}</span>
                      <span className="ml-auto text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
                      <Badge tone={p.status === "approved" ? "green" : p.status === "rejected" ? "rose" : "amber"}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
