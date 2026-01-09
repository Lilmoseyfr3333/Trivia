"use client";

import Link from "next/link";
import React from "react";
import { Button, Pill, cn } from "@/components/ui";

export default function AppShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
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
              <div className="text-xs muted">Sporcle-style play • clean premium UI</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {right}
            <Link href="/create">
              <Button size="sm">Create quiz</Button>
            </Link>
            <Link href="/profile" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm">Profile</Button>
            </Link>
            <Link href="/auth" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mt-10 card px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">Built for speed.</div>
            <div className="text-xs muted mt-0.5">
              Tip: type answers and press <span className="font-bold">Enter</span>.
            </div>
          </div>
          <div className="flex gap-2">
            <Pill tone="blue">Play</Pill>
            <Pill tone="green">Create</Pill>
            <Pill tone="neutral">Score</Pill>
          </div>
        </div>
      </footer>
    </div>
  );
}

