import { withAuth } from "@/lib/auth/middleware";
import { verifyOwnership } from "@/lib/auth/session-ownership";
import { soc2Engine } from "@/lib/compliance-kb";
import { db } from "@/db";
import { intakeAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, session) => {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (!(await verifyOwnership(sessionId, session.userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const answers = await db.query.intakeAnswers.findMany({
    where: eq(intakeAnswers.sessionId, sessionId),
  });

  const answerMap: Record<string, unknown> = {};
  for (const a of answers) {
    answerMap[a.questionId] = a.value;
  }

  const score = soc2Engine.score(answerMap);

  return Response.json(score);
});
