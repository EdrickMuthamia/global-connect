"use client";

/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  Check,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Moon,
  PhoneOff,
  Star,
  Sun,
  Video,
  VideoOff,
  X,
  Smile,
  ImagePlus,
} from "lucide-react";
import { EMOJIS, initials } from "@/lib/constants";
import { fileToDataUrl } from "@/lib/client";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* --------------------------------- Spinner -------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-label="Loading" />;
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Spinner className="h-7 w-7 text-blue-600" />
      <p className="text-sm font-medium">{label}…</p>
    </div>
  );
}

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.55)] hover:shadow-[0_14px_36px_-10px_rgba(37,99,235,0.65)]",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.5)]",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)]",
  outline:
    "border border-slate-300 bg-white/60 text-slate-700 hover:border-blue-500 hover:text-blue-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-10 px-4 text-sm gap-2 rounded-xl",
    lg: "h-12 px-6 text-base gap-2 rounded-2xl",
    icon: "h-10 w-10 rounded-xl",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Inputs --------------------------------- */

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-500";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-[96px] resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-500">{error}</span>}
    </label>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_40px_-16px_rgba(15,23,42,0.12)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ----------------------------------- Badge --------------------------------- */

type BadgeTone = "blue" | "green" | "amber" | "rose" | "slate" | "violet";
const badgeTones: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
};

export function Badge({ tone = "slate", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({
  src,
  name,
  size = 40,
  online,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full rounded-2xl object-cover ring-1 ring-slate-900/10 dark:ring-white/10"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 font-semibold text-white ring-1 ring-slate-900/10 dark:ring-white/10"
          style={{ fontSize: Math.max(10, size * 0.36) }}
        >
          {initials(name || "?")}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#0b1220]",
            online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
          )}
        />
      )}
    </span>
  );
}

/* ---------------------------------- Stars ---------------------------------- */

export function Stars({
  value,
  onChange,
  size = 16,
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cn("transition-transform", onChange && "cursor-pointer hover:scale-125")}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= display ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0c1428] sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {typeof title === "string" ? <h3 className="font-display text-lg font-bold">{title}</h3> : title}
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- EmptyState -------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-white/15", className)}>
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        {icon}
      </div>
      <p className="font-display text-base font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {body && <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-2xl", className)} />;
}

/* ------------------------------- ThemeToggle -------------------------------- */

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("gc-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-amber-300",
        className,
      )}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

/* ----------------------------------- Logo ----------------------------------- */

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 p-[7px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-transform duration-300 group-hover:rotate-12">
        <Globe className={size === "lg" ? "h-5 w-5 text-white" : "h-[18px] w-[18px] text-white"} />
      </span>
      <span className={cn("font-display font-extrabold tracking-tight text-slate-900 dark:text-white", size === "lg" ? "text-xl" : "text-[17px]")}>
        Global<span className="text-gradient">Connect</span>
      </span>
    </Link>
  );
}

/* ------------------------------- Image upload -------------------------------- */

export function ImagePicker({
  onData,
  children,
  className,
}: {
  onData: (dataUrl: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className={className}
      >
        {busy ? <Spinner className="h-4 w-4" /> : children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            onData(await fileToDataUrl(f));
          } catch (err) {
            alert(err instanceof Error ? err.message : "Could not read image.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

/* ------------------------------- Emoji picker -------------------------------- */

export function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Insert emoji"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/10"
      >
        <Smile className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-[264px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#0c1428]">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:scale-125 hover:bg-slate-100 dark:hover:bg-white/10"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  active,
  danger,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 active:scale-90",
        danger
          ? "bg-rose-600 text-white shadow-[0_10px_30px_-8px_rgba(225,29,72,0.7)] hover:bg-rose-500"
          : active
            ? "bg-white text-slate-900"
            : "bg-white/10 text-white backdrop-blur hover:bg-white/20",
        className,
      )}
    >
      {children}
    </button>
  );
}

export { Check, Mic, MicOff, PhoneOff, Video, VideoOff, ImagePlus };
