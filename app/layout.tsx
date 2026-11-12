import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import Link from "next/link";
import "./globals.css";
import { getAccentTheme } from "@/lib/settings";
import { ThemePicker } from "@/app/components/ThemePicker";

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

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  const theme = await getAccentTheme();

  return (
    <html
      lang="en"
      data-theme="light"
      data-accent={theme.toLowerCase()}
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
            <Link href="/setup">Sync setup</Link>
          </nav>
          <div className="ml-auto">
            <ThemePicker current={theme} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
