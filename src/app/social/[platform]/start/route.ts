import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";
import { getAdapter, isSocialPlatform, isPublishablePlatform } from "@/lib/social";

const STATE_COOKIE = "social_oauth_state";

/**
 * Kicks off the OAuth dance for one platform. Route handlers live under
 * src/app/social/ (not dashboard/) because they're redirects, not pages —
 * mirrors the existing src/app/auth/callback + auth/logout pair.
 */
export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform: platformParam } = await params;
  const { origin } = new URL(request.url);

  if (!isSocialPlatform(platformParam)) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=unknown_platform`);
  }
  const platform = platformParam;

  const { business } = await getCurrentBusiness();
  const adapter = getAdapter(platform);

  if (!adapter.isConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=not_configured`);
  }

  const supabase = await createClient();
  const [{ data: subscription }, { data: existingConnections }] = await Promise.all([
    supabase.from("subscriptions").select("plan_key").eq("business_id", business.id).maybeSingle(),
    supabase.from("social_connections").select("platform").eq("business_id", business.id),
  ]);

  const { data: plan } = await supabase
    .from("plans")
    .select("social_network_limit")
    .eq("key", subscription?.plan_key ?? "basico")
    .single();

  const alreadyConnectedThisPlatform = existingConnections?.some((c) => c.platform === platform) ?? false;
  const connectedCount = existingConnections?.filter((c) => isPublishablePlatform(c.platform)).length ?? 0;
  if (isPublishablePlatform(platform) && !alreadyConnectedThisPlatform && connectedCount >= (plan?.social_network_limit ?? 1)) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=plan_limit`);
  }

  const state = randomUUID();
  const redirectUri = `${origin}/social/${platform}/callback`;
  const response = NextResponse.redirect(adapter.getAuthorizeUrl(state, redirectUri));
  response.cookies.set(STATE_COOKIE, JSON.stringify({ state, businessId: business.id, platform }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/social",
  });
  return response;
}
