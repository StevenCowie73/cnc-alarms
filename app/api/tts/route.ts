import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ElevenLabs text-to-speech proxy for the alarm-detail "Read aloud"
// button — mirrors the mazatrol-assistant implementation. The key stays
// server-side; the client posts text and gets an audio/mpeg stream back.
// If anything fails here the client falls back to the browser's Web
// Speech API silently.
//
// Voice: "Daniel" — ElevenLabs premade, authoritative and clear; chosen
// for machinists listening on a noisy shop floor. eleven_turbo_v2_5 is
// multilingual, so the ES transcript works with the same voice.
const VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const MODEL_ID = "eleven_turbo_v2_5";
const MAX_TTS_CHARS = 4000;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS not configured." }, { status: 503 });
  }

  let text: string;
  try {
    const body = await req.json();
    text = String(body.text ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Nothing to read." }, { status: 400 });
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, MAX_TTS_CHARS),
        model_id: MODEL_ID,
        voice_settings: { stability: 0.6, similarity_boost: 0.8 },
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "TTS unavailable." }, { status: 502 });
  }

  // Pass the audio stream straight through so playback can begin before
  // the full clip is generated.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
