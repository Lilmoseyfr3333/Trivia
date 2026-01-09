"use client";

// src/app/create/CreateClient.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button, Divider, Input, Pill, Select, Textarea, Toast, useMounted } from "@/components/ui";
import type { Difficulty, Quiz, QuizItem } from "@/lib/types";
import { compactList, splitLines, uuid } from "@/lib/utils";
import { createEmptyQuiz, getQuiz, normalizeItems, upsertQuiz } from "@/lib/quizStore";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["NBA", "WNBA", "NCAA", "Players", "Teams", "History", "Stats", "Draft", "Coaches", "Other"];
const DIFFS: Difficulty[] = ["Easy", "Normal", "Hard", "Insane"];

type Step = "Basics" | "Answers" | "Preview";

export default function CreateClient() {
  const mounted = useMounted();
  const router = useRouter();
  const sp = useSearchParams();

  const editId = sp.get("edit");

  const [step, setStep] = useState<Step>("Basics");
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const [quiz, setQuiz] = useState<Quiz>(() => createEmptyQuiz());
  const bulkRef = useRef<HTMLTextAreaElement | null>(null);

  function showToast(msg: string) {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: "" }), 1500);
  }

  // Load existing quiz for editing
  useEffect(() => {
    if (!mounted) return;
    if (!editId) return;

    const q = getQuiz(editId);
    if (q) setQuiz(q);
    else {
      showToast("Couldn’t find that quiz. Creating a new one.");
      setQuiz(createEmptyQuiz());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, editId]);

  const validation = useMemo(() => {
    const titleOk = quiz.title.trim().length >= 3;
    const itemsNorm = normalizeItems(quiz.items);
    const enough = itemsNorm.length >= 3;
    return { titleOk, enough, itemsCount: itemsNorm.length, ok: titleOk && enough };
  }, [quiz]);

  function setItem(idx: number, patch: Partial<QuizItem>) {
    setQuiz((q) => {
      const items = q.items.slice();
      items[idx] = { ...items[idx], ...patch };
      return { ...q, items };
    });
  }

  function addRow() {
    setQuiz((q) => ({
      ...q,
      items: [...q.items, { id: uuid(), prompt: "", answer: "", aliases: [] }],
    }));
  }

  function removeRow(idx: number) {
    setQuiz((q) => {
      const items = q.items.slice();
      items.splice(idx, 1);
      return { ...q, items: items.length ? items : [{ id: uuid(), prompt: "", answer: "", aliases: [] }] };
    });
  }

  function moveRow(idx: number, dir: -1 | 1) {
    setQuiz((q) => {
      const items = q.items.slice();
      const next = idx + dir;
      if (next < 0 || next >= items.length) return q;
      const tmp = items[idx];
      items[idx] = items[next];
      items[next] = tmp;
      return { ...q, items };
    });
  }

  function bulkAddFromText(raw: string) {
    // Line formats supported:
    // prompt | answer | alias1; alias2
    // OR just "answer"
    const lines = splitLines(raw);
    if (!lines.length) {
      showToast("Paste some lines first.");
      return;
    }

    const newItems: QuizItem[] = lines.map((line) => {
      const parts = line.split("|").map((x) => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const prompt = parts[0];
        const answer = parts[1];
        const aliases = parts[2]
          ? parts[2].split(";").map((x) => x.trim()).filter(Boolean)
          : [];
        return { id: uuid(), prompt, answer, aliases };
      }
      return { id: uuid(), prompt: "", answer: line, aliases: [] };
    });

    setQuiz((q) => ({ ...q, items: normalizeItems([...q.items, ...newItems]) }));
    showToast(`Added ${newItems.length} items.`);
  }

  function save() {
    const cleaned: Quiz = {
      ...quiz,
      title: quiz.title.trim(),
      description: (quiz.description || "").trim(),
      category: quiz.category || "Other",
      authorName: (quiz.authorName || "").trim(),
      items: normalizeItems(quiz.items),
    };

    if (cleaned.title.length < 3) {
      showToast("Title is too short.");
      setStep("Basics");
      return;
    }
    if (cleaned.items.length < 3) {
      showToast("Add at least 3 answers.");
      setStep("Answers");
      return;
    }

    const saved = upsertQuiz(cleaned);
    showToast("Saved.");
    router.push(`/quiz/${saved.id}`);
  }

  const stepIndex = step === "Basics" ? 0 : step === "Answers" ? 1 : 2;

  return (
    <AppShell
      right={
        <div className="hidden sm:flex items-center gap-2">
          <Pill tone="neutral">Create</Pill>
          <Pill tone={validation.ok ? "green" : "red"}>{validation.ok ? "Ready" : "Needs work"}</Pill>
        </div>
      }
    >
      <Toast message={toast.msg} show={toast.show} />

      <div className="card-strong p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2">
              <Pill tone="blue">Creator Studio</Pill>
              <Pill tone="neutral">Paste-friendly</Pill>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
              Create a quiz people can actually finish.
            </h1>
            <p className="mt-2 text-sm muted max-w-2xl">
              Clean title + tight answer list. Prompts optional. Aliases = forgiveness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>Back</Button>
            <Button onClick={save} disabled={!validation.ok}>Save quiz</Button>
          </div>
        </div>

        <Divider />

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2">
          {(["Basics", "Answers", "Preview"] as Step[]).map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={[
                "flex-1 rounded-[18px] px-4 py-3 text-left border transition",
                i === stepIndex
                  ? "bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.24)]"
                  : "bg-white strong-border hover:bg-[rgba(15,23,42,0.02)]",
              ].join(" ")}
            >
              <div className="text-xs muted font-semibold">Step {i + 1}</div>
              <div className="text-sm font-extrabold">{s}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {step === "Basics" ? (
            <div className="card-strong p-6">
              <div className="text-lg font-extrabold">Basics</div>
              <div className="text-sm muted mt-1">Make the cover worth clicking.</div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <div className="text-xs font-bold muted mb-1.5">Title</div>
                  <Input
                    value={quiz.title}
                    onChange={(e) => setQuiz((q) => ({ ...q, title: e.target.value }))}
                    placeholder="e.g., NBA MVPs (2000–2024)"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold muted mb-1.5">Category</div>
                  <Select value={quiz.category} onChange={(e) => setQuiz((q) => ({ ...q, category: e.target.value }))}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="text-xs font-bold muted mb-1.5">Difficulty</div>
                  <Select
                    value={quiz.difficulty}
                    onChange={(e) => setQuiz((q) => ({ ...q, difficulty: e.target.value as Difficulty }))}
                  >
                    {DIFFS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="text-xs font-bold muted mb-1.5">Time limit (seconds)</div>
                  <Input
                    type="number"
                    value={quiz.timeLimitSec}
                    onChange={(e) => setQuiz((q) => ({ ...q, timeLimitSec: Math.max(30, Number(e.target.value || 0)) }))}
                    min={30}
                  />
                </div>

                <div>
                  <div className="text-xs font-bold muted mb-1.5">Author (optional)</div>
                  <Input
                    value={quiz.authorName || ""}
                    onChange={(e) => setQuiz((q) => ({ ...q, authorName: e.target.value }))}
                    placeholder="e.g., Will"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs font-bold muted mb-1.5">Description (optional)</div>
                  <Textarea
                    value={quiz.description || ""}
                    onChange={(e) => setQuiz((q) => ({ ...q, description: e.target.value }))}
                    placeholder="1–2 sentences."
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setStep("Answers")}>Next: Answers</Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "Answers" ? (
            <div className="card-strong p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">Answers</div>
                  <div className="text-sm muted mt-1">Prompt optional. Aliases accept nicknames.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={addRow}>Add row</Button>
                  <Button onClick={() => setStep("Preview")} disabled={normalizeItems(quiz.items).length < 3}>
                    Preview
                  </Button>
                </div>
              </div>

              <div className="mt-5 card p-4">
                <div className="text-sm font-extrabold">Bulk paste</div>
                <div className="text-xs muted mt-0.5">
                  Line formats:
                  <span className="font-semibold text-[#0F172A]"> prompt | answer | alias1; alias2</span>
                  <br />
                  Or just one answer per line.
                </div>

                <div className="mt-3">
                  <Textarea
                    ref={bulkRef}
                    placeholder={"2016 MVP | Stephen Curry | Steph Curry; Curry\nLos Angeles | Lakers | LA Lakers"}
                  />
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const raw = bulkRef.current?.value || "";
                      bulkAddFromText(raw);
                      if (bulkRef.current) bulkRef.current.value = "";
                    }}
                  >
                    Add pasted lines
                  </Button>

                  <div className="text-xs muted">
                    Valid answers: <span className="font-bold text-[#0F172A]">{validation.itemsCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden border strong-border rounded-[22px]">
                <div className="grid grid-cols-12 bg-[rgba(15,23,42,0.02)] border-b strong-border px-4 py-2 text-xs font-bold muted">
                  <div className="col-span-4">Prompt</div>
                  <div className="col-span-4">Answer</div>
                  <div className="col-span-3">Aliases (comma)</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="divide-y divide-[rgba(15,23,42,0.08)] bg-white">
                  {quiz.items.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                      <div className="col-span-4">
                        <Input
                          value={it.prompt || ""}
                          onChange={(e) => setItem(idx, { prompt: e.target.value })}
                          placeholder="e.g., 2016 MVP"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={it.answer}
                          onChange={(e) => setItem(idx, { answer: e.target.value })}
                          placeholder="e.g., Stephen Curry"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={(it.aliases || []).join(", ")}
                          onChange={(e) => setItem(idx, { aliases: compactList(e.target.value) })}
                          placeholder="Steph Curry, Curry"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          className="h-9 w-9 rounded-[14px] border strong-border hover:bg-[rgba(15,23,42,0.03)]"
                          onClick={() => moveRow(idx, -1)}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="h-9 w-9 rounded-[14px] border strong-border hover:bg-[rgba(15,23,42,0.03)]"
                          onClick={() => moveRow(idx, 1)}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          className="h-9 w-9 rounded-[14px] border strong-border hover:bg-[rgba(239,68,68,0.07)]"
                          onClick={() => removeRow(idx)}
                          title="Delete row"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between gap-2">
                <Button variant="secondary" onClick={() => setStep("Basics")}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={addRow}>Add row</Button>
                  <Button onClick={() => setStep("Preview")} disabled={normalizeItems(quiz.items).length < 3}>
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "Preview" ? (
            <div className="card-strong p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">Preview</div>
                  <div className="text-sm muted mt-1">This is what players will see.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setStep("Answers")}>Back</Button>
                  <Button onClick={save} disabled={!validation.ok}>Save</Button>
                </div>
              </div>

              <div className="mt-5 card p-5">
                <div className="text-2xl font-black">{quiz.title || "Untitled quiz"}</div>
                <div className="mt-2 text-sm muted">{quiz.description || "No description."}</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="neutral">{quiz.category}</Pill>
                  <Pill tone="blue">{quiz.difficulty}</Pill>
                  <Pill tone="neutral">{normalizeItems(quiz.items).length} answers</Pill>
                  <Pill tone="neutral">{Math.round(quiz.timeLimitSec / 60)} min</Pill>
                </div>

                <Divider />

                <div className="mt-4 text-sm font-extrabold">Sample grid</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {normalizeItems(quiz.items).slice(0, 6).map((it) => (
                    <div key={it.id} className="card px-4 py-3">
                      <div className="text-xs muted font-semibold">{it.prompt || "—"}</div>
                      <div className="text-sm font-extrabold mt-1">{it.answer}</div>
                      <div className="text-xs muted mt-0.5">
                        aliases: {(it.aliases || []).length ? it.aliases?.join(", ") : "none"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={save} disabled={!validation.ok}>Save quiz</Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="text-sm font-extrabold">Checklist</div>
            <div className="text-xs muted mt-1">Green = ship it.</div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Title length</div>
                <Pill tone={validation.titleOk ? "green" : "red"}>{validation.titleOk ? "OK" : "Fix"}</Pill>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">At least 3 answers</div>
                <Pill tone={validation.enough ? "green" : "red"}>{validation.enough ? "OK" : "Fix"}</Pill>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Valid answers</div>
                <Pill tone="neutral">{validation.itemsCount}</Pill>
              </div>
            </div>

            <Divider />

            <div className="text-xs muted">
              Pro tip: add aliases for nicknames (AI, KG, Steph) and punctuation variants.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

