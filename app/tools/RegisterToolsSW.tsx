"use client";

import { useEffect } from "react";

// Registers the /tools-scoped service worker so the calculators work
// offline at the machine after one online visit. Rendered by the tools
// layout; a no-op where service workers are unavailable.
export function RegisterToolsSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/tools/sw.js", { scope: "/tools/" })
        .catch(() => { /* offline support is progressive enhancement */ });
    }
  }, []);
  return null;
}
