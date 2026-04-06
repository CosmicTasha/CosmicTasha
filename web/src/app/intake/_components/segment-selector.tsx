"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentSelectorProps {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}

export function SegmentSelector({
  options,
  value,
  onChange,
}: SegmentSelectorProps) {
  return (
    <div
      className="inline-flex flex-wrap gap-0 rounded-xl border border-ct-border-subtle bg-ct-surface p-1"
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
              isSelected
                ? "bg-ct-accent text-white shadow-sm"
                : "text-ct-text-secondary hover:bg-ct-surface-raised hover:text-ct-text-primary"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
