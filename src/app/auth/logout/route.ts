import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Explicit 303: NextResponse.redirect() defaults to 307 for a POST route
  // handler, and a 307 tells the browser to replay the *same method* against
  // the new URL — so the sign-out form's POST would get redirected into a
  // POST to /login, a page with no POST handler, rendering as a blank 405.
  // 303 forces the browser to follow up with a GET instead.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
