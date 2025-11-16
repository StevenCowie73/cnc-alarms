import { createClient } from "@supabase/supabase-js";

// NOTE:
// For now we hard-code these so Vercel can't mess up env vars.
// These values are public anyway (they ship to the browser).

const supabaseUrl = "https://wsqssgptujdkhkjcbkrl.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcXNzZ3B0dWpka2hramNia3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDk0ODgsImV4cCI6MjA3ODgyNTQ4OH0.AYnsj1OCAH7XRf7f3eckATYQjyE6fe3PxfSHtGONcjc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
