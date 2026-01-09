"use client";

import Link from "next/link";
import React from "react";
import type { Quiz } from "@/lib/types";
import { Button, Pill, cn } from "./ui";

export default function QuizCard({
  quiz,
  playsCount,
  bestPct,
}: {
  quiz: Quiz;
  playsCount: number;
  bestPct: number | null;
}) {
  const tone =
    quiz.difficulty === "Easy" ? "green"
    : quiz.difficulty === "Normal" ? "blue"
    : quiz.difficulty === "Hard" ? "neutral"
    : "red";

  return (
    <div className={cn("card-strong p-5 flex flex-col gap-4", "hover:shadow-[0_20px_76px_rgba(15,23,42,0.12)] transition")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-extrabold leading-tight truncate">
            {quiz.title || "Untitled quiz"}
          </div>
          <div className="text-sm muted mt-1 line-clamp-2">
            {quiz.description?.trim() ? quiz.description : "No description. (That’s fine — the quiz better slap.)"}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{quiz.category}</Pill>
            <Pill tone={tone as any}>{quiz.difficulty}</Pill>
            <Pill tone="neutral">{quiz.items.length} answers</Pill>
            <Pill tone="neutral">{Math.round(quiz.timeLimitSec / 60)} min</Pill>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="text-xs muted font-semibold">Plays</div>
          <div className="text-2xl font-black">{playsCount}</div>
          <div className="text-xs muted">
            Best: <span className="font-bold text-[#0F172A]">{bestPct == null ? "—" : `${bestPct}%`}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/quiz/${quiz.id}/play`} className="flex-1">
          <Button className="w-full" size="md">Play</Button>
        </Link>
        <Link href={`/quiz/${quiz.id}`} className="flex-1">
          <Button className="w-full" variant="secondary" size="md">Details</Button>
        </Link>
      </div>
    </div>
  );
}

