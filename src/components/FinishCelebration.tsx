"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/ui";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Particle = {
  id: string;
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  rot: number;
  drot: number;
  life: number;
};

export default function FinishCelebration({
  show,
  scorePct,
  subtitle,
  onDone,
}: {
  show: boolean;
  scorePct: number;
  subtitle?: string;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  const particles = useMemo<Particle[]>(() => {
    const count = 46;
    return Array.from({ length: count }).map((_, i) => ({
      id: String(i),
      x: rand(35, 65),
      y: rand(35, 50),
      r: rand(2, 5),
      dx: rand(-0.9, 0.9),
      dy: rand(1.2, 2.4),
      rot: rand(0, 360),
      drot: rand(-6, 6),
      life: rand(600, 1200),
    }));
  }, []);

  useEffect(() => {
    if (!show) return;
    setPhase("in");

    const t1 = window.setTimeout(() => setPhase("out"), 1300);
    const t2 = window.setTimeout(() => onDone?.(), 1750);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [show, onDone]);

  if (!show) return null;

  const headline =
    scorePct === 100 ? "Perfect."
    : scorePct >= 85 ? "Elite."
    : scorePct >= 60 ? "Nice run."
    : "Keep grinding.";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] grid place-items-center",
        "bg-[rgba(15,23,42,0.55)] backdrop-blur-[10px]",
        phase === "in" ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300"
      )}
    >
      <div className="relative w-[min(560px,92vw)]">
        {/* particles */}
        <div className="absolute inset-0 overflow-hidden rounded-[26px] pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.r * 3}px`,
                height: `${p.r * 3}px`,
                background:
                  Math.random() > 0.5 ? "rgba(37,99,235,0.95)" : "rgba(22,163,74,0.92)",
                boxShadow: "0 12px 22px rgba(15,23,42,0.20)",
                transform: `translate(-50%,-50%) rotate(${p.rot}deg)`,
                animation: `btBurst ${p.life}ms ease-out forwards`,
                animationDelay: `${rand(0, 120)}ms`,
              } as any}
            />
          ))}
        </div>

        <div className="card-strong p-7 sm:p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-[18px] grid place-items-center bg-[rgba(22,163,74,0.10)] border strong-border">
            <div className="text-[#166534] text-xl font-black">✓</div>
          </div>

          <div className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">{headline}</div>
          <div className="mt-2 text-sm muted">{subtitle ?? "Result saved. Your ego is safe."}</div>

          <div className="mt-5">
            <div className="text-4xl font-black">{scorePct}%</div>
            <div className="mt-3 h-2.5 w-full rounded-full bg-[rgba(15,23,42,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#16A34A]"
                style={{ width: `${Math.max(0, Math.min(100, scorePct))}%`, transition: "width 420ms ease" }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes btBurst {
          from { transform: translate(-50%,-50%) translate3d(0,0,0) scale(1); opacity: 1; }
          to   { transform: translate(-50%,-50%) translate3d(var(--dx, 0px), 320px, 0) scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

