"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const sendMagicLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://alarms.cowie.ai/"
      }
    });

    if (!error) {
      setSent(true);
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={{
      padding: "40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "100px"
    }}>
      <h1 style={{ marginBottom: "20px", fontSize: "28px" }}>Login</h1>

      {sent ? (
        <p style={{ fontSize: "18px" }}>Check your email for the magic link.</p>
      ) : (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "14px 18px",
              width: "100%",
              maxWidth: "320px",
              border: "2px solid #ccc",
              borderRadius: "8px",
              fontSize: "18px",
              marginBottom: "14px"
            }}
          />

          <button
            onClick={sendMagicLink}
            style={{
              padding: "14px 22px",
              background: "#0070f3",
              color: "white",
              fontSize: "18px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Send Magic Link
          </button>
        </>
      )}
    </div>
  );
}
