import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy deep links: the hub used to render alarm detail at /?code=NNN.
      // Those URLs are shared and may already be indexed — send them
      // permanently to the statically generated page for that code.
      {
        source: "/",
        has: [{ type: "query", key: "code", value: "(?<code>\\d{1,4})" }],
        destination: "/alarms/:code",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
