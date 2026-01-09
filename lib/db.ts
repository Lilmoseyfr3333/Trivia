import type { Quiz, QuizItem, PlayResult } from "./types";
import { supabase } from "./supabaseClient";
import { uuid } from "./utils";

export type SessionUser = { id: string; email?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  return { id: u.id, email: u.email };
}

export async function fetchPublicQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    description: q.description ?? "",
    category: q.category ?? "NBA",
    difficulty: q.difficulty ?? "Normal",
    timeLimitSec: q.time_limit_sec ?? 240,
    items: [],
    createdAt: q.created_at,
    updatedAt: q.updated_at,
    authorName: undefined,
  }));
}

export async function fetchMyQuizzes(): Promise<Quiz[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    description: q.description ?? "",
    category: q.category ?? "NBA",
    difficulty: q.difficulty ?? "Normal",
    timeLimitSec: q.time_limit_sec ?? 240,
    items: [],
    createdAt: q.created_at,
    updatedAt: q.updated_at,
    authorName: undefined,
  }));
}

export async function fetchQuizWithItems(quizId: string): Promise<Quiz | null> {
  const { data: q, error: e1 } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (e1) return null;

  const { data: items, error: e2 } = await supabase
    .from("quiz_items")
    .select("*")
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  if (e2) throw e2;

  return {
    id: q.id,
    title: q.title,
    description: q.description ?? "",
    category: q.category ?? "NBA",
    difficulty: q.difficulty ?? "Normal",
    timeLimitSec: q.time_limit_sec ?? 240,
    items: (items ?? []).map((it: any) => ({
      id: it.id,
      prompt: it.prompt ?? "",
      answer: it.answer,
      aliases: it.aliases ?? [],
    })),
    createdAt: q.created_at,
    updatedAt: q.updated_at,
    authorName: undefined,
  };
}

export async function createQuizWithItems(input: Quiz): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in.");

  const { data: q, error: e1 } = await supabase
    .from("quizzes")
    .insert({
      owner_id: user.id,
      title: input.title,
      description: input.description ?? "",
      category: input.category ?? "NBA",
      difficulty: input.difficulty ?? "Normal",
      time_limit_sec: input.timeLimitSec ?? 240,
      is_public: true,
    })
    .select("id")
    .single();

  if (e1) throw e1;

  const rows = input.items.map((it, idx) => ({
    quiz_id: q.id,
    prompt: it.prompt ?? "",
    answer: it.answer,
    aliases: it.aliases ?? [],
    sort_order: idx,
  }));

  const { error: e2 } = await supabase.from("quiz_items").insert(rows);
  if (e2) throw e2;

  return q.id;
}

export async function updateQuizWithItems(quizId: string, input: Quiz): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in.");

  const { error: e1 } = await supabase
    .from("quizzes")
    .update({
      title: input.title,
      description: input.description ?? "",
      category: input.category ?? "NBA",
      difficulty: input.difficulty ?? "Normal",
      time_limit_sec: input.timeLimitSec ?? 240,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizId)
    .eq("owner_id", user.id);

  if (e1) throw e1;

  // Replace items: simplest & safe.
  const { error: eDel } = await supabase.from("quiz_items").delete().eq("quiz_id", quizId);
  if (eDel) throw eDel;

  const rows = input.items.map((it, idx) => ({
    quiz_id: quizId,
    prompt: it.prompt ?? "",
    answer: it.answer,
    aliases: it.aliases ?? [],
    sort_order: idx,
  }));

  const { error: e2 } = await supabase.from("quiz_items").insert(rows);
  if (e2) throw e2;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId).eq("owner_id", user.id);
  if (error) throw error;
}

export async function insertPlay(args: {
  quizId: string;
  playerName?: string;
  scorePct: number;
  foundCount: number;
  totalCount: number;
  durationSec: number;
  anonId: string;
}) {
  const user = await getSessionUser();
  const { error } = await supabase.from("plays").insert({
    quiz_id: args.quizId,
    user_id: user?.id ?? null,
    anon_id: user?.id ? null : args.anonId,
    player_name: args.playerName?.trim() || null,
    score_pct: args.scorePct,
    found_count: args.foundCount,
    total_count: args.totalCount,
    duration_sec: args.durationSec,
  });
  if (error) throw error;
}

export async function fetchMyProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return { id: user.id, display_name: "", username: "", bio: "" };

  return {
    id: data.id,
    displayName: data.display_name ?? "",
    username: data.username ?? "",
    bio: data.bio ?? "",
    email: user.email ?? "",
  };
}

export async function upsertMyProfile(input: { displayName: string; username: string; bio: string }) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: input.displayName,
    username: input.username || null,
    bio: input.bio || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

