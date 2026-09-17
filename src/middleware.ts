import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = _request;
  const response = NextResponse.next();
  // These are already set via vercel.json on Vercel; this covers other environments
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};