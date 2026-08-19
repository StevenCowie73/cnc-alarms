import type { MetadataRoute } from "next";
import { getAllAlarms } from "@/lib/alarmData";

const SITE = "https://alarms.cowie.ai";

// Built at deploy time from the same static alarm data as the pages, so the
// sitemap and the generated routes can never drift apart.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const main: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/alarms`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/tools`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/tools/slot-ramp`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/landing`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
  const alarms: MetadataRoute.Sitemap = getAllAlarms().map((a) => ({
    url: `${SITE}/alarms/${a.code}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.8,
  }));
  return [...main, ...alarms];
}
