import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Button, Pill } from "@/components/ui";

export default function NotFound() {
  return (
    <AppShell>
      <div className="card-strong p-8">
        <div className="flex items-center gap-2">
          <Pill tone="red">404</Pill>
          <Pill tone="neutral">Not found</Pill>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
          That page doesn’t exist.
        </h1>
        <p className="mt-2 text-sm muted max-w-xl">
          Either the quiz was deleted from this browser, or the URL is wrong.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <Link href="/">
            <Button>Back home</Button>
          </Link>
          <Link href="/create">
            <Button variant="secondary">Create a quiz</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

