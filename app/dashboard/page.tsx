// app/dashboard/page.tsx
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
        router.replace("/login"); // not logged in
      } else {
        setEmail(data.user.email || "");
      }
    };

    load();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome</h1>
        <p className="text-lg opacity-80 mb-6">{email}</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
