// lib/playEngine.ts

import type { PlayResult, Quiz, EndReason } from "./types";
import { normalizeAnswer, uuid } from "./utils";

export type PlayState = {
  startedAtISO: string;
  foundIds: Set<string>;
  input: string;
  lastHit?: { id: string; answer: string; at: number };
};

export function buildAcceptedSet(quiz: Quiz) {
  // Map normalized accepted answer -> itemId
  const map = new Map<string, string>();

  for (const it of quiz.items) {
    const base = normalizeAnswer(it.answer);
    if (base) map.set(base, it.id);

    for (const a of it.aliases ?? []) {
      const n = normalizeAnswer(a);
      if (n) map.set(n, it.id);
    }
  }

  return map;
}

export function trySubmitAnswer(
  quiz: Quiz,
  acceptedMap: Map<string, string>,
  state: PlayState,
  raw: string
) {
  const n = normalizeAnswer(raw);
  if (!n) return { hit: false as const };

  const id = acceptedMap.get(n);
  if (!id) return { hit: false as const };

  if (state.foundIds.has(id)) return { hit: false as const, already: true as const };

  const item = quiz.items.find((x) => x.id === id);
  state.foundIds.add(id);
  state.lastHit = { id, answer: item?.answer ?? raw, at: Date.now() };

  return { hit: true as const, id, answer: item?.answer ?? raw };
}

export function finalizeResult(
  quiz: Quiz,
  state: PlayState,
  endedAtISO: string,
  opts?: {
    playerName?: string;
    endedReason?: EndReason;
    revealAll?: boolean;
  }
): PlayResult {
  const started = new Date(state.startedAtISO).getTime();
  const ended = new Date(endedAtISO).getTime();
  const durationSec = Math.max(0, Math.round((ended - started) / 1000));

  const foundIds = Array.from(state.foundIds);
  const foundCount = foundIds.length;
  const totalCount = quiz.items.length;
  const scorePct = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

  const missedAnswers = quiz.items
    .filter((it) => !state.foundIds.has(it.id))
    .map((it) => it.answer);

  return {
    id: uuid(),
    quizId: quiz.id,
    quizTitle: quiz.title,
    startedAt: state.startedAtISO,
    endedAt: endedAtISO,
    durationSec,
    timeLimitSec: quiz.timeLimitSec,
    foundCount,
    totalCount,
    scorePct,
    foundIds,
    missedAnswers,
    playerName: opts?.playerName?.trim() || undefined,
    endedReason: opts?.endedReason,
    revealAll: opts?.revealAll,
  };
}

