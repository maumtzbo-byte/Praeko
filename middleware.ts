import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match everything except static files and images, so every navigable
     * route gets a fresh session check. mp4/webm added after the earth
     * globe video in StatsShowcase.tsx was silently 307-redirected to
     * /login for signed-out visitors — the same asset-vs-route problem
     * images already needed excluding for.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
