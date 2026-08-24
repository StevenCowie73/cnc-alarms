import type { MetadataRoute } from "next";
import { getAllAlarms } from "@/lib/alarmData";
import { getAllParameterPages } from "@/lib/parameterData";
import { getAllMCodes } from "@/lib/mcodeData";
import { getAllGCodes } from "@/lib/gcodeData";

const SITE = "https://alarms.cowie.ai";

// Built at deploy time from the same static alarm data as the pages, so the
// sitemap and the generated routes can never drift apart.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const main: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/alarms`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/parameters`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/mcodes`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/gcodes`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/tools`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/tools/slot-ramp`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/tools/chord`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/tools/wear-comp`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/landing`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
  const alarms: MetadataRoute.Sitemap = getAllAlarms().map((a) => ({
    url: `${SITE}/alarms/${a.code}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.8,
  }));
  const parameters: MetadataRoute.Sitemap = getAllParameterPages().map((p) => ({
    url: `${SITE}/parameters/${p.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.7,
  }));
  const mcodes: MetadataRoute.Sitemap = getAllMCodes().map((m) => ({
    url: `${SITE}/mcodes/${m.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.7,
  }));
  const gcodes: MetadataRoute.Sitemap = getAllGCodes().map((g) => ({
    url: `${SITE}/gcodes/${encodeURIComponent(g.code)}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.7,
  }));
  return [...main, ...alarms, ...parameters, ...mcodes, ...gcodes];
}
