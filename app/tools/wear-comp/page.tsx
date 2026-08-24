import type { Metadata, Viewport } from "next";
import WearCompCalculator from "./WearCompCalculator";

// Wear comp helper — the last §6 sister tool from docs/SLOT-RAMP-SPEC.md.
// Measured vs target → the signed WEAR COMP øX value, with the
// diameter-vs-radius ×2 trap and the cos(angle) correction for faces
// measured square to a taper both shown step by step, never silent.
// Validated reference: the 45° serration face where øX −0.01 was the
// proven move. Pure client-side; this page only supplies metadata and
// PWA wiring, same as slot-ramp and chord.

export const metadata: Metadata = {
  title: "Wear Comp Calculator — signed øX values for Mazatrol | cowie.ai",
  description:
    "Free wear comp calculator for CNC lathes. Measured vs target size → the signed WEAR COMP øX value with direction in plain words. Handles the diameter-vs-radius ×2 trap and the cos correction for tapered faces measured square to the face.",
  manifest: "/tools/wear-comp/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wear Comp",
  },
  icons: {
    apple: "/tools/wear-comp/icon-180.png",
  },
  openGraph: {
    title: "Wear Comp Calculator — cowie.ai",
    description:
      "Print numbers in, control-ready numbers out: measured vs target → signed WEAR COMP øX, with the ×2 and cos(angle) conversions shown, not silent.",
    url: "https://alarms.cowie.ai/tools/wear-comp",
    siteName: "cowie.ai",
    type: "website",
    images: [
      {
        url: "/tools/wear-comp/icon-512.png",
        width: 512,
        height: 512,
        alt: "Wear Comp Calculator",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Wear Comp Calculator — cowie.ai",
    description:
      "Measured vs target → signed WEAR COMP øX, with the ×2 trap and tapered-face cos correction shown step by step.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D11",
  width: "device-width",
  initialScale: 1,
};

export default function WearCompPage() {
  return <WearCompCalculator />;
}
