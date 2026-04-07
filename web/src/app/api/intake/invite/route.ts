import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { verifyOwnership } from "@/lib/auth/session-ownership";

export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();

    const { sessionId, email, name, message, stage } = body as {
      sessionId: string;
      email: string;
      name?: string;
      message?: string;
      stage: number;
    };

    if (!sessionId || !email || stage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, email, stage" },
        { status: 400 }
      );
    }

    if (!(await verifyOwnership(sessionId, session.userId))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const inviteId = "stub_" + Date.now();

    // Dev debugging — log the invite
    console.log("[invite] New collaboration invite:", {
      inviteId,
      sessionId,
      email,
      name: name ?? "(not provided)",
      message: message ?? "(no message)",
      stage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, inviteId });
  } catch (err) {
    console.error("[invite] Failed to process invite:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
});
