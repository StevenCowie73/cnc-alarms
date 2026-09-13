import { defineConfig } from "vitest/config";

// Pure-function unit tests only. Nothing here touches Supabase, the network,
// the service worker, or React rendering, so the plain node environment is
// enough and no setup file is needed.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.{js,ts}"],
    environment: "node",
  },
});
