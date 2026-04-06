import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ct-base px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-ct-accent">404</p>

        <h1 className="mt-4 text-2xl font-bold text-ct-text-primary">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ct-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-xl bg-ct-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-ct-accent/90"
          >
            Go Home
          </Link>

          <Link
            href="/intake"
            className="text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
