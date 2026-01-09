// lib/types.ts

export type Difficulty = "Easy" | "Normal" | "Hard" | "Insane";

export type QuizItem = {
  id: string;
  prompt?: string;      // optional clue like "2016 MVP"
  answer: string;       // canonical answer
  aliases?: string[];   // accepted variants
};

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: Difficulty;
  timeLimitSec: number;
  items: QuizItem[];

  createdAt: string;
  updatedAt: string;

  authorName?: string;
};

export type EndReason = "time" | "complete" | "manual" | "giveup";

export type PlayResult = {
  id: string;
  quizId: string;
  quizTitle: string;

  startedAt: string;
  endedAt: string;

  durationSec: number;
  timeLimitSec: number;

  foundCount: number;
  totalCount: number;

  scorePct: number;      // found/total * 100
  foundIds: string[];
  missedAnswers: string[];

  playerName?: string;

  // Optional metadata (backwards compatible with older stored results)
  endedReason?: EndReason;
  revealAll?: boolean;
};

