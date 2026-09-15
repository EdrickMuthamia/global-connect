"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  Globe2,
  Languages,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageLoader, Select, Stars, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers";
import { formatDateTime, isOnline, timeAgo } from "@/lib/constants";

interface ProfileData {
  user: {
    id: number;
    name: string;
    avatarUrl?: string | null;
    bio?: string | null;
    country?: string | null;
    languages?: string[];
    interests?: string[];
    availability?: string | null;
    isVerified: boolean;
    lastActiveAt?: string | null;
    createdAt: string;
  };
  rating: number | null;
  ratingCount: number;
  reviews: { id: number; rating: number; comment?: string | null; createdAt: string; authorName: string; authorAvatar?: string | null; authorCountry?: string | null }[];
  blocked: boolean;
  isSelf: boolean;
}

const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate content",
  "Spam or scam attempt",
  "Hate speech",
  "Impersonation",
  "Other",
];

export function MemberProfile({ userId }: { userId: number }) {
  const router = useRouter();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const { data: meData } = useMe();
  const me = meData?.user;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["member", userId],
    queryFn: () => api<ProfileData>(`/api/users/${userId}`),
    retry: false,
  });

  const [bookingOpen, setBookingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  if (isLoading || !me) return <PageLoader label="Loading profile" />;
  if (isError || !data) {
    return (
      <EmptyState
        icon={<Globe2 className="h-6 w-6" />}
        title="Member not found"
        body="This profile may have been removed or is temporarily unavailable."
        action={<Link href="/dashboard/members" className="text-sm font-bold text-blue-600 hover:underline">Back to members</Link>}
      />
    );
  }

  const { user, rating, ratingCount, reviews, blocked, isSelf } = data;
  const online = isOnline(user.lastActiveAt);
  const needsActivation = me.status !== "active";

  const guardActivation = () => {
    if (needsActivation) {
      push("info", "Activation required", "Activate your account (KSh 90) to use this feature.");
      router.push("/dashboard/activate");
      return true;
    }
    return false;
  };

  const run = async (key: string, fn: () => Promise<void>, success?: () => void) => {
    setBusy(key);
    try {
      await fn();
      success?.();
    } catch (err) {
      push("error", "Something went wrong", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const startChat = () =>
    run("chat", async () => {
      const res = await api<{ conversationId: number }>("/api/conversations", { method: "POST", body: JSON.stringify({ userId: user.id }) });
      router.push(`/dashboard/messages?c=${res.conversationId}`);
    });

  const startCall = (type: "voice" | "video") => {
    if (guardActivation()) return;
    run(type, async () => {
      const res = await api<{ call: { id: number } }>("/api/calls", { method: "POST", body: JSON.stringify({ calleeId: user.id, type }) });
      router.push(`/dashboard/calls?outgoing=${res.call.id}`);
    });
  };

  const submitBooking = () => {
    run("booking", async () => {
      await api("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ hostId: user.id, topic, note, scheduledAt, durationMin: Number(duration) }),
      });
      setBookingOpen(false);
      setTopic("");
      setNote("");
      setScheduledAt("");
      push("success", "Session requested", `${user.name} will review your request.`);
    });
  };

  const submitReport = () =>
    run("report", async () => {
      await api("/api/reports", { method: "POST", body: JSON.stringify({ targetId: user.id, reason, details }) });
      setReportOpen(false);
      push("success", "Report submitted", "Our moderation team will review it shortly.");
    });

  const toggleBlock = () =>
    run("block", async () => {
      await api("/api/blocks", {
        method: blocked ? "DELETE" : "POST",
        body: JSON.stringify({ userId: user.id }),
      });
      await queryClient.invalidateQueries({ queryKey: ["member", userId] });
      push("info", blocked ? "Member unblocked" : "Member blocked", blocked ? undefined : "You will no longer see each other.");
    });

  const submitReview = () =>
    run("review", async () => {
      await api("/api/reviews", { method: "POST", body: JSON.stringify({ targetId: user.id, rating: myRating, comment: myComment }) });
      setMyRating(0);
      setMyComment("");
      await queryClient.invalidateQueries({ queryKey: ["member", userId] });
      push("success", "Review posted", "Asante for the feedback!");
    });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-500 sm:h-40">
          <div className="bg-dots absolute inset-0 opacity-20" />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
            <div className="flex items-end gap-4">
              <Avatar src={user.avatarUrl} name={user.name} size={104} online={online} className="rounded-[28px] ring-4 ring-white dark:ring-[#0c1428]" />
              <div className="pb-1">
                <p className="font-display flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
                  {user.name}
                  {user.isVerified && <BadgeCheck className="h-6 w-6 text-blue-600" />}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {user.country && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.country}</span>}
                  <span className={`flex items-center gap-1 font-bold ${online ? "text-emerald-500" : "text-slate-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                    {online ? "Online now" : `Active ${timeAgo(user.lastActiveAt)}`}
                  </span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Joined {timeAgo(user.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pb-1">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{rating !== null ? rating.toFixed(1) : "—"}</span>
              <span className="text-xs text-slate-400">({ratingCount} review{ratingCount === 1 ? "" : "s"})</span>
            </div>
          </div>

          {user.bio && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{user.bio}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {(user.languages ?? []).map((l) => <Badge key={l} tone="blue"><Languages className="h-3 w-3" /> {l}</Badge>)}
            {user.availability && <Badge tone="green"><Clock className="h-3 w-3" /> {user.availability}</Badge>}
          </div>
          {(user.interests ?? []).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {user.interests!.map((i) => <Badge key={i} tone="slate"><Sparkles className="h-3 w-3" /> {i}</Badge>)}
            </div>
          )}

          {/* Actions */}
          {!isSelf && !blocked && (
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button onClick={startChat} loading={busy === "chat"}><MessageCircle className="h-4 w-4" /> Message</Button>
              <Button variant="success" onClick={() => startCall("voice")} loading={busy === "voice"}><Phone className="h-4 w-4" /> Voice call</Button>
              <Button variant="secondary" onClick={() => startCall("video")} loading={busy === "video"}><Video className="h-4 w-4" /> Video call</Button>
              <Button variant="outline" onClick={() => (guardActivation() ? undefined : setBookingOpen(true))}><CalendarDays className="h-4 w-4" /> Book session</Button>
              <Button variant="ghost" onClick={() => setReportOpen(true)}><Flag className="h-4 w-4" /> Report</Button>
              <Button variant="ghost" onClick={toggleBlock} loading={busy === "block"} className="text-rose-500 hover:text-rose-600"><Ban className="h-4 w-4" /> Block</Button>
            </div>
          )}
          {!isSelf && blocked && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">You blocked this member.</p>
              <Button size="sm" variant="outline" onClick={toggleBlock} loading={busy === "block"}>Unblock</Button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Reviews */}
        <Card className="p-6">
          <h2 className="font-display mb-5 text-base font-extrabold text-slate-900 dark:text-white">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <EmptyState icon={<Star className="h-6 w-6" />} title="No reviews yet" body="Be the first to share your experience after a session together." className="border-0 py-8" />
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-3.5 border-b border-slate-100 pb-5 last:border-0 last:pb-0 dark:border-white/[0.06]">
                  <Avatar src={r.authorAvatar} name={r.authorName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{r.authorName}</p>
                      {r.authorCountry && <span className="text-xs text-slate-400">· {r.authorCountry}</span>}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} size={13} className="mt-1" />
                    {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Leave a review */}
        {!isSelf && (
          <Card className="h-fit p-6">
            <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Rate {user.name.split(" ")[0]}</h3>
            <p className="mt-1 text-xs text-slate-400">Honest reviews keep the community trustworthy.</p>
            <div className="mt-4">
              <Stars value={myRating} onChange={setMyRating} size={32} />
            </div>
            <Textarea value={myComment} onChange={(e) => setMyComment(e.target.value.slice(0, 600))} rows={3} className="mt-4" placeholder="How was your conversation? (optional)" />
            <Button className="mt-4 w-full" onClick={submitReview} loading={busy === "review"} disabled={myRating === 0}>
              <CheckCircle2 className="h-4 w-4" /> Post review
            </Button>
          </Card>
        )}
      </div>

      {/* Booking modal */}
      <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} title={`Book a session with ${user.name.split(" ")[0]}`}>
        <div className="space-y-4">
          <Field label="What would you like to practice?">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. English conversation practice" maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date & time">
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} min={new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16)} />
            </Field>
            <Field label="Duration">
              <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
                {["15", "30", "45", "60", "90"].map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Note (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="Anything they should prepare?" />
          </Field>
          {scheduledAt && (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              {formatDateTime(scheduledAt)} · {duration} minutes — {user.name.split(" ")[0]} will accept or decline your request.
            </p>
          )}
          <Button size="lg" className="w-full" onClick={submitBooking} loading={busy === "booking"} disabled={topic.trim().length < 3 || !scheduledAt}>
            Send booking request
          </Button>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={`Report ${user.name.split(" ")[0]}`}>
        <div className="space-y-4">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Reports are confidential and reviewed by our moderation team within 24 hours.
          </p>
          <Field label="Reason">
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Details (optional)">
            <Textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 1000))} rows={4} placeholder="What happened? Include dates, messages, or anything relevant." />
          </Field>
          <Button variant="danger" size="lg" className="w-full" onClick={submitReport} loading={busy === "report"}>
            <Flag className="h-4 w-4" /> Submit report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
