import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// The redesign uses a two-face system: Archivo for everything textual,
// JetBrains Mono for codes, labels, and numerics. There is no serif in
// the design, so --font-serif is mapped onto Archivo as well — this
// keeps every existing `var(--font-serif)` reference working without
// touching markup across the app.
const sans = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Archivo({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alarms.cowie.ai"),
  title: "Mazak Alarm Codes — cause, fix & clearing procedure | Cowie.ai",
  description:
    "Searchable Mazak CNC alarm reference: every alarm code with its cause, recovery steps, severity, and clearing procedure, with the Mazatrol assistant for when lookup isn't enough. Independent third-party service from cowie.ai.",
  openGraph: {
    siteName: "Cowie.ai Alarms",
    type: "website",
    url: "https://alarms.cowie.ai",
    title: "Mazak Alarm Codes — cause, fix & clearing procedure | Cowie.ai",
    description:
      "Searchable Mazak CNC alarm reference with cause, recovery steps, and an AI Mazatrol assistant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
      >
        <nav className="suite-bar" aria-label="Cowie.ai suite">
          <span className="suite-bar__brand">Cowie.ai</span>
          <span className="suite-bar__sep">—</span>
          <a href="https://alarms.cowie.ai" aria-current="page">Alarms</a>
          <a href="/tools">Tools</a>
          <a href="https://mazatrol.cowie.ai">Mazatrol</a>
          <a href="https://maintenance.cowie.ai">Maintenance</a>
          <a href="https://forklifts.cowie.ai">Forklifts</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
