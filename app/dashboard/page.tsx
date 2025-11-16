"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Not logged in → send to login
        router.replace("/login");
      } else {
        setEmail(data.user.email || "");
      }
    };

    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function goToAlarms() {
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">
          You are logged in with:
        </p>
        <p className="text-lg font-semibold text-blue-300 mb-8">
          {email}
        </p>

        <div className="space-y-4">
          <button
            onClick={goToAlarms}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition"
          >
            Enter Alarm Intelligence Hub
          </button>

          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition"
          >
            Sign Out
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          This is your account area. In the future, this will show your saved
          alarms, notes, and team activity.
        </p>
      </div>
    </div>
  );
}
