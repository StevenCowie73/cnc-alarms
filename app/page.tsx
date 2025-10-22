export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "40px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>CNC Alarm Assistant</h1>
      <p style={{ opacity: 0.8 }}>New UI shell deployed via Vercel (ui-refresh)</p>

      <div style={{ marginTop: "2rem" }}>
        <input
          style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
          placeholder="Type an alarm code or symptom…"
        />
      </div>

      <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "2rem" }}>
        Independent third-party service. Not affiliated with Yamazaki Mazak.
      </p>
    </main>
  );
}
