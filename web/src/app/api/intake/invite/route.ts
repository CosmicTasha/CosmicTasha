import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
}
