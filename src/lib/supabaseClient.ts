// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * IMPORTANT:
 * - Vercel builds may run without env vars unless you set them in Project Settings.
 * - If env vars are missing, we keep supabase = null so the app can still build and
 *   the "play without signing up" flow still works.
 */
export const supabase: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export function supabaseEnabled() {
  return Boolean(url && anon);
}

