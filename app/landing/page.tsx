import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      {/* Masthead */}
      <header className="border-b border-[var(--ink-15)]">
        <div className="px-8 py-4 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-[22px] font-medium"
          >
            <span className="text-[var(--critical)] mr-1">·</span>cowie · alarms
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
            >
              Alarm reference
            </Link>
            <a
              href="#pricing"
              className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[var(--ink-15)]">
        <div className="max-w-[1100px] mx-auto px-8 py-24 md:py-32 grid md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8">
            <span className="mono-label muted block mb-5">§ 24/7 phone support · cowie.ai</span>
            <h1 className="font-[family-name:var(--font-serif)] text-[clamp(48px,6vw,84px)] leading-[1.02] tracking-[-0.022em] mb-8">
              CNC down at 2 a.m.<br />
              <span className="text-[var(--ink-50)] italic">Pick up the phone.</span>
            </h1>
            <p className="font-[family-name:var(--font-serif)] text-[18px] leading-[1.55] text-[var(--ink-90)] max-w-[60ch] mb-10">
              An AI phone line that knows every Mazak alarm code by heart, paired
              with a searchable reference of 1,200+ codes — so an operator never
              has to thumb through a manual with greasy hands again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+13184089163"
                className="bg-[var(--ink)] text-[var(--paper)] py-4 px-6 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase hover:bg-[var(--ink-90)] transition-colors text-center"
              >
                Call +1 318 408 9163
              </a>
              <Link
                href="/"
                className="border border-[var(--ink-15)] py-4 px-6 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase hover:border-[var(--ink)] transition-colors text-center"
              >
                Browse alarm codes
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 md:border-l md:border-[var(--ink-15)] md:pl-8">
            <span className="mono-label muted block mb-3">§ One hour of downtime</span>
            <p className="font-[family-name:var(--font-serif)] text-[20px] leading-[1.4] text-[var(--ink-90)]">
              <span className="font-[family-name:var(--font-mono)] text-[var(--ink)]">$300–500</span>{" "}
              of prevented downtime pays for two to three months of service.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[var(--ink-15)]">
        <div className="max-w-[1100px] mx-auto px-8 py-20">
          <span className="mono-label muted block mb-6">§ 02 · What it is</span>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--ink-15)]">
            <div className="bg-[var(--paper)] p-8">
              <span className="font-[family-name:var(--font-mono)] text-[14px] font-medium block mb-3">
                01
              </span>
              <h3 className="font-[family-name:var(--font-serif)] text-[22px] leading-[1.2] tracking-[-0.01em] mb-3">
                24/7 AI phone line
              </h3>
              <p className="font-[family-name:var(--font-serif)] text-[15px] leading-[1.55] text-[var(--ink-70)]">
                Call from the shop floor and walk through the recovery while the
                machine is still warm. The line understands alarm codes without
                you having to spell them.
              </p>
            </div>
            <div className="bg-[var(--paper)] p-8">
              <span className="font-[family-name:var(--font-mono)] text-[14px] font-medium block mb-3">
                02
              </span>
              <h3 className="font-[family-name:var(--font-serif)] text-[22px] leading-[1.2] tracking-[-0.01em] mb-3">
                1,200+ alarm reference
              </h3>
              <p className="font-[family-name:var(--font-serif)] text-[15px] leading-[1.55] text-[var(--ink-70)]">
                Every Mazak NC code with cause, recovery steps, and a decoded
                codebook for type / stop status / clearing procedure. Severity is
                classified, not guessed.
              </p>
            </div>
            <div className="bg-[var(--paper)] p-8">
              <span className="font-[family-name:var(--font-mono)] text-[14px] font-medium block mb-3">
                03
              </span>
              <h3 className="font-[family-name:var(--font-serif)] text-[22px] leading-[1.2] tracking-[-0.01em] mb-3">
                Read-aloud, EN / ES
              </h3>
              <p className="font-[family-name:var(--font-serif)] text-[15px] leading-[1.55] text-[var(--ink-70)]">
                Hands busy or covered in coolant. Tap the readout button and the
                cause and action speak themselves, in English or Spanish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-[var(--ink-15)]">
        <div className="max-w-[1100px] mx-auto px-8 py-20">
          <span className="mono-label muted block mb-6">§ 03 · Pricing</span>
          <h2 className="font-[family-name:var(--font-serif)] text-[clamp(36px,4.4vw,56px)] leading-[1.04] tracking-[-0.022em] mb-12 max-w-[18ch]">
            Two tiers. Honest.
          </h2>

          <div className="grid md:grid-cols-2 gap-px bg-[var(--ink-15)]">
            {/* Free */}
            <div className="bg-[var(--paper)] p-10">
              <div className="flex items-baseline justify-between mb-6">
                <span className="mono-label">Free</span>
                <span className="mono-label muted">Try before you commit</span>
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[44px] font-medium tabular-nums mb-1">
                $0
                <span className="text-[14px] text-[var(--ink-50)] tracking-normal ml-1">/ month</span>
              </div>
              <div className="border-t border-[var(--ink-15)] mt-6 pt-6">
                <ul className="space-y-3">
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--ink-50)] text-[12px] mt-1">✓</span>
                    3 AI phone calls per month
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--ink-50)] text-[12px] mt-1">✓</span>
                    Access to first 50 alarm codes
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--ink-50)] text-[12px] mt-1">✓</span>
                    Basic troubleshooting
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3 text-[var(--ink-50)]">
                    <span className="font-[family-name:var(--font-mono)] text-[12px] mt-1">—</span>
                    Full alarm database
                  </li>
                </ul>
              </div>
              <a
                href="tel:+13184089163"
                className="block mt-8 border border-[var(--ink-15)] py-3 px-5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-center hover:border-[var(--ink)] transition-colors"
              >
                Start free — call now
              </a>
            </div>

            {/* Pro */}
            <div className="bg-[var(--ink)] text-[var(--paper)] p-10">
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase font-medium">
                  Pro
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-[var(--ink-30)]">
                  Most popular
                </span>
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[44px] font-medium tabular-nums mb-1">
                $199
                <span className="text-[14px] text-[var(--ink-30)] tracking-normal ml-1">/ month</span>
              </div>
              <div className="border-t border-[rgba(241,237,228,0.15)] mt-6 pt-6">
                <ul className="space-y-3">
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--warning)] text-[12px] mt-1">✓</span>
                    Unlimited AI phone calls 24/7
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--warning)] text-[12px] mt-1">✓</span>
                    Full reference (1,200+ codes)
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--warning)] text-[12px] mt-1">✓</span>
                    Priority phone support
                  </li>
                  <li className="font-[family-name:var(--font-serif)] text-[15px] flex gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-[var(--warning)] text-[12px] mt-1">✓</span>
                    Saved alarms &amp; team notes
                  </li>
                </ul>
              </div>
              <a
                href="mailto:info@cowie.ai?subject=Pro%20Plan%20Signup"
                className="block mt-8 bg-[var(--paper)] text-[var(--ink)] py-3 px-5 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.16em] uppercase text-center hover:bg-[var(--paper-3)] transition-colors"
              >
                Get Pro access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-b border-[var(--ink-15)] bg-[var(--paper-2)]">
        <div className="max-w-[1100px] mx-auto px-8 py-20">
          <span className="mono-label muted block mb-6">§ 04 · Contact</span>
          <h2 className="font-[family-name:var(--font-serif)] text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.022em] mb-3 max-w-[20ch]">
            Questions about pricing or fit?
          </h2>
          <p className="font-[family-name:var(--font-serif)] text-[16px] text-[var(--ink-70)] mb-8 max-w-[60ch]">
            Email us. Response within two hours during business hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-x-12 gap-y-4">
            <a
              href="mailto:info@cowie.ai"
              className="font-[family-name:var(--font-mono)] text-[18px] font-medium border-b border-[var(--ink-30)] hover:border-[var(--ink)] hover:text-[var(--critical)] transition-colors pb-1 self-start no-underline"
            >
              info@cowie.ai
            </a>
            <a
              href="tel:+13184089163"
              className="font-[family-name:var(--font-mono)] text-[18px] font-medium border-b border-[var(--ink-30)] hover:border-[var(--ink)] hover:text-[var(--critical)] transition-colors pb-1 self-start no-underline"
            >
              +1 318 408 9163
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 flex flex-col sm:flex-row justify-between gap-3 bg-[var(--paper)]">
        <span className="mono-label muted">
          cowie.ai · independent third-party · not affiliated with Yamazaki Mazak
        </span>
        <div className="flex gap-5">
          <Link href="/" className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline">
            Reference
          </Link>
          <Link href="/login" className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline">
            Sign in
          </Link>
          <a
            href="mailto:info@cowie.ai"
            className="mono-label text-[var(--ink-50)] hover:text-[var(--ink)] no-underline"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
