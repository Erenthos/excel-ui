import "./globals.css";
import type { Metadata } from "next";

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
      <body className="min-h-screen bg-slate-950 text-white">
        {/* HUD background layers */}
        <div className="fixed inset-0 -z-30 hud-grid opacity-35" />
        <div className="fixed inset-0 -z-20 hud-scanlines opacity-45 mix-blend-soft-light" />
        {/* Orbiting energy ring on the left */}
        <div className="hud-orbit -z-10 -left-40 top-32 h-80 w-80 md:-left-56 md:top-28 md:h-96 md:w-96" />
        {/* Orbiting energy ring on the right */}
        <div className="hud-orbit -z-10 -right-40 bottom-0 h-72 w-72 md:-right-56 md:bottom-10 md:h-80 md:w-80" />

        {/* Main container */}
        <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
          {/* Top meta strip like a game HUD status line */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-slate-300/90 md:mb-5 md:px-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              <span>System Online</span>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span className="text-slate-400">Cluster: NEXUS-CORE</span>
              <span className="text-slate-500">
                Build v1.0 · {new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Main glass panel that page.tsx fills */}
          <section className="glass relative flex-1 rounded-3xl px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
            {/* Thin glowing border */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-cyan-400/35" />

            {/* Optional corner accents */}
            <div className="pointer-events-none absolute -left-1 top-6 h-6 w-6 border-l border-t border-cyan-300/70" />
            <div className="pointer-events-none absolute -right-1 top-6 h-6 w-6 border-r border-t border-cyan-300/70" />
            <div className="pointer-events-none absolute -left-1 bottom-6 h-6 w-6 border-b border-l border-cyan-300/70" />
            <div className="pointer-events-none absolute -right-1 bottom-6 h-6 w-6 border-b border-r border-cyan-300/70" />

            <div className="relative z-10 h-full">
              {children}
            </div>
          </section>

          {/* Bottom tiny status strip */}
          <footer className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span>Excel Visual Command Center · HUD skin “NEXUS PRIME”</span>
            <span className="hidden md:inline">
              Tip: Use a file with numeric + date columns to see full tactical charts.
            </span>
          </footer>
        </main>
      </body>
    </html>
  );
}
