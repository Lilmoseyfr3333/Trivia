"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Button, Pill } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep it quiet; no noisy logs in UI.
    console.error(error);
  }, [error]);

  return (
    <AppShell>
      <div className="card-strong p-8">
        <div className="flex items-center gap-2">
          <Pill tone="red">Error</Pill>
          <Pill tone="neutral">Something broke</Pill>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
          We hit a bug.
        </h1>
        <p className="mt-2 text-sm muted max-w-xl">
          Try refreshing, or reset this page. If it keeps happening, it’s probably a code issue (not you).
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Back home</Button>
          </Link>
        </div>

        <div className="mt-6 card p-4">
          <div className="text-xs muted font-semibold">Debug</div>
          <div className="mt-1 text-xs font-mono whitespace-pre-wrap break-words">
            {error.message}
          </div>
          {error.digest ? (
            <div className="mt-1 text-xs muted">digest: {error.digest}</div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

