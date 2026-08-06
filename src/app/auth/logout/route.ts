import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // supabase.auth.signOut() calls out to Supabase's auth server to
    // invalidate the refresh token — a route handler has no error
    // boundary the way a rendered page does, so if that call throws
    // (session already gone, a transient network blip, a double
    // sign-out click), the whole handler used to crash and the browser
    // got a bare, unstyled 500 with no body: a blank white screen
    // instead of ever reaching /login. Sign-out failing server-side
    // still isn't a reason to strand the user here — redirect them out
    // either way.
    await supabase.auth.signOut();
  } catch (err) {
    console.error("supabase.auth.signOut failed", err);
  }
  // Explicit 303: NextResponse.redirect() defaults to 307 for a POST route
  // handler, and a 307 tells the browser to replay the *same method* against
  // the new URL — so the sign-out form's POST would get redirected into a
  // POST to /, a page with no POST handler, rendering as a blank 405.
  // 303 forces the browser to follow up with a GET instead.
  return NextResponse.redirect(new URL("/", request.url), 303);
}
