"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, RotateCcw, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import { api } from "@/lib/client";
import { Avatar, Badge, Card, EmptyState, Input, PageLoader, Select, Skeleton } from "@/components/ui";
import { COUNTRIES, INTERESTS, LANGUAGES, isOnline } from "@/lib/constants";

interface MemberRow {
  id: number;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  languages?: string[];
  interests?: string[];
  isVerified: boolean;
  lastActiveAt?: string | null;
  rating: number | null;
  ratingCount: number;
}

export default function MembersPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [interest, setInterest] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (country) params.set("country", country);
  if (language) params.set("language", language);
  if (interest) params.set("interest", interest);
  if (onlineOnly) params.set("online", "1");
  if (verifiedOnly) params.set("verified", "1");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["members", params.toString()],
    queryFn: () => api<{ users: MemberRow[] }>(`/api/users?${params.toString()}`),
    placeholderData: (prev) => prev,
  });

  const members = data?.users ?? [];
  const activeFilters = [country, language, interest].filter(Boolean).length + (onlineOnly ? 1 : 0) + (verifiedOnly ? 1 : 0);

  const reset = () => {
    setQ("");
    setCountry("");
    setLanguage("");
    setInterest("");
    setOnlineOnly(false);
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Find members</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search by country, language, interests or availability — then say hello.</p>
        </div>
        <span className="text-xs font-bold text-slate-400">{isFetching ? "Searching…" : `${members.length} members`}</span>
      </div>

      {/* Search + filters */}
      <Card className="space-y-4 p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, bios, countries…" className="pl-10" />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${showFilters ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{activeFilters}</span>}
          </button>
        </div>
        {showFilters && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">All countries</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select value={interest} onChange={(e) => setInterest(e.target.value)}>
              <option value="">All interests</option>
              {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
              Online now
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
              Verified members only
            </label>
            {activeFilters > 0 && (
              <button onClick={reset} className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:underline">
                <RotateCcw className="h-3.5 w-3.5" /> Reset filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No members match those filters"
          body="Try widening your search — new members join every day from around the world."
          action={<button onClick={reset} className="text-sm font-bold text-blue-600 hover:underline">Clear all filters</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => {
            const online = isOnline(m.lastActiveAt);
            return (
              <Link key={m.id} href={`/dashboard/members/${m.id}`}>
                <Card className="group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_20px_50px_-18px_rgba(37,99,235,0.4)] dark:hover:border-blue-500/40">
                  <div className="flex items-start gap-3.5">
                    <Avatar src={m.avatarUrl} name={m.name} size={56} online={online} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-display text-[15px] font-extrabold text-slate-900 dark:text-white">
                        <span className="truncate">{m.name}</span>
                        {m.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" />}
                      </p>
                      {m.country && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" /> {m.country}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {m.rating !== null ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{m.rating.toFixed(1)}</span>
                            <span className="text-slate-400">({m.ratingCount})</span>
                          </>
                        ) : (
                          <span className="text-slate-400">New member</span>
                        )}
                        {online && <span className="ml-1 font-bold text-emerald-500">· Online</span>}
                      </div>
                    </div>
                  </div>
                  {m.bio && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{m.bio}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(m.languages ?? []).slice(0, 2).map((l) => <Badge key={l} tone="blue">{l}</Badge>)}
                    {(m.interests ?? []).slice(0, 3).map((i) => <Badge key={i} tone="slate">{i}</Badge>)}
                    {(m.interests?.length ?? 0) > 3 && <Badge tone="slate">+{m.interests!.length - 3}</Badge>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      {(isLoading || isFetching) && !isLoading && <PageLoader label="" />}
    </div>
  );
}
