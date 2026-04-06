"use client";

interface ReadinessRingProps {
  score: number | null;
  size?: number;
}

export function ReadinessRing({ score, size = 120 }: ReadinessRingProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = score !== null ? Math.min(Math.max(score, 0), 100) : 0;
  const offset = circumference - (percent / 100) * circumference;

  function getRingColor(): string {
    if (score === null) return "var(--ct-text-tertiary)";
    if (score < 40) return "var(--ct-status-gap-critical)";
    if (score < 70) return "var(--ct-accent-secondary)";
    return "var(--ct-status-strength)";
  }

  function getLabel(): string {
    if (score === null) return "--";
    return `${Math.round(score)}`;
  }

  const ringColor = getRingColor();

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ct-surface-raised)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold text-ct-text-primary"
          style={{ fontSize: size * 0.28 }}
        >
          {getLabel()}
        </span>
        {score !== null && (
          <span
            className="text-ct-text-tertiary"
            style={{ fontSize: size * 0.12 }}
          >
            / 100
          </span>
        )}
      </div>
    </div>
  );
}
