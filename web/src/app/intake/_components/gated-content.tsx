'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { Tier } from '@/lib/tier';
import { isPaidTier } from '@/lib/tier';

// ---------------------------------------------------------------------------
// BlurredContent — wraps content that's hidden for discovery tier
// ---------------------------------------------------------------------------

interface BlurredContentProps {
  children: React.ReactNode;
  tier: Tier;
  requiredTier?: Tier;
  blurMessage?: string;
}

export function BlurredContent({
  children,
  tier,
  requiredTier = 'starter',
  blurMessage = 'Upgrade to see details',
}: BlurredContentProps) {
  // For now, any paid tier meets any requirement
  const hasAccess =
    requiredTier === 'discovery' ? true : isPaidTier(tier);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content behind the overlay */}
      <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-ct-border-subtle bg-ct-surface/95 px-6 py-4 text-center shadow-lg backdrop-blur-sm">
          <Lock className="h-4 w-4 text-ct-text-tertiary" />
          <p className="text-sm font-medium text-ct-text-secondary">
            {blurMessage}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-lg bg-ct-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ct-accent/90"
          >
            Upgrade to Starter &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LockedFeature — for features that are completely locked
// ---------------------------------------------------------------------------

interface LockedFeatureProps {
  title: string;
  description: string;
  tier: Tier;
}

export function LockedFeature({ title, description, tier }: LockedFeatureProps) {
  if (isPaidTier(tier)) return null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-ct-border-subtle bg-ct-surface p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ct-accent/10">
        <Lock className="h-5 w-5 text-ct-accent" />
      </div>
      <h3 className="text-sm font-semibold text-ct-text-primary">{title}</h3>
      <p className="max-w-sm text-xs leading-relaxed text-ct-text-secondary">
        {description}
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 rounded-lg bg-ct-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-ct-accent/90"
      >
        Upgrade to unlock &rarr;
      </Link>
    </div>
  );
}
