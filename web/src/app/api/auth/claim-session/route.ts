import { withAuth } from "@/lib/auth/middleware";
import { claimSession } from "@/lib/auth/session-ownership";

export const POST = withAuth(async (req, session) => {
  const { sessionId } = await req.json();
  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const result = await claimSession(sessionId, session.userId);

  switch (result) {
    case "claimed":
      return Response.json({ ok: true });
    case "already_claimed":
      return Response.json({ error: "Session belongs to another account" }, { status: 409 });
    case "not_found":
      return Response.json({ error: "Session not found" }, { status: 404 });
  }
});
