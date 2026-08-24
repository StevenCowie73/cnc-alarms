import type { Metadata, Viewport } from "next";
import ChordCalculator from "./ChordCalculator";

// Chord / bolt-pattern calculator — the sister tool to slot-ramp from
// SLOT-RAMP-SPEC.md §6. Two modes: any-two-of-five chord geometry
// (replaces the Machinist's Friend chord calculator generally), and
// n-features-of-width-w-on-Ø-d → C-axis centrelines with leading and
// trailing edge angles. Math validated: 1.50 on Ø11.5 subtends
// 2·asin(1.5/11.5) = 14.9894° ≈ 15.0°. Pure client-side; this page only
// supplies metadata and PWA wiring, same as slot-ramp.

export const metadata: Metadata = {
  title: "Chord & Bolt-Pattern Calculator — CNC chord geometry | cowie.ai",
  description:
    "Free chord calculator for CNC machinists. Enter any two of radius, chord, included angle, arc length and rise — get the rest, exact. Plus slot patterns on a diameter: C-axis centrelines and edge angles from 2·asin(w/d).",
  manifest: "/tools/chord/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chord Calc",
  },
  icons: {
    apple: "/tools/chord/icon-180.png",
  },
  openGraph: {
    title: "Chord & Bolt-Pattern Calculator — cowie.ai",
    description:
      "Print numbers in, control-ready numbers out: chord geometry from any two values, and C-axis centrelines for slot patterns on a diameter.",
    url: "https://alarms.cowie.ai/tools/chord",
    siteName: "cowie.ai",
    type: "website",
    images: [
      {
        url: "/tools/chord/icon-512.png",
        width: 512,
        height: 512,
        alt: "Chord Calculator",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Chord & Bolt-Pattern Calculator — cowie.ai",
    description:
      "Chord geometry from any two of radius, chord, angle, arc and rise — plus C-axis slot-pattern tables.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D11",
  width: "device-width",
  initialScale: 1,
};

export default function ChordPage() {
  return <ChordCalculator />;
}
