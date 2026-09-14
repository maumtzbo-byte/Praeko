import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  // La página de aterrizaje de los anuncios. Sin esto el middleware la
  // manda a /login, y cada clic pagado se convierte en un rebote.
  "/prueba",
  "/login",
  "/registro",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
  "/verificar-correo",
  "/auth/callback",
  "/privacidad",
  "/terminos",
  "/eliminar-datos",
];

// Next.js's file-convention routes (opengraph-image, robots.txt, etc.) don't
// end in an extension the middleware matcher already excludes (see
// middleware.ts), so without this they were silently redirecting crawlers
// and social-media unfurlers to /login instead of serving the asset —
// breaking link previews and, worse, robots.txt/sitemap.xml for SEO.
const CRAWLER_PATHS = ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/opengraph-image", "/icon.png", "/apple-icon.png"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (CRAWLER_PATHS.includes(pathname)) return true;
  // Static assets and Next internals never require a session.
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  // La liga de aprobación (/aprobar/<token>). Quien la abre es un cliente
  // que NO tiene cuenta en Frames y nunca la va a tener: la URL llega por
  // WhatsApp y el token ES la credencial (ver lib/aprobacion/liga.ts). Sin
  // esto, cada cliente que le pica a su liga rebota a /login —o sea, la
  // función entera estaba muerta en producción— y de paso el 307 delata la
  // ruta a cualquiera. La autorización la hace el token dentro de la
  // página, no una sesión.
  if (pathname.startsWith("/aprobar/")) return true;
  // Meta llama estas rutas directo (verificación + entrega de webhooks) sin
  // ninguna sesión de navegador — sin esto se irían con 307 a /login en vez
  // de llegar al route handler. Son DOS webhooks distintos con dos apps de
  // Meta: /api/webhooks/meta (comentarios y DMs) y /api/whatsapp/webhook
  // (Coexistence). La firma dentro de cada ruta (no una sesión) es lo que
  // de verdad autentica estas llamadas.
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/api/whatsapp/")) return true;
  return false;
}

/**
 * Refreshes the Supabase session on every request (so server components see
 * a valid, non-expired token) and gates access to everything that isn't
 * explicitly public. Onboarding-completion routing lives in the (app)
 * layout, not here — this only decides "signed in or not".
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/registro")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
