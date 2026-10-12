import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Film of the Day",
    template: "%s · Film of the Day",
  },
  description: "One great movie. Every day. No decision fatigue.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <Link href="/" className="font-display text-2xl tracking-tight">
              Film of the Day
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-500 sm:px-6">
            Movie data and images from{" "}
            <a href="https://www.themoviedb.org" className="underline hover:text-zinc-300">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </footer>
      </body>
    </html>
  );
}
