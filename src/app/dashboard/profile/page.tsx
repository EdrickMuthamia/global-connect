"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Camera, Save } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { useMe } from "@/components/shell";
import { Avatar, Badge, Button, Card, Field, ImagePicker, Input, PageLoader, Select, Textarea, cn } from "@/components/ui";
import { useToast } from "@/components/providers";
import { AVAILABILITY_PRESETS, COUNTRIES, INTERESTS, LANGUAGES } from "@/lib/constants";

interface MeProfile {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  languages?: string[];
  interests?: string[];
  availability?: string | null;
  isVerified?: boolean;
  status?: string;
  emailVerified?: boolean;
}

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
  max,
  tone,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  max: number;
  tone: "blue" | "green";
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
        {label} <span className="font-normal text-slate-400">({selected.length}/{max})</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                active
                  ? tone === "blue"
                    ? "bg-blue-600 text-white shadow-[0_6px_20px_-6px_rgba(37,99,235,0.6)]"
                    : "bg-emerald-600 text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.6)]"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-300",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { data: meData, isLoading } = useMe();
  const me = meData?.user as MeProfile | undefined;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [availability, setAvailability] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setName(me.name || "");
    setBio(me.bio || "");
    setCountry(me.country || "");
    setAvailability(me.availability || "");
    setLanguages(me.languages || []);
    setInterests(me.interests || []);
    setAvatarUrl(me.avatarUrl || null);
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !me) return <PageLoader label="Loading your profile" />;

  const toggle = (list: string[], set: (v: string[]) => void, max: number) => (v: string) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name, bio, country, availability, languages, interests, avatarUrl }),
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      push("success", "Profile saved", "Looking good — members will love this.");
    } catch (err) {
      push("error", "Could not save", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">My profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This is what other members see. A complete profile gets 4× more conversations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Avatar card */}
        <Card className="h-fit p-6 text-center">
          <div className="relative mx-auto w-fit">
            <Avatar src={avatarUrl} name={name} size={120} className="rounded-[28px]" />
            <ImagePicker
              onData={(d) => setAvatarUrl(d)}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-110"
            >
              <Camera className="h-4.5 w-4.5" />
            </ImagePicker>
          </div>
          <p className="font-display mt-4 flex items-center justify-center gap-1.5 text-lg font-extrabold text-slate-900 dark:text-white">
            {name}
            {me.isVerified && <BadgeCheck className="h-5 w-5 text-blue-600" />}
          </p>
          <p className="text-xs text-slate-400">{me.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone={me.status === "active" ? "green" : "amber"}>{me.status === "active" ? "Active member" : "Pending activation"}</Badge>
            {me.emailVerified && <Badge tone="blue">Email verified</Badge>}
            {me.isVerified && <Badge tone="violet">Trusted</Badge>}
          </div>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
            Use a clear, friendly photo of yourself — profiles with photos receive far more messages and call requests.
          </p>
        </Card>

        {/* Form */}
        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </Field>
              <Field label="Country">
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Choose your country…</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="About me" hint={`${bio.length}/280 — tell members what you love to talk about.`}>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 280))} placeholder="I'm learning English because… I love talking about…" />
            </Field>
            <Field label="Usual availability">
              <Select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="">When are you usually free to talk?…</option>
                {AVAILABILITY_PRESETS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <ChipPicker label="Languages I speak / practice" options={LANGUAGES} selected={languages} onToggle={toggle(languages, setLanguages, 8)} max={8} tone="blue" />
            <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />
            <ChipPicker label="My interests" options={INTERESTS} selected={interests} onToggle={toggle(interests, setInterests, 12)} max={12} tone="green" />
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Save profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
