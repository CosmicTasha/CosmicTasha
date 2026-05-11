'use client';

import { useState, useEffect } from 'react';
import type { Tier } from '@/lib/tier';
import { getCurrentTier } from '@/lib/tier';

const CYCLE_TIERS: Tier[] = ['discovery', 'starter', 'growth'];

const TIER_COLORS: Record<Tier, string> = {
  discovery: 'bg-ct-text-tertiary/20 text-ct-text-tertiary',
  starter: 'bg-ct-accent/20 text-ct-accent',
  growth: 'bg-ct-status-strength/20 text-ct-status-strength',
  enterprise: 'bg-ct-accent-secondary/20 text-ct-accent-secondary',
  consultant: 'bg-ct-accent-secondary/20 text-ct-accent-secondary',
};

export function DevTierSwitcher() {
  const [tier, setTier] = useState<Tier>('discovery');

  useEffect(() => {
    // Initial localStorage read on mount — SSR-safe deferred load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTier(getCurrentTier());
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  function cycleTier() {
    const currentIndex = CYCLE_TIERS.indexOf(tier);
    const nextIndex = (currentIndex + 1) % CYCLE_TIERS.length;
    const nextTier = CYCLE_TIERS[nextIndex];
    localStorage.setItem('cosmictasha_tier', nextTier);
    setTier(nextTier);
    window.location.reload();
  }

  return (
    <button
      onClick={cycleTier}
      className={`fixed bottom-4 right-4 z-50 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg transition-colors ${TIER_COLORS[tier] ?? TIER_COLORS.discovery}`}
      title={`Current tier: ${tier} (click to cycle)`}
    >
      {tier}
    </button>
  );
}
