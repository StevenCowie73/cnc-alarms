import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/login"],
      },
    ],
    sitemap: "https://alarms.cowie.ai/sitemap.xml",
    host: "https://alarms.cowie.ai",
  };
}
