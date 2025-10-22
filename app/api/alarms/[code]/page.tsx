// app/alarm/[code]/page.tsx
import data from "../../../web_alarms.json";

type Params = { params: { code: string } };

export default function AlarmPage({ params }: Params) {
  const code = String(params.code);
  const alarms = (data as any).alarms || data; // handles both wrapped or flat JSON
  const alarm = alarms.find((a: any) => String(a.code) === code);

  if (!alarm) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {code}</h1>
        <p>Not found.</p>
      </main>
    );
  }

  return (
    <main style={{ background: "#0a0a0a", color: "#fff", minHeight: "100vh", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        {alarm.code} — {alarm.name || "Unnamed Alarm"}
      </h1>

      {/* this prints every field */}
      <pre
        style={{
          background: "#111",
          color: "#fff",
          marginTop: 20,
          padding: 16,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          fontSize: 14,
        }}
      >
        {JSON.stringify(alarm, null, 2)}
      </pre>
    </main>
  );
}
