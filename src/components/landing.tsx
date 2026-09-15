"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Globe2,
  Languages,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import { Logo, ThemeToggle, cn } from "@/components/ui";
import { SITE } from "@/lib/constants";

/* ------------------------------ Motion presets ---------------------------- */

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay }} className={className}>
      {children}
    </motion.div>
  );
}

/* --------------------------------- Navbar ---------------------------------- */

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stories", href: "#stories" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="glass flex h-14 items-center justify-between rounded-2xl border border-slate-200/60 px-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)] dark:border-white/10">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 rounded-xl" />
            <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition hover:text-blue-600 dark:text-slate-200 sm:block">
              Sign in
            </Link>
            <Link href="/register" className="group inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] transition hover:bg-blue-700">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button className="rounded-xl p-2 text-slate-500 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="glass mt-2 space-y-1 rounded-2xl border border-slate-200/60 p-3 dark:border-white/10 lg:hidden">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-white/10">
                {l.label}
              </a>
            ))}
            <Link href="/login" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-blue-600">Sign in</Link>
          </div>
        )}
      </div>
    </header>
  );
}

/* ----------------------------------- Hero ---------------------------------- */

function HeroCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("glass absolute rounded-2xl border border-white/50 p-3.5 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] dark:border-white/10", className)}>
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* Backdrop */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-24 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-600/25" />
      <div className="absolute right-[8%] top-32 h-72 w-72 rounded-full bg-emerald-400/20 blur-[100px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Members in 40+ countries · English & Swahili
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 text-[42px] font-extrabold leading-[1.04] tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-[68px]">
              Speak with the world,{" "}
              <span className="text-gradient">one conversation</span>{" "}
              at a time.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Global Connect matches you with verified members worldwide to practice English or Swahili,
              exchange cultures and build real friendships — through text, voice and video.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className="group inline-flex h-13 items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_16px_40px_-12px_rgba(37,99,235,0.7)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                Create free account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#how-it-works" className="inline-flex h-13 items-center rounded-2xl border border-slate-300 bg-white/70 px-7 py-3.5 text-base font-bold text-slate-700 backdrop-blur transition hover:border-blue-500 hover:text-blue-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:text-blue-300">
                See how it works
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {["Amina K", "David O", "Sofia M", "James W"].map((n, i) => (
                  <span key={n} className={cn("flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white ring-[3px] ring-white dark:ring-[#070d1c]", ["bg-blue-600", "bg-emerald-500", "bg-violet-500", "bg-amber-500"][i])}>
                    {n.split(" ").map((p) => p[0]).join("")}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  <span className="ml-1 text-sm font-bold text-slate-900 dark:text-white">4.9</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">loved by a growing global community</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Hero visual */}
        <div className="relative mx-auto hidden w-full max-w-md lg:block">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
            <div className="ring-conic absolute -inset-3 rounded-[36px] opacity-25 blur-2xl" />
            <div className="glass relative rounded-[32px] border border-white/60 p-6 shadow-2xl dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-bold text-white">NJ</span>
                <div>
                  <p className="font-display text-sm font-bold text-slate-900 dark:text-white">Neema Juma · Dar es Salaam</p>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online now · teaches Swahili</p>
                </div>
                <BadgeCheck className="ml-auto h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="bubble-in max-w-[85%] bg-slate-100 px-4 py-2.5 text-sm text-slate-700 dark:bg-white/10 dark:text-slate-200">Habari! Ready to practice your Swahili greetings?</div>
                <div className="bubble-out ml-auto max-w-[85%] bg-blue-600 px-4 py-2.5 text-sm text-white">Nzuri sana! I have been looking forward to this all week</div>
                <div className="bubble-in inline-flex items-center gap-1.5 bg-slate-100 px-4 py-3 dark:bg-white/10">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animationDelay: "0.15s" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" /> Voice</span>
                <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white"><Video className="h-3.5 w-3.5" /> Video</span>
                <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> Book</span>
              </div>
            </div>

            <HeroCard className="animate-float-y -left-24 -top-8 hidden xl:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15"><Languages className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">English ⇄ Swahili</p>
                  <p className="text-[11px] text-slate-500">Language exchange</p>
                </div>
              </div>
            </HeroCard>
            <HeroCard className="animate-float-y -right-16 bottom-16 hidden xl:block" >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15"><Globe2 className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">40+ countries</p>
                  <p className="text-[11px] text-slate-500">One global family</p>
                </div>
              </div>
            </HeroCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Sections --------------------------------- */

function SectionHeading({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{kicker}</span>
        <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[40px] sm:leading-[1.15]">{title}</h2>
        {body && <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">{body}</p>}
      </Reveal>
    </div>
  );
}

const features = [
  { icon: MessageCircle, title: "Real-time messaging", body: "Chat with typing indicators, read receipts, emoji and photo sharing — conversations that feel alive." },
  { icon: Phone, title: "Voice calls", body: "Crystal-clear browser voice calls with one tap. No phone numbers, no apps to install." },
  { icon: Video, title: "Video calls", body: "Face-to-face practice makes fluency stick. Secure, peer-to-peer video right in your browser." },
  { icon: CalendarDays, title: "Session bookings", body: "Schedule practice sessions around your availability. Accept, decline and track everything in one calendar." },
  { icon: BadgeCheck, title: "Verified members", body: "Admin-reviewed profiles and trust badges help you practice with real, committed people." },
  { icon: ShieldCheck, title: "Safe by design", body: "Instant report and block tools, human moderation and a respectful community code of conduct." },
];

function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Everything you need" title="One platform for real language practice" body="Tools built for meaningful conversations — not endless scrolling." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-[0_24px_60px_-20px_rgba(37,99,235,0.35)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-blue-500/40">
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-blue-500/10 to-emerald-500/10 blur-xl transition group-hover:from-blue-500/25 group-hover:to-emerald-500/25" />
                <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110", i % 2 === 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300")}>
                  <f.icon className="h-[22px] w-[22px]" />
                </span>
                <h3 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { step: "01", title: "Create your free account", body: "Sign up with your email, verify it, and build a profile that shows your languages, interests and availability." },
  { step: "02", title: `Activate for ${"KSh 90"}`, body: `One-time activation via M-Pesa Paybill ${SITE.paybill} keeps the community authentic and spam-free. Admin verifies within hours.` },
  { step: "03", title: "Start connecting", body: "Search members by country, language or interests. Chat, call in voice or video, and book recurring practice sessions." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Simple by design" title="Live in three steps" />
        <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.1}>
              <div className="relative h-full rounded-3xl border border-slate-200/80 bg-white p-8 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <span className="font-display text-[52px] font-extrabold leading-none text-gradient">{s.step}</span>
                <h3 className="font-display mt-4 text-xl font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Kelvin Mwangi", role: "Nairobi, Kenya · learning English", quote: "I went from nervous small talk to confident hour-long calls in two months. My partners in Manchester and Toronto feel like family now.", initials: "KM", color: "bg-blue-600" },
  { name: "Sarah Thompson", role: "London, UK · learning Swahili", quote: "Booking structured sessions changed everything. My tutor-turned-friend Amina is patient, hilarious, and my Swahili has never been better.", initials: "ST", color: "bg-emerald-500" },
  { name: "Diego Ramírez", role: "Bogotá, Colombia · culture exchange", quote: "It is not an app, it is a window into the world. I learnt how ugali tastes, how Nairobi sounds at night — all through conversations.", initials: "DR", color: "bg-violet-500" },
];

