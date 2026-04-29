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
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-[22px] font-medium"
          >
            <span className="text-[var(--critical)] mr-1">·</span>cowie · alarms
          </Link>
          <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-[var(--ink-50)]">
            Sign in
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px]">
          <span className="mono-label muted block mb-3">§ Operator access</span>
          <h1 className="font-[family-name:var(--font-serif)] text-[44px] leading-[1.05] tracking-[-0.022em] mb-3">
            Sign in
          </h1>
          <p className="font-[family-name:var(--font-serif)] text-[16px] text-[var(--ink-70)] mb-10 max-w-[40ch]">
            Enter your email and we&rsquo;ll send a one-time magic link. No password,
            no sign-up form.
          </p>

          {sent ? (
            <div className="border border-[var(--ink-15)] p-5 bg-[var(--paper-2)]">
              <div className="mono-label mb-2">Magic link sent</div>
              <p className="font-[family-name:var(--font-serif)] text-[15px] text-[var(--ink-90)]">
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
              className="flex flex-col gap-6"
            >
              <label className="flex flex-col gap-2">
                <span className="mono-label muted">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@shop.example"
                  className="bg-transparent border-0 border-b border-[var(--ink-30)] focus:border-[var(--ink)] focus:outline-none py-2 font-[family-name:var(--font-serif)] text-[16px] text-[var(--ink)] placeholder:italic placeholder:text-[var(--ink-40)]"
                />
              </label>

              {error && (
                <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--critical)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-[var(--ink)] text-[var(--paper)] py-3 px-5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase hover:bg-[var(--ink-90)] disabled:opacity-60 disabled:cursor-wait transition-colors"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}

          <div className="mt-12 pt-6 border-t border-[var(--ink-15)] flex justify-between items-center">
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
        </div>
      </main>
    </div>
  );
}
