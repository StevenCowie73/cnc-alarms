# Alarm Intelligence Hub — alarms.cowie.ai

**Live:** [alarms.cowie.ai](https://alarms.cowie.ai)

A fast, searchable reference for **1,200+ Mazak CNC alarm codes**, built for the machinist standing at a stopped machine — not for someone at a desk with time to dig through a PDF manual.

Part of the [Cowie.ai](https://www.cowie.ai) suite, built by a CNC machinist with 15 years on Mazak Integrex machines. Companion product: [Mazatrol Assistant](https://mazatrol.cowie.ai), an AI diagnostic partner this app hands off to when a code needs deeper troubleshooting.

## The problem

When a Mazak control throws an alarm, the official reference is a dense PDF on a shop computer that may be nowhere near the machine. Forum threads are unreliable and often wrong for your control generation. Downtime is measured in hundreds of dollars an hour.

## What it does

- **Instant lookup** across 1,197 alarm codes — search by code, message text, or cause. All client-side: the full dataset ships to the browser, so search is instant and works on a phone at the machine with a weak shop-floor signal.
- **Severity classification derived from the manual itself** — `critical / warning / notice` is decoded from Mazak's *Stopped status* and *Display* fields, not guessed. The manual's A–S legend codes (error type, stop behavior, clearing procedure) are decoded into plain English on every detail view.
- **Actionable steps** — the manual's free-text *Action* field is split into a numbered "what to do" checklist.
- **Read-aloud** — ElevenLabs TTS through a server-side proxy (`/api/tts`, key never reaches the browser), with a silent Web Speech API fallback so audio always works. EN/ES voice locale toggle.
- **Crawlable, static alarm pages** — every alarm lives at `/alarms/{code}`, pre-rendered at build time (SSG) with a unique title, meta description, canonical URL, and FAQPage/TechArticle JSON-LD, so the cause and fix are in the raw HTML for search engines — no JavaScript needed. `/alarms` is a server-rendered index of every code; `/sitemap.xml` and `/robots.txt` are generated from the same data. Legacy `?code=` links 308-redirect to the new pages. Recent lookups persist locally.
- **AI handoff** — "Still stuck?" sends the alarm code to [Mazatrol Assistant](https://mazatrol.cowie.ai) (`?alarm=CODE`) for a grounded AI diagnosis.
- **Accounts** — passwordless magic-link auth via Supabase.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 + a token-driven dark design system (~1,400 lines of custom CSS vars) |
| Data | Static JSON (1,204 normalized alarm entries) — no database in the lookup path, by design |
| Auth | Supabase magic-link (OTP) |
| Voice | ElevenLabs `eleven_turbo_v2_5` (server-proxied, streamed `audio/mpeg`) with Web Speech fallback |
| Hosting | Vercel |

**Why client-side data?** A shop-floor tool has to be fast and resilient. Shipping the reference as a static bundle means zero lookup latency, no backend to fail, and near-offline behavior once loaded.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

Optional `.env.local`:

```
ELEVENLABS_API_KEY=   # enables cloud TTS; omit and read-aloud falls back to browser speech
```

The Supabase URL and anon (publishable) key are intentionally hard-coded in `lib/supabaseClient.ts` — they are public browser values protected by Row Level Security, not secrets.

## Structure

```
app/page.tsx          # Alarm hub: search → results → detail (deep-linkable)
app/landing/          # Marketing page
app/login/            # Magic-link sign-in
app/dashboard/        # Account page
app/api/tts/          # ElevenLabs proxy (server-side key)
lib/alarms.ts         # Data model, normalization, severity codebook
public/alarms.json    # The 1,204-entry dataset
```
