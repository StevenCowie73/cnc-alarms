"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  // If already logged in → go straight to dashboard
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
      }
    }
    checkSession();
  }, [router]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending magic link…");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatus("Error sending link. Try again.");
    } else {
      setStatus("Magic link sent! Check your email.");
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0B1622] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Login</h1>

        <form onSubmit={sendMagicLink} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="
              w-full 
              p-4 
              rounded-xl 
              text-gray-900 
              placeholder-gray-600
              border border-gray-400
              focus:outline-none 
              focus:ring-2 
              focus:ring-blue-500 
              focus:border-blue-500
              text-lg
            "
          />

          <button
            type="submit"
            className="
              w-full 
              bg-blue-600 
              hover:bg-blue-700 
              text-white 
              font-semibold 
              py-4 
              rounded-xl 
              text-lg 
              transition
            "
          >
            Send Magic Link
          </button>

          {status && (
            <p className="text-center text-gray-700 mt-3 font-medium">
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
