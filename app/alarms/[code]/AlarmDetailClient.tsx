"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Alarm } from "@/lib/alarms";
import { AlarmDetail } from "@/app/components/AlarmDetail";

const RECENT_KEY = "hub.recent";

// Thin interactive shell around the server-rendered alarm detail. The alarm
// content itself arrives as props from the Server Component page, so it is
// in the HTML on first request; this component only adds the bits that need
// a browser: EN/ES toggle, read-aloud, Recent tracking, and Back.
export function AlarmDetailClient({ alarm }: { alarm: Alarm }) {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "es">("en");
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const storedLang = window.localStorage.getItem("hub.lang");
    if (storedLang === "en" || storedLang === "es") setLang(storedLang);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hub.lang", lang);
  }, [lang]);

  // Any visit to an alarm page (from the hub, a search result, or straight
  // from Google) counts as a recent lookup.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const prev: unknown = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(prev) ? prev.filter((x) => typeof x === "number") : [];
      const next = [alarm.code, ...list.filter((c) => c !== alarm.code)].slice(0, 5);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [alarm.code]);

  // Read aloud: ElevenLabs TTS via /api/tts (voice "Daniel", streamed),
  // falling back silently to the browser's Web Speech API if the call fails.
  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  function speakWebSpeech(text: string) {
    if (!("speechSynthesis" in window)) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-MX" : "en-US";
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  async function speak(text: string) {
    if (speaking) {
      stopSpeaking();
      return;
    }
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => stopSpeaking();
      audio.onerror = () => stopSpeaking();
      await audio.play();
    } catch {
      audioRef.current = null;
      speakWebSpeech(text);
    }
  }

  const back = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  return (
    <AlarmDetail
      alarm={alarm}
      lang={lang}
      onLang={setLang}
      onSpeak={speak}
      speaking={speaking}
      onBack={back}
    />
  );
}
