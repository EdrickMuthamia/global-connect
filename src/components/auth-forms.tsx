"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { api, ApiClientError } from "@/lib/client";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/providers";

function PasswordInput({ value, onChange, placeholder, autoComplete }: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-11"
      />
      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
        {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

function FormError({ error }: { error: string }) {
  if (!error) return null;
  return <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>;
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

/* --------------------------------- Login ---------------------------------- */

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Quick connectivity check so users know immediately if the server is reachable.
    api("/api/health", { method: "GET" })
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Cannot reach the server. Please refresh the page and try again.");
        setApiOk(false);
      }
      setBusy(false);
    }
  };

  return (
    <div>
      <Heading title="Welcome back" subtitle="Sign in to continue your conversations." />
      {apiOk === false && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          ⚠️ The app cannot reach its server. If you are on an old preview link, please use the latest link shared above.
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <FormError error={error} />
        <Field label="Email address">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        New to Global Connect?{" "}
        <Link href="/register" className="font-bold text-blue-600 hover:underline dark:text-blue-400">Create a free account</Link>
      </p>
    </div>
  );
}

/* -------------------------------- Register --------------------------------- */

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = password.length === 0 ? 0 : Math.min(4, (password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(password) ? 1 : 0) + (/[0-9]/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ devCode?: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      if (res.devCode) sessionStorage.setItem(`gc-code-${email.trim().toLowerCase()}`, res.devCode);
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create your account.");
      setBusy(false);
    }
  };

  return (
    <div>
      <Heading title="Create your account" subtitle="Free forever to join. One conversation can change everything." />
      <form onSubmit={submit} className="space-y-4">
        <FormError error={error} />
        <Field label="Full name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Amina Juma" autoComplete="name" />
        </Field>
        <Field label="Email address">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters with letters and numbers.">
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" autoComplete="new-password" />
        </Field>
        {password.length > 0 && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? (strength <= 1 ? "bg-rose-500" : strength <= 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200 dark:bg-white/10"}`} />
            ))}
            <span className="text-[11px] font-bold text-slate-400">{["", "Weak", "Fair", "Good", "Strong"][strength]}</span>
          </div>
        )}
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Create free account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
      </p>
    </div>
  );
}

/* ------------------------------ Verify email -------------------------------- */

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      setDemoCode(sessionStorage.getItem(`gc-code-${email}`) || "");
    } catch {}
    refs.current[0]?.focus();
  }, [email]);

  const setDigit = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return setError("Enter the 6-digit code.");
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
      try { sessionStorage.removeItem(`gc-code-${email}`); } catch {}
      push("success", "Email verified", "Karibu! Your email is confirmed.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not verify the code.");
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const res = await api<{ devCode?: string }>("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ email, resend: true }) });
      if (res.devCode) {
        try { sessionStorage.setItem(`gc-code-${email}`, res.devCode); } catch {}
        setDemoCode(res.devCode);
      }
      push("info", "New code sent", "Check your inbox (shown below in demo mode).");
    } catch {
      push("error", "Could not resend", "Please wait a minute and try again.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        <MailCheck className="h-7 w-7" />
      </div>
      <Heading title="Verify your email" subtitle={`We sent a 6-digit verification code to ${email || "your email"}. Enter it below to confirm your account.`} />
      {demoCode && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Demo delivery (SMTP in production)</p>
          <p className="font-display mt-1 text-2xl font-extrabold tracking-[0.35em] text-blue-700 dark:text-blue-300">{demoCode}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5">
        <FormError error={error} />
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              inputMode="numeric"
              maxLength={1}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
                if (e.key === "Enter") submit();
              }}
              className="h-13 w-11 rounded-xl border border-slate-200 bg-white text-center font-display text-xl font-extrabold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white sm:h-14 sm:w-12"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">Verify email</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Didn&apos;t get it?{" "}
        <button onClick={resend} className="font-bold text-blue-600 hover:underline dark:text-blue-400">Resend code</button>
      </p>
    </div>
  );
}

/* ---------------------------- Forgot password ------------------------------- */

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ devCode?: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      if (res.devCode) {
        try { sessionStorage.setItem(`gc-reset-${email.trim().toLowerCase()}`, res.devCode); } catch {}
      }
      router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not send the reset code.");
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        <KeyRound className="h-7 w-7" />
      </div>
      <Heading title="Forgot your password?" subtitle="Enter the email you registered with and we'll send you a reset code." />
      <form onSubmit={submit} className="space-y-4">
        <FormError error={error} />
        <Field label="Email address">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Button type="submit" size="lg" loading={busy} className="w-full">Send reset code</Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-blue-600 hover:underline dark:text-blue-400">Back to sign in</Link>
      </p>
    </div>
  );
}

/* ----------------------------- Reset password ------------------------------- */

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState("");

  useEffect(() => {
    try { setDemoCode(sessionStorage.getItem(`gc-reset-${email}`) || ""); } catch {}
  }, [email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, code, password }) });
      try { sessionStorage.removeItem(`gc-reset-${email}`); } catch {}
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not reset your password.");
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <Heading title="Set a new password" subtitle={`Enter the reset code sent to ${email || "your email"} and choose a new password.`} />
      {demoCode && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Demo delivery</p>
          <p className="font-display mt-1 text-2xl font-extrabold tracking-[0.35em] text-emerald-700 dark:text-emerald-300">{demoCode}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <FormError error={error} />
        <Field label="Reset code">
          <Input required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" />
        </Field>
        <Field label="New password" hint="At least 8 characters with letters and numbers.">
          <PasswordInput value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" loading={busy} className="w-full">Reset password</Button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link href="/login" className="font-bold text-blue-600 hover:underline dark:text-blue-400">Back to sign in</Link>
      </p>
    </div>
  );
}
