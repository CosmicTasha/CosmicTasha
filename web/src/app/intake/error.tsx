"use client";

import Link from "next/link";

export default function IntakeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ct-base px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ct-status-gap-critical/15">
          <svg
            className="h-6 w-6 text-ct-status-gap-critical"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-ct-text-primary">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ct-text-secondary">
          {error.message || "An unexpected error occurred while loading the intake assessment."}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center rounded-xl bg-ct-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-ct-accent/90"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
