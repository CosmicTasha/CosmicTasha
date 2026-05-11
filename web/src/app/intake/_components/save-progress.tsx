"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function SaveProgress({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [devLink, setDevLink] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.message || "Something went wrong");
        return;
      }

      setStatus("success");

      // In dev mode, the API returns the magic link for testing
      if (data.magicLink) {
        setDevLink(data.magicLink);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "rounded-lg border border-ct-accent/30 bg-ct-surface p-4",
          className,
        )}
      >
        <p className="text-sm font-medium text-ct-text-primary">
          Check your email for a link to resume.
        </p>
        <p className="mt-1 text-xs text-ct-text-secondary">
          The link expires in 15 minutes.
        </p>

        {devLink && (
          <a
            href={devLink}
            className="mt-2 inline-block text-xs text-ct-accent underline"
          >
            [Dev] Open magic link
          </a>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-lg border border-white/[0.08] bg-ct-surface p-4",
        className,
      )}
    >
      <p className="text-sm font-medium text-ct-text-primary">
        Save your progress
      </p>
      <p className="mt-0.5 text-xs text-ct-text-secondary">
        Enter your email to save and resume later
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-0 flex-1 rounded-md border border-white/[0.1] bg-ct-surface-raised px-3 py-1.5 text-sm text-ct-text-primary placeholder:text-ct-text-secondary/50 focus:border-ct-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="shrink-0 rounded-md bg-ct-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? "Sending..." : "Send Magic Link"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
