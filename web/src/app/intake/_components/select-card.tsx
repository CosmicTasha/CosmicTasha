"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function SelectCard({
  icon,
  title,
  description,
  selected,
  onClick,
  className,
}: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
        "bg-ct-surface hover:bg-ct-surface-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
        selected
          ? "border-ct-accent shadow-[0_0_0_1px_var(--ct-accent)]"
          : "border-ct-border-subtle hover:border-ct-border-default",
        className
      )}
      aria-pressed={selected}
    >
      {icon && (
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
            selected
              ? "bg-ct-accent/15 text-ct-accent"
              : "bg-ct-surface-raised text-ct-text-secondary group-hover:text-ct-text-primary"
          )}
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            selected ? "text-ct-text-primary" : "text-ct-text-primary"
          )}
        >
          {title}
        </span>
        {description && (
          <span className="text-xs text-ct-text-secondary">{description}</span>
        )}
      </div>
    </button>
  );
}
