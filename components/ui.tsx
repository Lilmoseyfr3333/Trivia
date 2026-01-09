"use client";

import React, { useEffect, useMemo, useState } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[18px] transition active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(37,99,235,0.18)] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
        ? "h-12 px-5 text-base"
        : "h-10 px-4 text-sm";

  const styles =
    variant === "primary"
      ? "text-white bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:brightness-[1.02]"
      : variant === "secondary"
        ? "bg-white border strong-border text-[#0F172A] hover:bg-[rgba(15,23,42,0.02)]"
        : variant === "danger"
          ? "text-white bg-gradient-to-b from-[#ef4444] to-[#dc2626] shadow-[0_14px_30px_rgba(220,38,38,0.18)] hover:brightness-[1.02]"
          : "bg-transparent hover:bg-[rgba(15,23,42,0.04)]";

  return <button className={cn(base, sizes, styles, className)} {...props} />;
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[18px] bg-white border strong-border px-4 text-[15px] outline-none",
        "focus:ring-4 focus:ring-[rgba(37,99,235,0.14)] focus:border-[rgba(37,99,235,0.35)]",
        "placeholder:text-[rgba(100,116,139,0.85)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[18px] bg-white border strong-border px-4 text-[15px] outline-none",
        "focus:ring-4 focus:ring-[rgba(37,99,235,0.14)] focus:border-[rgba(37,99,235,0.35)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-[18px] bg-white border strong-border px-4 py-3 text-[15px] outline-none resize-y",
        "focus:ring-4 focus:ring-[rgba(37,99,235,0.14)] focus:border-[rgba(37,99,235,0.35)]",
        "placeholder:text-[rgba(100,116,139,0.85)]",
        className
      )}
      {...props}
    />
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "red";
}) {
  const cls =
    tone === "blue"
      ? "bg-[rgba(37,99,235,0.10)] text-[#1D4ED8] border-[rgba(37,99,235,0.18)]"
      : tone === "green"
        ? "bg-[rgba(22,163,74,0.10)] text-[#166534] border-[rgba(22,163,74,0.18)]"
        : tone === "red"
          ? "bg-[rgba(239,68,68,0.10)] text-[#b91c1c] border-[rgba(239,68,68,0.18)]"
          : "bg-[rgba(15,23,42,0.04)] text-[#0F172A] border-[rgba(15,23,42,0.10)]";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-[rgba(15,23,42,0.08)]" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-md border strong-border bg-white px-2 py-1 text-xs font-semibold text-[#0F172A] shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
      {children}
    </kbd>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs muted font-semibold">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
      {sub ? <div className="text-xs muted mt-0.5">{sub}</div> : null}
    </div>
  );
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function Toast({
  message,
  show,
}: {
  message: string;
  show: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-4 z-[100] -translate-x-1/2 transition",
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      <div className="card-strong px-4 py-2.5 text-sm font-semibold">
        {message}
      </div>
    </div>
  );
}

