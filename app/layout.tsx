import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTracker",
  description: "Tracks job applications from your inbox.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobTracker",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header
          className="flex items-center gap-6 px-6 py-4 border-b"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <Link href="/dashboard" className="font-semibold text-lg">
            JobTracker
          </Link>
          <nav className="flex gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/applications">Applications</Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
