"use client";

import { useState, type ReactNode, createContext, useCallback, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ------------------------------- Toasts ----------------------------------- */

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
}

const ToastContext = createContext<{ push: (tone: ToastTone, title: string, body?: string) => void }>({
  push: () => {},
});

export const useToast = () => useContext(ToastContext);

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-[toast-in_.25s_ease-out] ${
            t.tone === "success"
              ? "border-emerald-500/30 bg-emerald-50/95 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
              : t.tone === "error"
                ? "border-rose-500/30 bg-rose-50/95 text-rose-900 dark:bg-rose-950/90 dark:text-rose-100"
                : "border-blue-500/30 bg-blue-50/95 text-blue-900 dark:bg-blue-950/90 dark:text-blue-100"
          }`}
          style={{ animationName: "toast-in" }}
        >
          <p className="text-sm font-semibold">{t.title}</p>
          {t.body && <p className="mt-0.5 text-xs opacity-80">{t.body}</p>}
        </div>
      ))}
      <style>{`@keyframes toast-in{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

/* ------------------------------ Providers --------------------------------- */

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
        },
      }),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((tone: ToastTone, title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, tone, title, body }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider value={{ push }}>
        {children}
        <ToastViewport toasts={toasts} />
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
