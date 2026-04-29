"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
      } else {
        setEmail(data.user.email || "");
        setLoading(false);
      }
    };
    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <span className="mono-label muted">Loading…</span>
      </div>
    );
  }

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
          <span className="mono-label muted">Account</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-[560px]">
          <span className="mono-label muted block mb-3">§ Account</span>
          <h1 className="font-[family-name:var(--font-serif)] text-[44px] leading-[1.05] tracking-[-0.022em] mb-3">
            Dashboard
          </h1>
          <p className="font-[family-name:var(--font-serif)] text-[16px] text-[var(--ink-70)] mb-10 max-w-[60ch]">
            Signed in as{" "}
            <span className="font-[family-name:var(--font-mono)] text-[var(--ink)]">
              {email}
            </span>
            . Saved alarms, notes, and team activity will appear here in a future
            release.
          </p>

          <div className="border-t border-[var(--ink-15)] pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--ink-15)]">
              <div className="bg-[var(--paper-2)] p-5">
                <span className="mono-label muted block mb-2">Saved alarms</span>
                <span className="font-[family-name:var(--font-mono)] text-[28px] font-medium tabular-nums">
                  00
                </span>
              </div>
              <div className="bg-[var(--paper-2)] p-5">
                <span className="mono-label muted block mb-2">Notes</span>
                <span className="font-[family-name:var(--font-mono)] text-[28px] font-medium tabular-nums">
                  00
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 bg-[var(--ink)] text-[var(--paper)] py-3 px-5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-center hover:bg-[var(--ink-90)] transition-colors"
            >
              Enter alarm hub
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 border border-[var(--ink-15)] py-3 px-5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase hover:border-[var(--ink)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
