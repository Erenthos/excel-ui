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
  description: "AAA sci-fi HUD for exploring Excel data"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} min-h-screen bg-slate-950 text-white`}>
        {/* BACKGROUND HUD LAYERS */}
        <div className="fixed inset-0 -z-40 hud-grid opacity-40" />
        <div className="fixed inset-0 -z-30 hud-scanlines opacity-45 mix-blend-soft-light" />

        {/* ORBITING ENERGY RINGS */}
        <div className="hud-orbit -z-20 -left-40 top-24 h-80 w-80 md:-left-60 md:top-16 md:h-96 md:w-96" />
        <div className="hud-orbit -z-20 -right-40 bottom-0 h-72 w-72 md:-right-64 md:bottom-10 md:h-96 md:w-96" />

        {/* MAIN COCKPIT CONTAINER */}
        <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-6 pt-5 md:px-8 md:pb-10 md:pt-8">
          {/* TOP STATUS STRIP */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/90 px-3 py-2 text-[10px] uppercase tracking-[0.32em] text-slate-300/90 md:mb-5 md:px-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              <span className="font-orbitron">NEXUS-CORE ONLINE</span>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <span className="text-slate-400 tracking-[0.24em]">
                NODE: EXCEL VISUAL COMMAND
              </span>
              <span className="text-slate-500">
                BUILD v1.0 · {new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* MAIN PANEL */}
          <section className="glass glass-edge relative flex-1 rounded-3xl px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
            {/* CORNER ACCENTS */}
            <div className="pointer-events-none absolute -left-1 top-5 h-7 w-7 border-l border-t border-cyan-300/70" />
            <div className="pointer-events-none absolute -right-1 top-5 h-7 w-7 border-r border-t border-cyan-300/70" />
            <div className="pointer-events-none absolute -left-1 bottom-5 h-7 w-7 border-b border-l border-cyan-300/70" />
            <div className="pointer-events-none absolute -right-1 bottom-5 h-7 w-7 border-b border-r border-cyan-300/70" />

            <div className="relative z-10 h-full">
              {children}
            </div>
          </section>

          {/* BOTTOM STRIP */}
          <footer className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-orbitron tracking-[0.24em]">
              HUD SKIN: &quot;NEXUS PRIME&quot;
            </span>
            <span className="hidden md:inline">
              Tip: Use numeric + date channels to unlock full tactical charts.
            </span>
          </footer>
        </main>
      </body>
    </html>
  );
}
