import { db } from "@/db";
import { subscriptions } from "@/db/auth-schema";
import { eq, and, gt, desc } from "drizzle-orm";

export type Tier = 'discovery' | 'starter' | 'growth' | 'enterprise' | 'consultant';

export async function getTierFromDb(userId: string): Promise<Tier> {
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      gt(subscriptions.endsAt, new Date())
    ),
    orderBy: [desc(subscriptions.createdAt)],
    columns: { tier: true },
  });

  return (sub?.tier as Tier) ?? "discovery";
}

/** @deprecated Use getTierFromDb() on the server. Client-side only for demo mode. */
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