function Testimonials() {
  return (
    <section id="stories" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Member stories" title="Friendships that started with “Hello”" />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-8 dark:border-white/[0.08] dark:bg-white/[0.03]">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold text-white", t.color)}>{t.initials}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Fair & simple" title="One small activation. Everything unlocked." body="No subscriptions. No surprises. A single one-time activation keeps the community real." />
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-14 max-w-lg">
            <div className="ring-conic absolute -inset-[2px] rounded-[34px] opacity-60 blur-sm" />
            <div className="relative rounded-[32px] border border-slate-200 bg-white p-9 dark:border-white/10 dark:bg-[#0a1120]">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-1 text-xs font-extrabold text-white shadow-lg">ONE-TIME ACTIVATION</span>
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Lifetime membership</p>
                <p className="font-display mt-3 text-6xl font-extrabold text-slate-900 dark:text-white">
                  KSh 90
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">once, forever · verified by a human admin</p>
              </div>
              <ul className="mt-8 space-y-3.5">
                {[
                  "Unlimited real-time text messaging",
                  "Browser voice & video calls",
                  "Book & host conversation sessions",
                  "Verified badge eligibility & reviews",
                  "Priority matching in member search",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-2"><path d="M2 6.5 4.5 9 10 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-9 flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-[0_16px_40px_-12px_rgba(37,99,235,0.7)] transition hover:bg-blue-700">
                Join Global Connect <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-center text-xs text-slate-400">
                Pay via M-Pesa Paybill <span className="font-bold text-slate-600 dark:text-slate-300">{SITE.paybill}</span> · Account <span className="font-bold text-slate-600 dark:text-slate-300">{SITE.paybillAccount}</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const fallbackFaqs = [
  { id: 1, question: "Is Global Connect free to join?", answer: "Yes. Creating an account, building your profile and browsing members is completely free. A one-time KSh 90 activation unlocks messaging, calls and bookings forever." },
  { id: 2, question: "How does the activation payment work?", answer: `Send KSh 90 via M-Pesa Paybill ${SITE.paybill}, account number ${SITE.paybillAccount}. Submit your confirmation code on the Activation page and an admin will verify it, usually within a few hours.` },
  { id: 3, question: "Which languages can I practice?", answer: "The community focuses on English and Swahili, but members speak dozens of languages — you can filter partners by the languages they speak in search." },
  { id: 4, question: "Are the voice and video calls safe?", answer: "Calls happen peer-to-peer in your browser and are never recorded by us. Combined with verified badges, reports and blocking, you stay in control." },
  { id: 5, question: "How do bookings work?", answer: "Pick a member, propose a time and topic, and they accept or decline. Your upcoming sessions appear in your dashboard and bookings calendar." },
];

function FaqSection({ faqs }: { faqs: { id: number; question: string; answer: string }[] }) {
  const list = faqs.length > 0 ? faqs : fallbackFaqs;
  const [openId, setOpenId] = useState<number | null>(list[0]?.id ?? null);
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading kicker="Questions" title="Frequently asked questions" />
        <div className="mt-12 space-y-3">
          {list.map((f) => {
            const open = openId === f.id;
            return (
              <Reveal key={f.id}>
                <div className={cn("overflow-hidden rounded-2xl border transition-colors", open ? "border-blue-300 bg-blue-50/50 dark:border-blue-500/40 dark:bg-blue-500/[0.06]" : "border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]")}>
                  <button onClick={() => setOpenId(open ? null : f.id)} className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left">
                    <span className="py-1 text-[15px] font-bold text-slate-900 dark:text-white">{f.question}</span>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-blue-600 transition-transform duration-300", open && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.answer}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 p-10 text-white sm:p-16">
          <div className="bg-dots absolute inset-0 opacity-20" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Talk to a human</h2>
              <p className="mt-4 max-w-md leading-relaxed text-blue-100">
                Questions about activation, partnerships or safety? Our team replies within one business day.
              </p>
              <a href={`mailto:${SITE.email}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25">
                <Mail className="h-4 w-4" /> {SITE.email}
              </a>
            </Reveal>
            <Reveal delay={0.1}>
              {sent ? (
                <div className="rounded-3xl bg-white/10 p-8 text-center backdrop-blur">
                  <p className="font-display text-xl font-bold">Asante! Message on its way.</p>
                  <p className="mt-2 text-sm text-blue-100">We will get back to you shortly.</p>
                </div>
              ) : (
                <form
                  className="space-y-3 rounded-3xl bg-white/10 p-6 backdrop-blur"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const subject = encodeURIComponent(`Global Connect — message from ${data.get("name")}`);
                    const body = encodeURIComponent(String(data.get("message")));
                    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
                    setSent(true);
                  }}
                >
                  <input required name="name" placeholder="Your name" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium placeholder-blue-100/70 outline-none transition focus:border-white/50" />
                  <textarea required name="message" rows={4} placeholder="How can we help?" className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium placeholder-blue-100/70 outline-none transition focus:border-white/50" />
                  <button className="w-full rounded-xl bg-white py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50">Send message</button>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200/80 py-14 dark:border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Connecting the world through conversation. Learn English and Swahili, exchange cultures and make friends across borders.
            </p>
          </div>
          {[
            { title: "Platform", links: [["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Create account", "/register"]] },
            { title: "Community", links: [["Find members", "/register"], ["Member stories", "#stories"], ["Safety", "#features"], ["Contact", "#contact"]] },
            { title: "Account", links: [["Sign in", "/login"], ["Forgot password", "/forgot-password"], ["Activation", "/register"]] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-extrabold uppercase tracking-widest text-slate-400">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-xs text-slate-400 dark:border-white/[0.06] sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. Built with pride in Nairobi, for the world.</p>
          <p className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> English · Kiswahili · 40+ countries</p>
        </div>
      </div>
    </footer>
  );
}

export function Landing({ faqs }: { faqs: { id: number; question: string; answer: string }[] }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070d1c] dark:text-slate-100">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FaqSection faqs={faqs} />
      <Contact />
      <Footer />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      <span className="hidden"><Users /></span>
    </div>
  );
}
