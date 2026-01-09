// src/app/create/page.tsx
import { Suspense } from "react";
import CreateClient from "./CreateClient";

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="card-strong p-6">
            <div className="text-lg font-extrabold">Loading creator…</div>
            <div className="text-sm muted mt-1">Warming up the clipboard goblin.</div>
          </div>
        </div>
      }
    >
      <CreateClient />
    </Suspense>
  );
}

