export type Tier = 'discovery' | 'starter' | 'growth' | 'enterprise' | 'consultant';

export function getCurrentTier(): Tier {
  // For now, check localStorage for a tier override (dev testing)
  // In production, this comes from the auth session / Stripe subscription
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('cosmictasha_tier');
    if (override && ['discovery', 'starter', 'growth', 'enterprise', 'consultant'].includes(override)) {
      return override as Tier;
    }
  }
  return 'discovery'; // default free tier
}

export function isPaidTier(tier: Tier): boolean {
  return tier !== 'discovery';
}

export function canGenerateDocs(tier: Tier): boolean {
  return isPaidTier(tier);
}

export function canSeeFullGaps(tier: Tier): boolean {
  return isPaidTier(tier);
}
