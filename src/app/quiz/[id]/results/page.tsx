"use client";

import React, { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Divider, Input, Pill, Stat, Toast, useMounted } from "@/components/ui";
import { getPlays, getQuiz } from "@/lib/quizStore";
import { formatTime } from "@/lib/utils";
import FinishCelebration from "@/components/FinishCelebration";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Tab = "All" | "Found" | "Missed";

export default function ResultsPage() {
  const mounted = useMounted();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();

  const quizId = params?.id;
  const rid = sp.get("rid");

  const quiz = mounted ? getQuiz(quizId) : null;
  const plays = mounted ? getPlays() : [];
  const result = rid ? plays.find((p) => p.id === rid) : null;

  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [reveal, setReveal] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
  const [celebrate, setCelebrate] = useState(true);

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1400);
  }

  const foundSet = useMemo(() => new Set(result?.foundIds ?? []), [result?.foundIds]);

  const derived = useMemo(() => {
    if (!quiz || !result) return null;

    const total = result.totalCount;
    const found = result.foundCount;
    const missed = total - found;

    const endedReason = (result as any).endedReason as string | undefined;
    const revealAll = Boolean((result as any).revealAll);

    const headline =
      result.scorePct === 100 ? "Perfect."
      : result.scorePct >= 85 ? "Elite."
      : result.scorePct >= 60 ? "Nice run."
      : "Keep grinding.";

    const subtitle =
      endedReason === "giveup"
        ? "You gave up. We’ll show everything you missed."
        : endedReason === "time"
          ? "Time ran out. Still respectable."
          : endedReason === "complete"
            ? "You cleared the board."
            : "Result saved.";

    return { total, found, missed, headline, subtitle, revealAll, endedReason };
  }, [quiz, result]);

  const list = useMemo(() => {
    if (!quiz || !result) return [];

    const needle = q.trim().toLowerCase();

    const rows = quiz.items.map((it) => {
      const found = foundSet.has(it.id);
      return {
        id: it.id,
        prompt: it.prompt || "—",
        answer: it.answer,
        found,
      };
    });

    const filtered = rows.filter((r) => {
      if (tab === "Found" && !r.found) return false;
      if (tab === "Missed" && r.found) return false;

      if (!needle) return true;
      return (
        r.answer.toLowerCase().includes(needle) ||
        r.prompt.toLowerCase().includes(needle)
      );
    });

    return filtered;
  }, [quiz, result, foundSet, tab, q]);

  if (!mounted) return <AppShell><div className="card p-6">Loading…</div></AppShell>;

  if (!quiz) {
    return (
      <AppShell>
        <div className="card-strong p-6">
          <div className="text-xl font-black">Quiz not found.</div>
          <div className="mt-4">
            <Button onClick={() => router.push("/")}>Back home</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell>
        <div className="card-strong p-6">
          <div className="text-xl font-black">Result not found.</div>
          <div className="text-sm muted mt-1">This result might be from a different browser.</div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => router.push(`/quiz/${quiz.id}`)}>Quiz details</Button>
            <Button onClick={() => router.push(`/quiz/${quiz.id}/play`)}>Play</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const shouldRevealAll = reveal || derived?.revealAll || derived?.endedReason === "giveup";

  return (
    <AppShell
      right={
        <div className="hidden sm:flex items-center gap-2">
          <Pill tone="neutral">{quiz.category}</Pill>
          <Pill tone="blue">{quiz.difficulty}</Pill>
        </div>
      }
    >
      <Toast show={toast.show} message={toast.msg} />

      {/* Satisfying finish overlay */}
      <FinishCelebration
        show={celebrate}
        scorePct={result.scorePct}
        subtitle={derived?.subtitle}
        onDone={() => setCelebrate(false)}
      />

      {/* Hero card */}
      <div className="card-strong p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue">Results</Pill>
              <Pill tone="neutral">{result.foundCount}/{result.totalCount}</Pill>
              <Pill tone="neutral">{formatTime(result.durationSec)} played</Pill>
              {result.playerName ? <Pill tone="neutral">{result.playerName}</Pill> : null}
              {(result as any).endedReason ? (
                <Pill tone="neutral">{String((result as any).endedReason)}</Pill>
              ) : null}
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
              {derived?.headline} <span className="text-[#1D4ED8]">{result.scorePct}%</span>
            </h1>

            <div className="mt-2 text-sm muted max-w-2xl">
              {derived?.subtitle}
            </div>

            <div className="mt-4 h-2.5 w-full max-w-xl rounded-full bg-[rgba(15,23,42,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#16A34A]"
                style={{ width: `${Math.max(0, Math.min(100, result.scorePct))}%`, transition: "width 420ms ease" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push(`/quiz/${quiz.id}`)}>Details</Button>
            <Button onClick={() => router.push(`/quiz/${quiz.id}/play`)}>Replay</Button>
          </div>
        </div>

        <Divider />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Score" value={`${result.scorePct}%`} />
          <Stat label="Correct" value={`${result.foundCount}/${result.totalCount}`} />
          <Stat
            label="Time"
            value={formatTime(result.durationSec)}
            sub={`Limit: ${formatTime(result.timeLimitSec)}`}
          />
        </div>
      </div>

      {/* Answers section */}
      <div className="mt-5 card-strong p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">Answer board</div>
            <div className="text-xs muted mt-0.5">
              {shouldRevealAll
                ? "All answers are revealed. Missed ones are marked."
                : "Missed answers are hidden until you reveal them."}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search prompt or answer…"
              className="sm:w-[300px]"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setTab("All")}
                className={[
                  "h-10 px-4 rounded-[18px] border text-sm font-semibold transition",
                  tab === "All"
                    ? "bg-[rgba(37,99,235,0.10)] border-[rgba(37,99,235,0.24)]"
                    : "bg-white strong-border hover:bg-[rgba(15,23,42,0.02)]",
                ].join(" ")}
              >
                All
              </button>
              <button
                onClick={() => setTab("Found")}
                className={[
                  "h-10 px-4 rounded-[18px] border text-sm font-semibold transition",
                  tab === "Found"
                    ? "bg-[rgba(22,163,74,0.10)] border-[rgba(22,163,74,0.24)]"
                    : "bg-white strong-border hover:bg-[rgba(15,23,42,0.02)]",
                ].join(" ")}
              >
                Found
              </button>
              <button
                onClick={() => setTab("Missed")}
                className={[
                  "h-10 px-4 rounded-[18px] border text-sm font-semibold transition",
                  tab === "Missed"
                    ? "bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.24)]"
                    : "bg-white strong-border hover:bg-[rgba(15,23,42,0.02)]",
                ].join(" ")}
              >
                Missed
              </button>
            </div>

            {!shouldRevealAll ? (
              <Button
                variant="secondary"
                onClick={() => setReveal(true)}
              >
                Reveal answers
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  // Copy missed answers to clipboard (nice practical feature)
                  const missed = quiz.items.filter((it) => !foundSet.has(it.id)).map((it) => it.answer);
                  navigator.clipboard
                    .writeText(missed.join("\n"))
                    .then(() => showToast("Missed answers copied."))
                    .catch(() => showToast("Couldn’t copy."));
                }}
              >
                Copy missed
              </Button>
            )}
          </div>
        </div>

        <Divider />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((row) => {
            const isHiddenMiss = !row.found && !shouldRevealAll;
            return (
              <div
                key={row.id}
                className={[
                  "rounded-[18px] border px-4 py-3 transition",
                  row.found
                    ? "bg-[rgba(22,163,74,0.08)] border-[rgba(22,163,74,0.22)]"
                    : shouldRevealAll
                      ? "bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.18)]"
                      : "bg-white strong-border",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs muted font-semibold truncate">{row.prompt}</div>
                    <div className="mt-1 text-sm font-extrabold truncate">
                      {row.found
                        ? row.answer
                        : isHiddenMiss
                          ? "••••••••••"
                          : row.answer}
                    </div>
                  </div>

                  <Pill tone={row.found ? "green" : shouldRevealAll ? "red" : "neutral"}>
                    {row.found ? "Found" : shouldRevealAll ? "Missed" : "Hidden"}
                  </Pill>
                </div>
              </div>
            );
          })}

          {list.length === 0 ? (
            <div className="card p-6 sm:col-span-2">
              <div className="text-lg font-extrabold">Nothing matches.</div>
              <div className="text-sm muted mt-1">Try a different search or tab.</div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="secondary" onClick={() => router.push("/")}>Browse</Button>
          <Button onClick={() => router.push(`/quiz/${quiz.id}/play`)}>Replay</Button>
        </div>
      </div>
    </AppShell>
  );
}

