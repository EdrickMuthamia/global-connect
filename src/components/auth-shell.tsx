import type { ReactNode } from "react";
import Link from "next/link";
import { Globe2, Sparkles, Phone, ShieldCheck } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui";

/** Split-screen layout for all authentication pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#070d1c]">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 lg:block">
        <div className="bg-dots absolute inset-0 opacity-20" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/30 blur-[110px]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-300/30 blur-[100px]" />
        <div className="relative flex h-full flex-col p-12 text-white">
          <Logo href="/" size="lg" />
          <div className="mt-auto">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> English ⇄ Swahili · 40+ countries
            </p>
            <h1 className="font-display mt-6 text-4xl font-extrabold leading-tight xl:text-[44px]">
              Karibu. Welcome.<br />The world is waiting<br />to talk to you.
            </h1>
            <div className="mt-10 space-y-4">
              {[
                { icon: Globe2, text: "Meet verified members from every continent" },
                { icon: Phone, text: "Voice & video calls right from your browser" },
                { icon: ShieldCheck, text: "Human-verified community, safe by design" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-sm font-medium text-blue-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><f.icon className="h-4 w-4" /></span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-12 text-xs text-blue-100/80">© {new Date().getFullYear()} Global Connect · Speak with the world</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5 lg:p-7">
          <div className="lg:hidden"><Logo href="/" /></div>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="pb-6 text-center text-xs text-slate-400">
          By continuing you agree to respectful, friendly conversation. <Link href="/" className="underline hover:text-blue-600">Learn more</Link>
        </p>
      </div>
    </div>
  );
}
