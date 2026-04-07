import { db } from "@/db";
import { intakeSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function verifyOwnership(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const session = await db.query.intakeSessions.findFirst({
    where: and(
      eq(intakeSessions.id, sessionId),
      eq(intakeSessions.userId, userId)
    ),
    columns: { id: true },
  });
  return session !== undefined;
}

export async function claimSession(
  intakeSessionId: string,
  userId: string
): Promise<"claimed" | "already_claimed" | "not_found"> {
  const result = await db
    .update(intakeSessions)
    .set({ userId })
    .where(
      and(
        eq(intakeSessions.id, intakeSessionId),
        isNull(intakeSessions.userId)
      )
    )
    .returning({ id: intakeSessions.id });

  if (result.length > 0) return "claimed";

  const existing = await db.query.intakeSessions.findFirst({
    where: eq(intakeSessions.id, intakeSessionId),
    columns: { userId: true },
  });

  if (!existing) return "not_found";
  return "already_claimed";
}
