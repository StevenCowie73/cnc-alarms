import type { Metadata, Viewport } from "next";
import SlotRampCalculator from "./SlotRampCalculator";

// Field-validated slot ramp calculator (see SLOT-RAMP-SPEC.md history:
// math and copy verified at the machine against Machinist's Friend and
// a proven running Mazatrol sub). The component is kept exactly as
// validated — this page only supplies metadata, PWA wiring, and the
// site's shared suite bar from the root layout.

export const metadata: Metadata = {
  title: "Slot Ramp Calculator — CNC tangent ramp-out | cowie.ai",
  description:
    "Free slot ramp calculator for CNC machinists. Enter slot depth, ramp radius, and breakout position from the print — get the tangent start position, full depth-ladder pass table, and a ready-to-key Mazatrol sub program. run = √(D(2R−D)).",
  manifest: "/tools/slot-ramp/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Slot Ramp Calc",
  },
  icons: {
    apple: "/tools/slot-ramp/icon-180.png",
  },
  openGraph: {
    title: "Slot Ramp Calculator — cowie.ai",
    description:
      "Print numbers in, control-ready numbers out: tangent ramp start position, pass table, and Mazatrol sub program for milled slots with radius ramp-out.",
    url: "https://alarms.cowie.ai/tools/slot-ramp",
    siteName: "cowie.ai",
    type: "website",
    images: [
      {
        url: "/tools/slot-ramp/icon-512.png",
        width: 512,
        height: 512,
        alt: "Slot Ramp Calculator",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Slot Ramp Calculator — cowie.ai",
    description:
      "Tangent ramp start position, pass table, and Mazatrol sub program from three print numbers.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D11",
  width: "device-width",
  initialScale: 1,
};

export default function SlotRampPage() {
  return <SlotRampCalculator />;
}
