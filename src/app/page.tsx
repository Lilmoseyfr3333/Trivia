"use client";

import React, { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import QuizCard from "@/components/QuizCard";
import { Button, Input, Pill, Stat, useMounted } from "@/components/ui";
import { getAllQuizzes, getPlays } from "@/lib/quizStore";

export default function HomePage() {
  const mounted = useMounted();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");

  const quizzes = mounted ? getAllQuizzes() : [];
  const plays = mounted ? getPlays() : [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const quiz of quizzes) set.add(quiz.category || "Other");
    return ["All", ...Array.from(set).sort()];
  }, [quizzes]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return quizzes.filter((z) => {
      const matchesText =
        !needle ||
        (z.title || "").toLowerCase().includes(needle) ||
        (z.description || "").toLowerCase().includes(needle);

      const matchesCat = category === "All" || (z.category || "Other") === category;
      const matchesDiff = difficulty === "All" || z.difficulty === difficulty;

      return matchesText && matchesCat && matchesDiff;
    });
  }, [quizzes, q, category, difficulty]);

  const stats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const totalPlays = plays.length;
    const best = plays.reduce((m, p) => Math.max(m, p.scorePct), 0);
    return { totalQuizzes, totalPlays, best };
  }, [quizzes.length, plays]);

  const recentPlays = useMemo(() => plays.slice(0, 6), [plays]);

  return (
    <AppShell
      right={
        <a href="#quizzes" className="hidden sm:inline-flex">
          <Button variant="ghost" size="sm">Browse</Button>
        </a>
      }
    >
      {/* Hero */}
      <div className="card-strong p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[rgba(37,99,235,0.10)] blur-2xl" />
        <div className="absolute -left-12 -bottom-24 h-80 w-80 rounded-full bg-[rgba(22,163,74,0.10)] blur-2xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2">
            <Pill tone="blue">Sporcle-style typing</Pill>
            <Pill tone="green">Premium UI</Pill>
            <Pill tone="neutral">Local-first MVP</Pill>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
            Create basketball quizzes people actually want to play.
          </h1>
          <p className="mt-3 text-[15px] muted max-w-2xl">
            Type answers, beat the clock, and keep a score history. No junk UI. No 2007 energy.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label="Quizzes" value={String(stats.totalQuizzes)} />
            <Stat label="Plays" value={String(stats.totalPlays)} />
            <Stat label="Best Score" value={`${stats.best}%`} sub="Across all quizzes" />
          </div>
        </div>
      </div>

      {/* Quick panels */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">Browse quizzes</div>
              <div className="text-xs muted mt-0.5">Search, filter, then play.</div>
            </div>
            <a href="/create">
              <Button size="sm">Create quiz</Button>
            </a>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description…"
              className="sm:w-[340px]"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-[18px] bg-white border strong-border px-4 text-[15px] outline-none focus:ring-4 focus:ring-[rgba(37,99,235,0.14)]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="h-11 rounded-[18px] bg-white border strong-border px-4 text-[15px] outline-none focus:ring-4 focus:ring-[rgba(37,99,235,0.14)]"
            >
              {["All", "Easy", "Normal", "Hard", "Insane"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-extrabold">My recent plays</div>
          <div className="text-xs muted mt-0.5">Stored in this browser.</div>

          <div className="mt-3 flex flex-col gap-2">
            {recentPlays.length ? (
              recentPlays.map((p) => (
                <a
                  key={p.id}
                  href={`/quiz/${p.quizId}/results?rid=${p.id}`}
                  className="border strong-border rounded-[18px] px-4 py-3 bg-white hover:bg-[rgba(15,23,42,0.02)] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold">{p.scorePct}%</div>
                    <div className="text-xs muted">{p.foundCount}/{p.totalCount}</div>
                  </div>
                  <div className="text-xs muted mt-1 line-clamp-1">{p.quizTitle}</div>
                </a>
              ))
            ) : (
              <div className="text-sm muted mt-2">
                No plays yet. Pick a quiz and start cooking.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div id="quizzes" className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((quiz) => {
          const quizPlays = plays.filter((p) => p.quizId === quiz.id);
          const playsCount = quizPlays.length;
          const bestPct = quizPlays.length ? Math.max(...quizPlays.map((p) => p.scorePct)) : null;

          return (
            <QuizCard key={quiz.id} quiz={quiz} playsCount={playsCount} bestPct={bestPct} />
          );
        })}

        {mounted && filtered.length === 0 ? (
          <div className="card p-6 md:col-span-2">
            <div className="text-lg font-extrabold">No matches.</div>
            <div className="text-sm muted mt-1">
              Try a different search… or create a quiz so good your friends stop answering texts.
            </div>
            <div className="mt-4">
              <a href="/create">
                <Button>Create quiz</Button>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

