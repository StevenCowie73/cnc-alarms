import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  decodeClearingProcedure,
  decodeErrorType,
  decodeStoppedStatus,
} from "@/lib/alarms";
import { alarmTitle, describeAlarm, getAlarm, getAllAlarms, parseCode } from "@/lib/alarmData";
import { FlowFooter } from "@/app/components/FlowFooter";
import { AlarmDetailClient } from "./AlarmDetailClient";

// One statically generated page per Mazak alarm code. Everything a crawler
// needs — code, name, cause, action, severity, clearing procedure — is in
// the HTML at build time; no client fetch. Unknown codes are a real 404.

export const dynamicParams = false;

const SITE = "https://alarms.cowie.ai";

export function generateStaticParams() {
  return getAllAlarms().map((a) => ({ code: String(a.code) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const n = parseCode(code);
  const alarm = n === null ? undefined : getAlarm(n);
  if (!alarm) return { title: "Alarm not found | Cowie.ai" };

  const title = alarmTitle(alarm);
  const description = describeAlarm(alarm);
  const url = `${SITE}/alarms/${alarm.code}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Cowie.ai Alarms",
      type: "article",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function AlarmPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const n = parseCode(code);
  const alarm = n === null ? undefined : getAlarm(n);
  if (!alarm) notFound();

  const cause =
    alarm.cause ||
    "No cause information is recorded in the manual for this alarm. Contact a Mazak Technical Center.";
  const fix =
    alarm.action ||
    "No action procedure is recorded in the manual for this alarm. Contact a Mazak Technical Center.";
  const clearing = decodeClearingProcedure(alarm.clearCode);
  const fixAnswer = clearing ? `${fix} Clearing procedure: ${clearing}.` : fix;
  const stopStatus = decodeStoppedStatus(alarm.stopCode);
  const errorType = decodeErrorType(alarm.typeCode);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: `Mazak Alarm ${alarm.code} – ${alarm.message}`,
        description: describeAlarm(alarm),
        url: `${SITE}/alarms/${alarm.code}`,
        inLanguage: "en",
        about: {
          "@type": "Thing",
          name: `Mazak CNC alarm ${alarm.code}`,
        },
        author: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" },
        publisher: { "@type": "Organization", name: "Cowie.ai", url: "https://cowie.ai" },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What does Mazak alarm ${alarm.code} mean?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Mazak alarm ${alarm.code} is "${alarm.message}". ${cause}${
                errorType ? ` Error type: ${errorType}.` : ""
              }${stopStatus ? ` Machine state: ${stopStatus}.` : ""}`,
            },
          },
          {
            "@type": "Question",
            name: `How do I fix and clear Mazak alarm ${alarm.code}?`,
            acceptedAnswer: { "@type": "Answer", text: fixAnswer },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Mazak alarms", item: `${SITE}/alarms` },
          {
            "@type": "ListItem",
            position: 2,
            name: `Alarm ${alarm.code}`,
            item: `${SITE}/alarms/${alarm.code}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="flow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AlarmDetailClient alarm={alarm} />
      <FlowFooter />
    </main>
  );
}
