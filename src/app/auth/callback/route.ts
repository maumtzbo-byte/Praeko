import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for every Supabase auth email link (signup confirmation,
 * password recovery) — exchanges the PKCE code for a session, then forwards
 * to whatever `next` the link was built with.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
