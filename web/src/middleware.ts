import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit auth endpoints
  if (pathname.startsWith("/api/auth/magic-link")) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`magic:${ip}`, 5, 3600_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/auth/verify")) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`verify:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // CSRF: validate Origin on state-changing requests
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    if (pathname.startsWith("/api/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: "CSRF rejected" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
