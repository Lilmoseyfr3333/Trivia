"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Divider, Input, Pill, Toast, useMounted } from "@/components/ui";
import { getQuiz, addPlay } from "@/lib/quizStore";
import { clamp, formatTime } from "@/lib/utils";
import {
  buildAcceptedSet,
  finalizeResult,
  trySubmitAnswer,
  type PlayState,
} from "@/lib/playEngine";
import { useParams, useRouter } from "next/navigation";

type EndReason = "time" | "complete" | "manual" | "giveup";

export default function PlayQuizPage() {
  const mounted = useMounted();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const quiz = mounted ? getQuiz(id) : null;

  const accepted = useMemo(
    () => (quiz ? buildAcceptedSet(quiz) : new Map<string, string>()),
    [quiz]
  );

  const [playerName, setPlayerName] = useState("");
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [revealAllOnResults, setRevealAllOnResults] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1100);
  }

  const [state, setState] = useState<PlayState>(() => ({
    startedAtISO: new Date().toISOString(),
    foundIds: new Set<string>(),
    input: "",
  }));

  const [remaining, setRemaining] = useState<number>(quiz?.timeLimitSec ?? 0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // sync timer when quiz loads
  useEffect(() => {
    if (!quiz) return;
    setRemaining(quiz.timeLimitSec);
  }, [quiz]);

  // timer loop
  useEffect(() => {
    if (!quiz) return;
    if (!started) return;
    if (ended) return;

    const startMs = Date.now();
    const baseRemaining = quiz.timeLimitSec;

    const t = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const left = clamp(baseRemaining - elapsed, 0, baseRemaining);
      setRemaining(left);

      if (left <= 0) {
        window.clearInterval(t);
        finish("time");
      }
    }, 250);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, ended, quiz?.id]);

  function start() {
    if (!quiz) return;
    setState({
      startedAtISO: new Date().toISOString(),
      foundIds: new Set<string>(),
      input: "",
    });
    setRemaining(quiz.timeLimitSec);
    setStarted(true);
    setEnded(false);
    setRevealAllOnResults(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function finish(reason: EndReason) {
    if (!quiz) return;
    if (ended) return;

    const endedAtISO = new Date().toISOString();
    const result = finalizeResult(quiz, state, endedAtISO, {
      playerName,
      endedReason: reason,
      revealAll: revealAllOnResults,
    });

    addPlay(result);

    setEnded(true);
    showToast("Saved.");
    router.push(`/quiz/${quiz.id}/results?rid=${result.id}`);
  }

  function submit() {
    if (!quiz) return;
    if (!started || ended) return;

    const raw = state.input.trim();
    if (!raw) return;

    // copy state for mutation
    const next: PlayState = {
      ...state,
      foundIds: new Set(state.foundIds),
      input: "",
      lastHit: state.lastHit,
    };

    const res = trySubmitAnswer(quiz, accepted, next, raw);
    setState(next);

    if (res.hit) showToast(`✅ ${res.answer}`);
    else if ((res as any).already) showToast("Already got it.");
    else showToast("No match.");
  }

  // auto-finish if all found
  const foundCount = state.foundIds.size;
  const totalCount = quiz?.items.length ?? 0;
  const pct = totalCount > 0 ? foundCount / totalCount : 0;

  useEffect(() => {
    if (!quiz) return;
    if (!started || ended) return;
    if (totalCount > 0 && foundCount >= totalCount) {
      finish("complete");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundCount, totalCount, started, ended, quiz?.id]);

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

  const urgency = remaining <= 15 && started && !ended;

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

      {/* Top hero */}
      <div className="card-strong p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="neutral">{quiz.items.length} answers</Pill>
              <Pill tone="neutral">{Math.round(quiz.timeLimitSec / 60)} min</Pill>
              <Pill tone={urgency ? "red" : "neutral"}>{formatTime(remaining)} left</Pill>
              <Pill tone="blue">{Math.round(pct * 100)}%</Pill>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight truncate">
              {quiz.title}
            </h1>

            <div className="mt-2 text-sm muted max-w-3xl">
              {quiz.description?.trim()
                ? quiz.description
                : "Type an answer and hit Enter. That’s the whole game."}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!started ? (
              <Button onClick={start}>Start</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => finish("manual")}>End</Button>
                <Button variant="secondary" onClick={() => router.push(`/quiz/${quiz.id}`)}>Details</Button>
              </>
            )}
          </div>
        </div>

        <Divider />

        {/* Not started: simple setup */}
        {!started ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-5">
              <div className="text-sm font-extrabold">How to play</div>
              <div className="text-sm muted mt-1">
                Type an answer → press <span className="font-bold text-[#0F172A]">Enter</span>.
                We accept aliases if the quiz creator added them.
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="card px-4 py-3">
                  <div className="text-xs muted font-semibold">Speed</div>
                  <div className="text-sm font-extrabold mt-1">Keyboard-first</div>
                  <div className="text-xs muted mt-0.5">No clicking required.</div>
                </div>
                <div className="card px-4 py-3">
                  <div className="text-xs muted font-semibold">Score</div>
                  <div className="text-sm font-extrabold mt-1">% complete</div>
                  <div className="text-xs muted mt-0.5">Finish strong.</div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="text-sm font-extrabold">Player name (optional)</div>
              <div className="text-xs muted mt-1">Saved with your result.</div>
              <div className="mt-3">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g., Will"
                />
              </div>
              <div className="mt-3">
                <Button className="w-full" onClick={start}>Start quiz</Button>
              </div>
            </div>
          </div>
        ) : (
          // Started: simplified play layout
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main typing + grid */}
            <div className="lg:col-span-2 card-strong p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">Type answers</div>
                  <div className="text-xs muted mt-0.5">Enter to submit. We fill matches instantly.</div>
                </div>
                <div className="text-sm font-black">{foundCount}/{totalCount}</div>
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  ref={inputRef as any}
                  value={state.input}
                  onChange={(e) => setState((s) => ({ ...s, input: e.target.value }))}
                  placeholder="Type an answer…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
                <Button onClick={submit}>Submit</Button>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs muted">
                  Tip: keep typing — don’t overthink punctuation. (We normalize input.)
                </div>
                <button
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                  onClick={() => inputRef.current?.focus()}
                >
                  Focus input
                </button>
              </div>

              <Divider />

              {/* Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.items.map((it) => {
                  const found = state.foundIds.has(it.id);
                  return (
                    <div
                      key={it.id}
                      className={[
                        "rounded-[18px] border px-4 py-3 transition",
                        found
                          ? "bg-[rgba(22,163,74,0.08)] border-[rgba(22,163,74,0.22)]"
                          : "bg-white strong-border",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs muted font-semibold truncate">
                            {it.prompt || "—"}
                          </div>
                          <div className="mt-1 text-sm font-extrabold truncate">
                            {found ? it.answer : "••••••••••"}
                          </div>
                        </div>
                        <Pill tone={found ? "green" : "neutral"}>{found ? "Found" : "Open"}</Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar controls */}
            <div className="card p-5">
              <div className="text-sm font-extrabold">Controls</div>
              <div className="text-xs muted mt-1">Clean and brutal.</div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="card px-4 py-3">
                  <div className="text-xs muted font-semibold">Time</div>
                  <div className="text-lg font-black mt-1">{formatTime(remaining)}</div>
                </div>
                <div className="card px-4 py-3">
                  <div className="text-xs muted font-semibold">Complete</div>
                  <div className="text-lg font-black mt-1">{Math.round(pct * 100)}%</div>
                </div>
              </div>

              <Divider />

              <div className="mt-4 flex flex-col gap-2">
                <Button variant="secondary" onClick={() => finish("manual")}>
                  End & save
                </Button>

                {/* Give up: end early + reveal all answers on results */}
                <Button
                  variant="danger"
                  onClick={() => {
                    const ok = confirm(
                      "Give up and reveal all answers on the results page? Your score will stay based on what you actually found."
                    );
                    if (!ok) return;
                    setRevealAllOnResults(true);
                    finish("giveup");
                  }}
                >
                  Give up (reveal answers)
                </Button>
              </div>

              <div className="mt-4 text-xs muted">
                “Give up” doesn’t fake 100%. It just reveals what you missed.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

