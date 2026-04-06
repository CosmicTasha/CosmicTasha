"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ChipMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowOther?: boolean;
}

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  allowOther = false,
}: ChipMultiSelectProps) {
  const [otherValue, setOtherValue] = React.useState("");

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const otherSelected = selected.includes("Other");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={cn(
                "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                isSelected
                  ? "border-ct-accent bg-ct-accent/15 text-ct-accent"
                  : "border-ct-border-subtle bg-ct-surface text-ct-text-secondary hover:border-ct-border-default hover:text-ct-text-primary"
              )}
              aria-pressed={isSelected}
            >
              {option}
            </button>
          );
        })}
        {allowOther && (
          <button
            type="button"
            onClick={() => toggleOption("Other")}
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
              otherSelected
                ? "border-ct-accent bg-ct-accent/15 text-ct-accent"
                : "border-ct-border-subtle bg-ct-surface text-ct-text-secondary hover:border-ct-border-default hover:text-ct-text-primary"
            )}
            aria-pressed={otherSelected}
          >
            Other
          </button>
        )}
      </div>
      {allowOther && otherSelected && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <Input
            value={otherValue}
            onChange={(e) => {
              setOtherValue(e.target.value);
            }}
            onBlur={() => {
              if (otherValue.trim()) {
                // Replace "Other" with the actual value in the parent
                const newSelected = selected.filter((s) => s !== "Other" && !s.startsWith("Other:"));
                newSelected.push(`Other: ${otherValue.trim()}`);
                onChange(newSelected);
              }
            }}
            placeholder="What industry?"
            className="max-w-xs border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
          />
        </div>
      )}
    </div>
  );
}
