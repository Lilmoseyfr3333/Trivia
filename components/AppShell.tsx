"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Pill, cn } from "./ui";
import { useAuthState } from "@/app/providers";
import { fetchMyQuizzes } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const auth = useAuthState();
  const [myOpen, setMyOpen] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!auth.userId) {
        setMyQuizzes([]);
        return;
      }
      const qs = await fetchMyQuizzes();
      if (!alive) return;
      setMyQuizzes(qs.map((q) => ({ id: q.id, title: q.title })));
    })();
    return () => {
      alive = false;
    };
  }, [auth.userId]);

  const initials = useMemo(() => {
    const e = auth.email ?? "";
    if (!e) return "U";
    return e.slice(0, 1).toUpperCase();
  }, [auth.email]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 glass border-b strong-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-[16px] grid place-items-center",
                "bg-gradient-to-b from-[rgba(37,99,235,0.20)] to-[rgba(29,78,216,0.08)]",
                "border strong-border shadow-[0_14px_30px_rgba(37,99,235,0.12)]"
              )}
            >
              <span className="text-[15px] font-black text-[#1D4ED8]">BT</span>
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold text-[#0F172A]">
                Basketball Trivia Studio
              </div>
              <div className="text-xs muted">Play free • Create with an account</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 relative">
            {right}

            {/* My Quizzes dropdown (only when authed) */}
            {auth.userId ? (
              <div className="relative">
                <button
                  onClick={() => setMyOpen((v) => !v)}
                  className="h-9 px-3 rounded-[18px] border strong-border bg-white hover:bg-[rgba(15,23,42,0.02)] text-sm font-semibold"
                >
                  My Quizzes ▾
                </button>

                {myOpen ? (
                  <div className="absolute right-0 mt-2 w-[320px] card-strong p-2">
                    <div className="px-2 py-2 flex items-center justify-between">
                      <div className="text-xs muted font-semibold">Your quizzes</div>
                      <Link href="/create">
                        <Button size="sm">Create</Button>
                      </Link>
                    </div>

                    <div className="max-h-[320px] overflow-auto">
                      {myQuizzes.length ? (
                        myQuizzes.map((q) => (
                          <Link
                            key={q.id}
                            href={`/quiz/${q.id}`}
                            className="block px-3 py-2 rounded-[16px] hover:bg-[rgba(15,23,42,0.04)] text-sm font-semibold"
                            onClick={() => setMyOpen(false)}
                          >
                            {q.title || "Untitled"}
                          </Link>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm muted">
                          No quizzes yet. Make one.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Auth area */}
            {!auth.userId ? (
              <Link href="/auth">
                <Button size="sm">Sign in</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/create">
                  <Button size="sm">Create</Button>
                </Link>
                <Link href="/profile" className="h-9 w-9 rounded-[16px] grid place-items-center border strong-border bg-white">
                  <span className="text-sm font-black text-[#1D4ED8]">{initials}</span>
                </Link>
                <button
                  className="h-9 px-3 rounded-[18px] border strong-border bg-white hover:bg-[rgba(15,23,42,0.02)] text-sm font-semibold"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    location.href = "/";
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

