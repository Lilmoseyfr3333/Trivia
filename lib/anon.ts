import { uuid } from "./utils";

const KEY = "bt_anon_id_v1";

export function getAnonId(): string {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = uuid();
  localStorage.setItem(KEY, id);
  return id;
}

