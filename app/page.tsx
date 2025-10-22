// app/alarm/[code]/page.tsx
import alarmsData from "@/data/mazak_alarm_summarised.json"; // adjust path if your JSON lives elsewhere

type Params = { params: { code: string } };

export default function AlarmPage({ params }: Params) {
  const code = params.code;
  // your JSON should look like { alarms: [ { code, name, ... } ] }
  const alarms = (alarmsData as any).alarms || [];
  const alarm = alarms.find((a: any) => String(a.code) === String(code));

  if (!alarm) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {code}</h1>
        <p>Not found.</p>
      </main>
    );
  }

  const Field = ({ label, value }: { label: string; value?: any }) =>
    !value ? null : (
      <section style={{ marginTop: 16 }}>
        <h3 style={{ fontWeight: 600 }}>{label}</h3>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{String(value)}</pre>
      </section>
    );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: 24 }}>
      <a href="/" style={{ fontSize: 12, opacity: 0.7 }}>← Back</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        {alarm.code} — {alarm.name}
      </h1>
      <p style={{ opacity: 0.8, marginTop: 4 }}>
        {(alarm.category || "Uncategorized")} • {(alarm.severity || "").toUpperCase()} • {(alarm.machine_types || []).join(", ")}
      </p>

      <Field label="Symptoms" value={alarm.symptoms} />
      <Field label="Cause" value={alarm.cause} />
      <Field label="Operator Action / Fix" value={alarm.operator_action} />
      <Field label="When to Escalate" value={alarm.when_to_escalate} />
      <Field label="Safety Concerns" value={alarm.safety_concerns} />
      <Field label="Notes" value={alarm.notes} />
    </main>
  );
}
