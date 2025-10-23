export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Alarm Intelligence Hub</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        New UI shell. Open a specific alarm, e.g. <code>/alarm/113</code>.
      </p>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 24 }}>
        Independent third-party service. Not affiliated with Yamazaki Mazak.
      </p>
    </main>
  );
}
