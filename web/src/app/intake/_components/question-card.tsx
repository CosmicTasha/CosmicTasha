"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function QuestionCard({
  id,
  label,
  description,
  required,
  children,
  className,
}: QuestionCardProps) {
  return (
    <div
      id={id}
      className={cn("flex flex-col gap-3", className)}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      <div className="flex flex-col gap-1">
        <label
          id={`${id}-label`}
          className="text-base font-medium text-ct-text-primary"
        >
          {label}
          {required && (
            <span className="ml-1 text-ct-accent" aria-label="required">
              *
            </span>
          )}
        </label>
        {description && (
          <p className="text-sm text-ct-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
