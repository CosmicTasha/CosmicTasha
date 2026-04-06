"use client";

import * as React from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Download,
  Check,
  Pencil,
  SkipForward,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/lib/sanitization/scanner";
import {
  type SanitizationState,
  type DecisionType,
  createInitialState,
  recordDecision,
  applySanitization,
  getStats,
} from "@/lib/sanitization/state";

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  critical: {
    label: "Critical",
    className:
      "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dotClassName: "bg-orange-400",
  },
  high: {
    label: "High",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClassName: "bg-amber-400",
  },
  medium: {
    label: "Medium",
    className:
      "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dotClassName: "bg-blue-400",
  },
  low: {
    label: "Low",
    className:
      "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dotClassName: "bg-zinc-400",
  },
};

const TYPE_LABELS: Record<string, string> = {
  pii: "PII",
  phi: "PHI",
  credential: "Credential",
  financial: "Financial",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SanitizePage() {
  const [inputText, setInputText] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [state, setState] = React.useState<SanitizationState | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  // -- Scan handler --
  const handleScan = async () => {
    if (!inputText.trim()) return;
    setScanning(true);
    try {
      const res = await fetch("/api/docs/sanitize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setState(createInitialState(inputText, data.results));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // eslint-disable-next-line no-alert
      alert(`Scan error: ${msg}`);
    } finally {
      setScanning(false);
    }
  };

  // -- Decision handlers --
  const handleDecision = (resultId: string, action: DecisionType, custom?: string) => {
    if (!state) return;
    setState(recordDecision(state, resultId, action, custom));
    setEditingId(null);
    setEditValue("");
  };

  // -- Download handler --
  const handleDownload = () => {
    if (!state) return;
    const sanitized = applySanitization(state);
    const blob = new Blob([sanitized], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sanitized-document.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // -- Reset --
  const handleReset = () => {
    setState(null);
    setInputText("");
    setEditingId(null);
  };

  const stats = state ? getStats(state) : null;
  const allCriticalResolved = stats ? stats.criticalRemaining === 0 : false;

  // Sort results: critical first, then by position
  const sortedResults = state
    ? [...state.results].sort((a, b) => {
        const sev: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
        return a.position.start - b.position.start;
      })
    : [];

  return (
    <div className="flex min-h-screen bg-ct-base">
      {/* ================================================================= */}
      {/* LEFT PANEL — Upload / Input                                       */}
      {/* ================================================================= */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-ct-border-subtle bg-ct-surface p-4">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-ct-accent" />
          <h2 className="text-sm font-semibold text-ct-text-primary">
            Document Upload
          </h2>
        </div>

        <p className="mb-3 text-xs text-ct-text-tertiary">
          Paste document text below. Supported: plain text, Markdown. File
          upload coming soon.
        </p>

        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste document text here..."
          rows={12}
          disabled={!!state}
          className="mb-3 flex-1 resize-none border-ct-border-subtle bg-ct-surface-raised text-ct-text-primary placeholder:text-ct-text-tertiary text-xs font-mono"
        />

        {!state ? (
          <Button
            onClick={handleScan}
            disabled={!inputText.trim() || scanning}
            className="h-9 gap-2 rounded-lg bg-ct-accent text-sm font-semibold text-white hover:bg-ct-accent/90"
          >
            {scanning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldAlert className="size-4" />
            )}
            {scanning ? "Scanning..." : "Scan for Sensitive Data"}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-ct-border-subtle bg-ct-surface-raised px-3 py-2">
              <FileText className="size-4 text-ct-text-tertiary" />
              <span className="truncate text-xs text-ct-text-secondary">
                Pasted document
              </span>
              {stats && stats.total > 0 ? (
                <span className="ml-auto rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                  {stats.total} flagged
                </span>
              ) : (
                <ShieldCheck className="ml-auto size-4 text-emerald-400" />
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-ct-text-tertiary underline hover:text-ct-text-secondary"
            >
              Start over
            </button>
          </div>
        )}
      </aside>

      {/* ================================================================= */}
      {/* CENTER PANEL — Review                                             */}
      {/* ================================================================= */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-1 text-lg font-semibold text-ct-text-primary">
            Document Sanitization Review
          </h1>

          {!state && (
            <p className="text-sm text-ct-text-tertiary">
              Paste a document on the left and scan it. Flagged items will
              appear here for review.
            </p>
          )}

          {state && stats && (
            <>
              <p className="mb-6 text-sm text-ct-text-secondary">
                <span className="font-medium text-ct-text-primary">
                  {stats.total} item{stats.total !== 1 ? "s" : ""} flagged
                </span>{" "}
                &middot; {stats.resolved} resolved &middot; {stats.remaining}{" "}
                remaining
              </p>

              {stats.total === 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
                  <ShieldCheck className="size-6 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      No sensitive data detected
                    </p>
                    <p className="text-xs text-ct-text-tertiary">
                      This document appears clean. You can proceed with
                      ingestion.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {sortedResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    decision={state.decisions.get(result.id)}
                    customRedaction={state.customRedactions.get(result.id)}
                    isEditing={editingId === result.id}
                    editValue={editValue}
                    onStartEdit={() => {
                      setEditingId(result.id);
                      setEditValue(
                        state.customRedactions.get(result.id) ?? result.redacted,
                      );
                    }}
                    onEditChange={setEditValue}
                    onDecision={(action, custom) =>
                      handleDecision(result.id, action, custom)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ================================================================= */}
      {/* RIGHT PANEL — Summary                                             */}
      {/* ================================================================= */}
      {state && stats && (
        <aside className="flex w-[300px] shrink-0 flex-col gap-4 border-l border-ct-border-subtle bg-ct-surface p-4">
          {/* Stats card */}
          <div className="rounded-xl border border-ct-border-subtle bg-ct-surface-raised p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary">
              Scan Statistics
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-ct-text-tertiary">Total flagged</span>
              <span className="text-right font-medium text-ct-text-primary">
                {stats.total}
              </span>
              <span className="text-ct-text-tertiary">Resolved</span>
              <span className="text-right font-medium text-ct-text-primary">
                {stats.resolved}
              </span>
              <span className="text-ct-text-tertiary">Remaining</span>
              <span className="text-right font-medium text-ct-text-primary">
                {stats.remaining}
              </span>
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="rounded-xl border border-ct-border-subtle bg-ct-surface-raised p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary">
              Severity Breakdown
            </h3>
            <div className="flex flex-col gap-2">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const count = stats[sev];
                const max = Math.max(stats.total, 1);
                const pct = (count / max) * 100;
                const cfg = SEVERITY_CONFIG[sev];
                return (
                  <div key={sev} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-ct-text-tertiary capitalize">
                      {cfg.label}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-ct-base h-2">
                      <div
                        className={cn("h-full rounded-full transition-all", cfg.dotClassName)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-ct-text-secondary">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical status */}
          <div
            className={cn(
              "rounded-xl border p-4",
              allCriticalResolved
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-orange-500/30 bg-orange-500/5",
            )}
          >
            <div className="flex items-center gap-2">
              {allCriticalResolved ? (
                <ShieldCheck className="size-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="size-5 text-orange-400" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  allCriticalResolved
                    ? "text-emerald-400"
                    : "text-orange-400",
                )}
              >
                {allCriticalResolved
                  ? "All critical items resolved"
                  : `${stats.criticalRemaining} critical item${stats.criticalRemaining !== 1 ? "s" : ""} remaining`}
              </span>
            </div>
          </div>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            disabled={!allCriticalResolved}
            className="h-10 gap-2 rounded-xl bg-ct-accent text-sm font-semibold text-white hover:bg-ct-accent/90 disabled:opacity-40"
          >
            <Download className="size-4" />
            Download Sanitized Document
          </Button>

          {/* Audit trail */}
          {state.auditTrail.length > 0 && (
            <div className="rounded-xl border border-ct-border-subtle bg-ct-surface-raised p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ct-text-tertiary">
                Audit Trail
              </h3>
              <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
                {state.auditTrail.map((d, i) => {
                  const result = state.results.find((r) => r.id === d.resultId);
                  const actionLabel =
                    d.action === "accept"
                      ? "Accepted"
                      : d.action === "edit"
                        ? "Edited"
                        : "Skipped";
                  const actionColor =
                    d.action === "accept"
                      ? "text-emerald-400"
                      : d.action === "edit"
                        ? "text-blue-400"
                        : "text-zinc-400";
                  return (
                    <div
                      key={`${d.resultId}-${d.timestamp}-${i}`}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span className={cn("font-medium", actionColor)}>
                        {actionLabel}
                      </span>
                      <span className="text-ct-text-tertiary">
                        {result?.subtype ?? "unknown"}
                      </span>
                      <span className="ml-auto text-ct-text-tertiary">
                        {new Date(d.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result Card
// ---------------------------------------------------------------------------

interface ResultCardProps {
  result: ScanResult;
  decision?: DecisionType;
  customRedaction?: string;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onDecision: (action: DecisionType, custom?: string) => void;
}

function ResultCard({
  result,
  decision,
  customRedaction,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onDecision,
}: ResultCardProps) {
  const sev = SEVERITY_CONFIG[result.severity];
  const resolved = !!decision;

  return (
    <div
      className={cn(
        "rounded-xl border bg-ct-surface-raised p-4 transition-all",
        resolved
          ? "border-ct-border-subtle/50 opacity-70"
          : "border-ct-border-subtle",
      )}
    >
      {/* Header badges */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
            sev.className,
          )}
        >
          <span className={cn("size-1.5 rounded-full", sev.dotClassName)} />
          {sev.label}
        </span>
        <span className="rounded-md border border-ct-border-subtle bg-ct-surface px-2 py-0.5 text-[11px] font-medium text-ct-text-tertiary">
          {TYPE_LABELS[result.type] ?? result.type}
        </span>
        <span className="text-[11px] text-ct-text-tertiary">
          {result.subtype.replace(/_/g, " ")}
        </span>

        {resolved && (
          <span
            className={cn(
              "ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium",
              decision === "accept"
                ? "bg-emerald-500/15 text-emerald-400"
                : decision === "edit"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-zinc-500/15 text-zinc-400",
            )}
          >
            {decision === "accept"
              ? "Redacted"
              : decision === "edit"
                ? "Custom"
                : "Skipped"}
          </span>
        )}
      </div>

      {/* Original text */}
      <div className="mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ct-text-tertiary">
          Original
        </span>
        <div className="mt-1 rounded-lg border border-ct-border-subtle bg-ct-base px-3 py-2 font-mono text-xs text-red-400">
          {result.original}
        </div>
      </div>

      {/* Proposed redaction */}
      <div className="mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ct-text-tertiary">
          Proposed Redaction
        </span>
        <div className="mt-1 rounded-lg border border-ct-border-subtle bg-ct-base px-3 py-2 font-mono text-xs text-emerald-400">
          {customRedaction ?? result.redacted}
        </div>
      </div>

      {/* Context */}
      <div className="mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ct-text-tertiary">
          Context
        </span>
        <div className="mt-1 rounded-lg border border-ct-border-subtle bg-ct-base px-3 py-2 text-xs text-ct-text-secondary">
          {highlightContext(result.context)}
        </div>
      </div>

      {/* Actions */}
      {!resolved && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onDecision("accept")}
            size="sm"
            className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-500"
          >
            <Check className="size-3.5" />
            Accept Redaction
          </Button>

          {!isEditing ? (
            <Button
              onClick={onStartEdit}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-ct-border-subtle text-xs font-medium text-ct-text-secondary hover:bg-ct-surface hover:text-ct-text-primary"
            >
              <Pencil className="size-3.5" />
              Edit Redaction
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                className="h-8 w-48 border-ct-border-subtle bg-ct-surface text-xs text-ct-text-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onDecision("edit", editValue);
                  if (e.key === "Escape") onStartEdit(); // toggle off via parent
                }}
              />
              <Button
                onClick={() => onDecision("edit", editValue)}
                size="sm"
                className="h-8 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500"
              >
                Apply
              </Button>
            </div>
          )}

          <Button
            onClick={() => onDecision("skip")}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-ct-border-subtle text-xs font-medium text-ct-text-secondary hover:bg-ct-surface hover:text-ct-text-primary"
          >
            <SkipForward className="size-3.5" />
            Skip
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight context — text inside [ ] brackets is the match
// ---------------------------------------------------------------------------

function highlightContext(context: string): React.ReactNode {
  const parts = context.split(/(\[.*?\])/);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span key={i} className="rounded bg-red-500/20 px-0.5 font-medium text-red-400">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
