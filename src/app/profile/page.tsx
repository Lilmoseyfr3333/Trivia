"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Input, Pill, Stat, Textarea, Toast } from "@/components/ui";
import { useAuthState } from "@/app/providers";
import { fetchMyProfile, fetchMyQuizzes, upsertMyProfile } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const auth = useAuthState();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [quizCount, setQuizCount] = useState(0);

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1500);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!auth.userId) {
        setLoading(false);
        return;
      }
      const p = await fetchMyProfile();
      const qs = await fetchMyQuizzes();

      if (!alive) return;

      setDisplayName(p?.displayName ?? "");
      setUsername(p?.username ?? "");
      setBio(p?.bio ?? "");
      setQuizCount(qs.length);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [auth.userId]);

  const initials = useMemo(() => {
    const base = (displayName || auth.email || "U").trim();
    return base.slice(0, 1).toUpperCase();
  }, [displayName, auth.email]);

  async function save() {
    try {
      await upsertMyProfile({ displayName, username, bio });
      showToast("Saved.");
    } catch (e: any) {
      showToast(e?.message ?? "Couldn’t save.");
    }
  }

  if (auth.loading) {
    return <AppShell><div className="card p-6">Loading…</div></AppShell>;
  }

  if (!auth.userId) {
    return (
      <AppShell>
        <div className="card-strong p-7">
          <div className="flex items-center gap-2">
            <Pill tone="red">Not signed in</Pill>
            <Pill tone="neutral">Profile locked</Pill>
          </div>
          <div className="mt-4 text-2xl font-black">Sign in to access your profile.</div>
          <div className="mt-2 text-sm muted">You can still play quizzes without an account.</div>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => router.push("/auth")}>Go to sign in</Button>
            <Button variant="secondary" onClick={() => router.push("/")}>Back home</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toast show={toast.show} message={toast.msg} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 card-strong p-7">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[18px] grid place-items-center border strong-border bg-white">
              <span className="text-lg font-black text-[#1D4ED8]">{initials}</span>
            </div>
            <div>
              <div className="text-sm font-extrabold">{displayName || "Unnamed user"}</div>
              <div className="text-xs muted">{auth.email}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <Stat label="Your quizzes" value={String(quizCount)} />
          </div>

          <div className="mt-4">
            <Button className="w-full" onClick={() => router.push("/create")}>Create a quiz</Button>
          </div>
        </div>

        <div className="lg:col-span-2 card p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">Profile</div>
              <div className="text-xs muted mt-0.5">Keep it short. One paragraph max.</div>
            </div>
            <Button onClick={save} disabled={loading}>Save</Button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="text-xs font-bold muted mb-1.5">Display name</div>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Will" />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs font-bold muted mb-1.5">Username (optional)</div>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., willstarr" />
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs font-bold muted mb-1.5">Bio (optional)</div>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Basketball nerd. Quiz goblin. Etc." />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

