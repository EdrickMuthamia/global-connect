import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Global Connect — Speak with the World",
    template: "%s · Global Connect",
  },
  description:
    "Global Connect is where people from around the world meet to learn English or Swahili, exchange cultures and build international friendships through text, voice and video conversations.",
  keywords: ["language exchange", "learn English", "learn Swahili", "video calls", "international friends"],
};

// Set the theme before first paint to avoid a flash of the wrong color scheme.
const themeInit = `(function(){try{var t=localStorage.getItem('gc-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-[#070d1c] dark:text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
