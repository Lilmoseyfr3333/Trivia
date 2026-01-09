"use client";

import type { PlayResult, Quiz, QuizItem } from "./types";
import { safeJsonParse, uuid } from "./utils";

const QUIZZES_KEY = "bt_quizzes_v2";
const PLAYS_KEY = "bt_plays_v2";
const SEEDED_KEY = "bt_seeded_v2";

function nowISO() {
  return new Date().toISOString();
}

export function getAllQuizzes(): Quiz[] {
  if (typeof window === "undefined") return [];
  const arr = safeJsonParse<Quiz[]>(localStorage.getItem(QUIZZES_KEY), []);
  return arr.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

export function getQuiz(id: string): Quiz | null {
  return getAllQuizzes().find((q) => q.id === id) ?? null;
}

export function createEmptyQuiz(): Quiz {
  const iso = nowISO();
  return {
    id: uuid(),
    title: "",
    description: "",
    category: "NBA",
    difficulty: "Normal",
    timeLimitSec: 240,
    items: [
      { id: uuid(), prompt: "Example clue (optional)", answer: "LeBron James", aliases: ["Lebron"] },
      { id: uuid(), prompt: "Team nickname", answer: "Lakers", aliases: ["LA Lakers"] },
    ],
    createdAt: iso,
    updatedAt: iso,
    authorName: "",
  };
}

export function upsertQuiz(quiz: Quiz): Quiz {
  const all = getAllQuizzes();
  const idx = all.findIndex((q) => q.id === quiz.id);
  const next: Quiz = { ...quiz, updatedAt: nowISO() };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(all));
  return next;
}

export function deleteQuiz(id: string) {
  const all = getAllQuizzes().filter((q) => q.id !== id);
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(all));
}

export function getPlays(): PlayResult[] {
  if (typeof window === "undefined") return [];
  const arr = safeJsonParse<PlayResult[]>(localStorage.getItem(PLAYS_KEY), []);
  return arr.sort((a, b) => b.endedAt.localeCompare(a.endedAt));
}

export function getPlaysForQuiz(quizId: string): PlayResult[] {
  return getPlays().filter((p) => p.quizId === quizId);
}

export function addPlay(result: PlayResult) {
  const all = getPlays();
  all.unshift(result);
  localStorage.setItem(PLAYS_KEY, JSON.stringify(all));
}

export function normalizeItems(items: QuizItem[]): QuizItem[] {
  // keep only real answers, remove blank rows, de-dupe by normalized answer
  const seen = new Set<string>();
  const out: QuizItem[] = [];
  for (const it of items) {
    const ans = (it.answer || "").trim();
    if (!ans) continue;
    const key = ans.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: it.id || uuid(),
      prompt: (it.prompt || "").trim() || undefined,
      answer: ans,
      aliases: (it.aliases || []).map((a) => a.trim()).filter(Boolean),
    });
  }
  return out;
}

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY) === "1") return;

  const existing = getAllQuizzes();
  if (existing.length > 0) {
    localStorage.setItem(SEEDED_KEY, "1");
    return;
  }

  const mk = (title: string, category: string, difficulty: Quiz["difficulty"], timeLimitSec: number, items: Array<Pick<QuizItem, "answer" | "aliases" | "prompt">>) => {
    const iso = nowISO();
    const q: Quiz = {
      id: uuid(),
      title,
      description:
        "Type answers fast. This is Sporcle DNA with a cleaner suit and better shoes.",
      category,
      difficulty,
      timeLimitSec,
      items: items.map((it) => ({ id: uuid(), ...it })),
      createdAt: iso,
      updatedAt: iso,
      authorName: "House",
    };
    return q;
  };

  const seeds: Quiz[] = [
    mk("NBA MVPs (2000–2024)", "NBA", "Hard", 360, [
      { prompt: "2000", answer: "Shaquille O'Neal", aliases: ["Shaq", "Shaquille Oneal"] },
      { prompt: "2001", answer: "Allen Iverson", aliases: ["AI"] },
      { prompt: "2002", answer: "Tim Duncan" },
      { prompt: "2003", answer: "Tim Duncan" },
      { prompt: "2004", answer: "Kevin Garnett", aliases: ["KG"] },
      { prompt: "2005", answer: "Steve Nash" },
      { prompt: "2006", answer: "Steve Nash" },
      { prompt: "2007", answer: "Dirk Nowitzki", aliases: ["Dirk"] },
      { prompt: "2008", answer: "Kobe Bryant", aliases: ["Kobe"] },
      { prompt: "2009", answer: "LeBron James", aliases: ["Lebron"] },
      { prompt: "2010", answer: "LeBron James", aliases: ["Lebron"] },
      { prompt: "2011", answer: "Derrick Rose", aliases: ["D Rose"] },
      { prompt: "2012", answer: "LeBron James", aliases: ["Lebron"] },
      { prompt: "2013", answer: "LeBron James", aliases: ["Lebron"] },
      { prompt: "2014", answer: "Kevin Durant", aliases: ["KD"] },
      { prompt: "2015", answer: "Stephen Curry", aliases: ["Steph Curry"] },
      { prompt: "2016", answer: "Stephen Curry", aliases: ["Steph Curry"] },
      { prompt: "2017", answer: "Russell Westbrook", aliases: ["Russ Westbrook"] },
      { prompt: "2018", answer: "James Harden", aliases: ["Harden"] },
      { prompt: "2019", answer: "Giannis Antetokounmpo", aliases: ["Giannis"] },
      { prompt: "2020", answer: "Giannis Antetokounmpo", aliases: ["Giannis"] },
      { prompt: "2021", answer: "Nikola Jokic", aliases: ["Jokic"] },
      { prompt: "2022", answer: "Nikola Jokic", aliases: ["Jokic"] },
      { prompt: "2023", answer: "Joel Embiid", aliases: ["Embiid"] },
      { prompt: "2024", answer: "Nikola Jokic", aliases: ["Jokic"] },
    ]),
    mk("NBA Teams by City", "NBA", "Normal", 240, [
      { prompt: "Boston", answer: "Celtics" },
      { prompt: "Los Angeles", answer: "Lakers", aliases: ["LA Lakers"] },
      { prompt: "Los Angeles (2)", answer: "Clippers", aliases: ["LA Clippers"] },
      { prompt: "New York", answer: "Knicks" },
      { prompt: "Chicago", answer: "Bulls" },
      { prompt: "Miami", answer: "Heat" },
      { prompt: "Dallas", answer: "Mavericks", aliases: ["Mavs"] },
      { prompt: "Phoenix", answer: "Suns" },
      { prompt: "Golden State", answer: "Warriors", aliases: ["Dubs"] },
      { prompt: "Denver", answer: "Nuggets" },
      { prompt: "Milwaukee", answer: "Bucks" },
    ]),
  ];

  localStorage.setItem(QUIZZES_KEY, JSON.stringify(seeds));
  localStorage.setItem(SEEDED_KEY, "1");
}

