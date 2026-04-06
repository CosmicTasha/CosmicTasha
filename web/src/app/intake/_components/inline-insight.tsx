"use client";

/* ------------------------------------------------------------------ */
/*  Inline Insight Callout                                             */
/*  Compact card for embedding within stage question components.       */
/* ------------------------------------------------------------------ */

interface InlineInsightProps {
  type: "gap" | "strength";
  title: string;
  description: string;
}

export function InlineInsight({ type, title, description }: InlineInsightProps) {
  const isStrength = type === "strength";

  return (
    <div
      className={`animate-in fade-in duration-300 mt-2 rounded-md border-l-[3px] px-3 py-2 ${
        isStrength
          ? "border-l-[#34D399] bg-[#34D399]/[0.06]"
          : "border-l-[#F97316] bg-[#F97316]/[0.06]"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          isStrength ? "text-[#34D399]" : "text-[#F97316]"
        }`}
      >
        {title}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ct-text-secondary">
        {description}
      </p>
    </div>
  );
}
