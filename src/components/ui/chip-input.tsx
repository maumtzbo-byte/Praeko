"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

/** Freeform tag input for list-like fields (competidores, valores, categorías…). */
export function ChipInput({ value, onChange, placeholder, className }: ChipInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-800",
        className,
      )}
    >
      {value.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== chip))}
            aria-label={`Quitar ${chip}`}
            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
    </div>
  );
}
