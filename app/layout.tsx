import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excel Visual Explorer",
  description: "Mind-blowing visual UI for your Excel data"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <div className="relative min-h-screen">
          {/* Soft gradient orbs */}
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
            <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-fuchsia-500 blur-[120px]" />
            <div className="absolute top-40 -right-10 h-80 w-80 rounded-full bg-sky-500 blur-[130px]" />
            <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-indigo-500 blur-[130px]" />
          </div>

          {/* Main content container */}
          <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 md:px-8">
            <header className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h1 className="neon-text text-2xl font-semibold tracking-tight md:text-3xl">
                  Excel Visual Explorer
                </h1>
                <p className="mt-1 text-sm text-slate-300 md:text-base">
                  Drop your spreadsheet and watch it transform into an interactive, living dashboard.
                </p>
              </div>
              <div className="hidden text-xs text-slate-400 md:block">
                Powered by <span className="font-semibold text-slate-100">Next.js</span>
              </div>
            </header>

            <section className="glass relative flex-1 rounded-3xl p-4 md:p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
              {children}
            </section>

            <footer className="mt-4 text-center text-xs text-slate-500">
              Built for stunning Excel visualizations · {new Date().getFullYear()}
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}

