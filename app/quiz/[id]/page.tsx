"use client";

import React, { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Divider, Pill, Stat, Toast, useMounted } from "@/components/ui";
import { copyToClipboard } from "@/lib/utils";
import { deleteQuiz, getPlaysForQuiz, getQuiz } from "@/lib/quizStore";
import { useParams, useRouter } from "next/navigation";

export default function QuizDetailPage() {
  const mounted = useMounted();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1500);
  }

  const quiz = mounted ? getQuiz(id) : null;
  const plays = mounted && quiz ? getPlaysForQuiz(quiz.id) : [];

  const stats = useMemo(() => {
    if (!quiz) return null;
    const playsCount = plays.length;
    const bestPct = playsCount ? Math.max(...plays.map((p) => p.scorePct)) : null;
    const avgPct = playsCount ? Math.round(plays.reduce((s, p) => s + p.scorePct, 0) / playsCount) : null;
    return { playsCount, bestPct, avgPct };
  }, [quiz, plays]);

  if (!mounted) return <AppShell><div className="card p-6">Loading…</div></AppShell>;

  if (!quiz) {
    return (
      <AppShell>
        <div className="card-strong p-6">
          <div className="text-xl font-black">Quiz not found.</div>
          <div className="text-sm muted mt-1">It may have been deleted from this browser.</div>
          <div className="mt-4">
            <Button onClick={() => router.push("/")}>Back home</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <div className="hidden sm:flex items-center gap-2">
          <Pill tone="neutral">{quiz.category}</Pill>
          <Pill tone="blue">{quiz.difficulty}</Pill>
        </div>
      }
    >
      <Toast message={toast.msg} show={toast.show} />

      <div className="card-strong p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{quiz.title}</h1>
            <div className="mt-2 text-sm muted max-w-2xl">
              {quiz.description?.trim() ? quiz.description : "No description."}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="neutral">{quiz.items.length} answers</Pill>
              <Pill tone="neutral">{Math.round(quiz.timeLimitSec / 60)} min</Pill>
              {quiz.authorName?.trim() ? <Pill tone="neutral">by {quiz.authorName}</Pill> : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await copyToClipboard(`${location.origin}/quiz/${quiz.id}/play`);
                showToast(ok ? "Link copied." : "Couldn’t copy link.");
              }}
            >
              Copy play link
            </Button>

            <Button onClick={() => router.push(`/quiz/${quiz.id}/play`)}>Play</Button>
          </div>
        </div>

        <Divider />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Plays" value={String(stats?.playsCount ?? 0)} />
          <Stat label="Best score" value={stats?.bestPct == null ? "—" : `${stats.bestPct}%`} />
          <Stat label="Avg score" value={stats?.avgPct == null ? "—" : `${stats.avgPct}%`} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold">Answer list</div>
              <div className="text-xs muted mt-0.5">Players must type these (plus aliases).</div>
            </div>

            <Button variant="secondary" onClick={() => router.push(`/create?edit=${quiz.id}`)}>
              Edit
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quiz.items.map((it) => (
              <div key={it.id} className="card px-4 py-3">
                <div className="text-xs muted font-semibold">{it.prompt || "—"}</div>
                <div className="text-sm font-extrabold mt-1">{it.answer}</div>
                <div className="text-xs muted mt-0.5">
                  aliases: {(it.aliases || []).length ? it.aliases?.join(", ") : "none"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="text-sm font-extrabold">Danger zone</div>
            <div className="text-xs muted mt-1">Permanent. Like missed free throws.</div>

            <div className="mt-4">
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  const ok = confirm("Delete this quiz from this browser? This cannot be undone.");
                  if (!ok) return;
                  deleteQuiz(quiz.id);
                  router.push("/");
                }}
              >
                Delete quiz
              </Button>
            </div>
          </div>

          <div className="mt-4 card p-5">
            <div className="text-sm font-extrabold">Recent plays</div>
            <div className="text-xs muted mt-1">Stored locally in this browser.</div>

            <div className="mt-3 flex flex-col gap-2">
              {plays.slice(0, 6).map((p) => (
                <div key={p.id} className="border strong-border rounded-[18px] px-4 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold">{p.scorePct}%</div>
                    <div className="text-xs muted">{p.foundCount}/{p.totalCount}</div>
                  </div>
                  <div className="text-xs muted mt-1">
                    {p.playerName ? `${p.playerName} • ` : ""}
                    {new Date(p.endedAt).toLocaleString()}
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => router.push(`/quiz/${quiz.id}/results?rid=${p.id}`)}
                    >
                      View results
                    </Button>
                  </div>
                </div>
              ))}

              {plays.length === 0 ? (
                <div className="text-sm muted">No plays yet. Be the first.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

