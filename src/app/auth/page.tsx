"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Input, Pill, Textarea, Toast } from "@/components/ui";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { upsertMyProfile } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const enabled = supabaseEnabled();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1600);
  }

  async function submit() {
    if (!enabled || !supabase) {
      showToast("Auth is not configured. Add Supabase env vars on Vercel / .env.local.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        showToast("Signed in.");
        router.push("/profile");
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;

        // Upsert profile (safe even if email confirmation is enabled)
        await upsertMyProfile({ displayName, username, bio });

        showToast("Account created.");
        router.push("/profile");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Auth failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Toast show={toast.show} message={toast.msg} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-strong p-7 sm:p-8">
          <div className="flex items-center gap-2">
            <Pill tone="blue">Account</Pill>
            <Pill tone="neutral">Optional</Pill>
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
            {mode === "signin" ? "Welcome back." : "Create your profile."}
          </h1>

          <p className="mt-2 text-sm muted max-w-xl">
            You can play without signing in. Creating quizzes + saving them to your profile needs an account.
          </p>

          {!enabled ? (
            <div className="mt-4 card p-4 border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.06)]">
              <div className="text-sm font-extrabold text-[#b91c1c]">Supabase not configured.</div>
              <div className="text-xs muted mt-1">
                Add <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
                <span className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to Vercel Environment Variables
                (and restart locally after editing <span className="font-semibold">.env.local</span>).
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <Button variant={mode === "signin" ? "primary" : "secondary"} onClick={() => setMode("signin")}>
              Sign in
            </Button>
            <Button variant={mode === "signup" ? "primary" : "secondary"} onClick={() => setMode("signup")}>
              Sign up
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-bold muted mb-1.5">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>

            <div>
              <div className="text-xs font-bold muted mb-1.5">Password</div>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
            </div>

            {mode === "signup" ? (
              <>
                <div>
                  <div className="text-xs font-bold muted mb-1.5">Display name</div>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Will" />
                </div>
                <div>
                  <div className="text-xs font-bold muted mb-1.5">Username (optional)</div>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., lilmoseyfr3333" />
                </div>
                <div>
                  <div className="text-xs font-bold muted mb-1.5">Bio (optional)</div>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="One clean sentence." />
                </div>
              </>
            ) : null}

            <Button
              onClick={submit}
              disabled={busy || !enabled || !email.trim() || !pw.trim()}
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </div>
        </div>

        <div className="card p-7 sm:p-8">
          <div className="text-sm font-extrabold">What you get with an account</div>
          <div className="mt-2 text-sm muted">
            • Create quizzes and keep them under your profile<br />
            • “My Quizzes” dropdown in the header<br />
            • Saved results tied to you (instead of the browser)<br />
            • Profile summary + stats
          </div>

          <div className="mt-6 card px-5 py-4">
            <div className="text-xs muted font-semibold">Still can play as guest</div>
            <div className="mt-1 text-sm font-extrabold">
              Yep — play is public. Creation is the perk.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

