import { cookies } from "next/headers";
import { lucia } from "./lucia";

interface AuthSession {
  userId: string;
  sessionId: string;
}

type AuthHandler = (
  req: Request,
  session: AuthSession
) => Promise<Response>;

export function withAuth(handler: AuthHandler) {
  return async (req: Request): Promise<Response> => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

    if (!sessionId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (!session) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }

    return handler(req, { userId: user.id, sessionId: session.id });
  };
}
