import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { getAdapter, isSocialPlatform } from "@/lib/social";

const STATE_COOKIE = "social_oauth_state";
const PENDING_COOKIE = "social_oauth_pending";

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform: platformParam } = await params;
  const { origin, searchParams } = new URL(request.url);

  if (!isSocialPlatform(platformParam)) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=unknown_platform`);
  }
  const platform = platformParam;

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !returnedState || !stateCookie) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=oauth_failed`);
  }

  let parsedState: { state: string; businessId: string; platform: string };
  try {
    parsedState = JSON.parse(stateCookie);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=oauth_failed`);
  }

  if (parsedState.state !== returnedState || parsedState.platform !== platform) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=oauth_failed`);
  }

  // The state cookie proves this browser started the flow; also confirm
  // the signed-in user still belongs to the business it started for.
  const { business } = await getCurrentBusiness();
  if (business.id !== parsedState.businessId) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=oauth_failed`);
  }

  const adapter = getAdapter(platform);
  const redirectUri = `${origin}/social/${platform}/callback`;

  let accounts;
  try {
    accounts = await adapter.listConnectableAccounts(code, redirectUri);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=oauth_failed`);
  }

  if (accounts.length === 0) {
    return NextResponse.redirect(`${origin}/dashboard/redes-sociales?error=no_accounts`);
  }

  const response = NextResponse.redirect(`${origin}/social/${platform}/choose`);
  response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/social" });
  response.cookies.set(
    PENDING_COOKIE,
    JSON.stringify({ businessId: business.id, platform, accounts }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/social",
    },
  );
  return response;
}
