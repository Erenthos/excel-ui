import "./globals.css";
import type { Metadata } from "next";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Excel Visual Command Center",
  description: "AAA-inspired visual UI for Excel data"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} min-h-screen bg-slate-950 text-slate-100`}>
        <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-6 pt-5 md:px-8 md:pb-10 md:pt-8">
          {/* Top status bar */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/90 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-slate-300/90 md:mb-5 md:px-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              <span className="font-orbitron">NEXUS CORE ONLINE</span>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <span className="text-slate-400 tracking-[0.22em]">
                NODE: EXCEL VISUAL CONSOLE
              </span>
              <span className="text-slate-500">
                BUILD v1.0 · {new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Main glass panel */}
          <section className="glass glass-edge relative flex-1 rounded-3xl px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
            <div className="relative z-10 h-full">{children}</div>
          </section>

          {/* Bottom strip */}
          <footer className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-orbitron tracking-[0.22em]">
              HUD SKIN: &quot;NEXUS LITE&quot;
            </span>
            <span className="hidden md:inline">
              Use numeric + date columns to unlock richer charts.
            </span>
          </footer>
        </main>
      </body>
    </html>
  );
}
