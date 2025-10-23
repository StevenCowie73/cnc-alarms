// app/alarm/[code]/page.tsx
// Reads the local JSON file directly (no extra config needed)
import fs from "fs";
import path from "path";

type Params = { params: { code: string } };

export default function AlarmPage({ params }: Params) {
  const code = String(params.code);

  // 1) Load JSON from project root (where web_alarms.json sits)
  const filePath = path.join(process.cwd(), "web_alarms.json");
  let alarms: any[] = [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    alarms = Array.isArray(parsed) ? parsed : parsed.alarms || [];
  } catch (err) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {code}</h1>
        <p>Could not read web_alarms.json. Error: {(err as Error).message}</p>
      </main>
    );
  }

  // 2) Find the alarm by code
  const alarm = alarms.find((a: any) => String(a.code) === code);

  if (!alarm) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {code}</h1>
        <p>Not found in web_alarms.json.</p>
      </main>
    );
  }

  // 3) Show ALL fields (raw + simple list)
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: 24 }}>
      <a href="/" style={{ fontSize: 12, opacity: 0.7 }}>← Back to Alarm Intelligence Hub</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        {alarm.code} — {alarm.name || "Unnamed Alarm"}
      </h1>

      {/* Pretty key/value list */}
      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        {Object.entries(alarm).map(([key, value]) => (
          <div key={key} style={{ background: "#111", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{key}</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
