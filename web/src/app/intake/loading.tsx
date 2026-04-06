export default function IntakeLoading() {
  return (
    <div className="min-h-screen bg-ct-base">
      {/* Left sidebar skeleton */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[280px] flex-col border-r border-white/[0.06] bg-ct-surface">
        {/* Wordmark */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold tracking-tight text-ct-accent">
            CosmicTasha
          </h2>
          <div className="mt-2 h-3 w-36 animate-pulse rounded bg-ct-surface-raised" />
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Progress bar skeleton */}
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 animate-pulse rounded bg-ct-surface-raised" />
            <div className="h-3 w-20 animate-pulse rounded bg-ct-surface-raised" />
          </div>
          <div className="mt-2 h-1 w-full rounded-full bg-ct-surface-raised" />
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Stage list skeleton */}
        <nav className="flex-1 space-y-1 px-3 py-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-ct-surface-raised" />
              <div
                className="h-4 animate-pulse rounded bg-ct-surface-raised"
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content skeleton */}
      <main className="ml-[280px] min-h-screen">
        <div className="mx-auto max-w-[720px] px-8 py-12">
          <div className="h-7 w-3/5 animate-pulse rounded bg-ct-surface-raised" />
          <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-ct-surface-raised" />
          <div className="mt-8 h-5 w-2/5 animate-pulse rounded bg-ct-surface-raised" />
        </div>
      </main>
    </div>
  );
}
