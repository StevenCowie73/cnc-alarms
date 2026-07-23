"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--ink-15)]">
        <div className="px-8 py-4 flex items-center justify-between">
          <Link href="/" className="brandmark">
            cowie · alarms
          </Link>
          <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-[var(--ink-50)]">
            Sign in
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col items-center text-center mb-10">
            <span className="brandmark brandmark--stack">ALARMS</span>
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[var(--ink-50)] mt-2">
              CNC fault lookup
            </span>
          </div>

          <h1 className="text-[28px] font-semibold tracking-[-0.015em] mb-3">
            Sign in
          </h1>
          <p className="text-[15px] leading-[1.55] text-[var(--ink-70)] mb-8 max-w-[42ch]">
            Enter your email and we&rsquo;ll send a one-time magic link. No password,
            no sign-up form.
          </p>

          {sent ? (
            <div className="surface-card p-5">
              <div className="mono-label mb-2 text-[var(--notice)]">
                Magic link sent
              </div>
              <p className="text-[15px] leading-[1.55] text-[var(--ink-90)]">
                Check <span className="font-[family-name:var(--font-mono)]">{email}</span>{" "}
                for a sign-in link. It expires in 60 minutes.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMagicLink();
              }}
              className="flex flex-col gap-5"
            >
              <label className="flex flex-col gap-2.5">
                <span className="field-label">Shop email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@shop.com"
                  className="field-input"
                />
              </label>

              {error && (
                <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--critical)]">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-accent">
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}

          <div className="mt-10 pt-6 border-t border-[var(--ink-15)] flex justify-between items-center">
            <Link
              href="/"
              className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
            >
              ← Back to alarms
            </Link>
            <a
              href="tel:+13184089163"
              className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
            >
              Call support
            </a>
          </div>

          <p className="mt-8 text-center text-[13px] leading-[1.5] text-[var(--ink-40)]">
            Faulted right now and locked out?
            <br />
            <a href="tel:+13184089163" className="font-semibold">
              Call support — no login needed
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
