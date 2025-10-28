'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type AnyObj = Record<string, any>;

export default function AlarmPage() {
  const { code } = useParams<{ code: string }>();
  const [alarm, setAlarm] = useState<AnyObj | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    fetch('/web_alarms.json', { cache: 'no-store' })

      .then(r => r.json())
      .then(data => {
        if (off) return;
        const list: AnyObj[] = Array.isArray(data) ? data : (data.alarms || []);
        setAlarm(list.find(a => String(a.code) === String(code)) || null);
      })
      .catch(e => setError(String(e)));
    return () => { off = true; };
  }, [code]);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {String(code)}</h1>
        <p style={{ color: 'tomato' }}>Failed to load /alarms.json: {error}</p>
      </main>
    );
  }

  if (!alarm) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Alarm {String(code)}</h1>
        <p>Loading… or not found.</p>
      </main>
    );
  }

  const meta = [
    alarm.category || 'Uncategorized',
    (alarm.severity || '').toUpperCase(),
    Array.isArray(alarm.machine_types) ? alarm.machine_types.join(', ') : (alarm.machine_types || '')
  ].filter(Boolean).join(' • ');

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 24 }}>
      <a href="/" style={{ fontSize: 12, opacity: 0.7 }}>← Back to Alarm Intelligence Hub</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        {alarm.code} — {alarm.name || 'Unnamed Alarm'}
      </h1>
      {meta && <p style={{ opacity: 0.8, marginTop: 4 }}>{meta}</p>}

      {/* show EVERY field */}
      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {Object.entries(alarm).map(([k, v]) => (
          <div key={k} style={{ background: '#111', padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{k}</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
