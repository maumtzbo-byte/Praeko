"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Provider = "google" | "apple";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.24 21.3 7.28 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.6H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.437 2.19-1.184 2.99-.788.85-2.13 1.5-3.243 1.41-.13-1.09.417-2.24 1.156-3.03.79-.85 2.15-1.48 3.27-1.37zM20.85 17.16c-.51 1.18-.75 1.71-1.4 2.75-.91 1.46-2.19 3.28-3.78 3.29-1.41.02-1.77-.92-3.68-.9-1.9.01-2.31.92-3.72.9-1.59-.02-2.8-1.66-3.71-3.12-2.54-4.06-2.81-8.83-1.24-11.37 1.11-1.8 2.87-2.85 4.53-2.85 1.7 0 2.76.94 4.16.94 1.36 0 2.19-.94 4.15-.94 1.48 0 3.05.81 4.16 2.2-3.66 2.01-3.07 7.24.53 9.1z" />
    </svg>
  );
}

/** Google + Apple sign-in, shared by the login and register forms — the
 * two behave identically here (Supabase creates the account on first OAuth
 * sign-in, same as any returning sign-in), and where they land differs by
 * app logic downstream, not by anything this component needs to know: a
 * brand-new user always gets redirected from /dashboard to /onboarding
 * regardless of how they signed up (see getCurrentBusiness), so pointing
 * both flows at /dashboard is correct either way.
 *
 * Functional once Google/Apple are actually enabled as providers in the
 * Supabase project's Auth settings with real OAuth credentials — that's a
 * dashboard-level configuration step, not something this code can turn on
 * by itself. Until then these buttons will surface whatever error Supabase
 * returns for a disabled provider. */
export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: Provider) {
    setError(null);
    setLoadingProvider(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setError(error.message);
      setLoadingProvider(null);
    }
    // On success Supabase navigates the browser away to the provider —
    // there's nothing left to do here.
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2.5"
        loading={loadingProvider === "google"}
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("google")}
      >
        <GoogleIcon />
        Continuar con Google
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2.5"
        loading={loadingProvider === "apple"}
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("apple")}
      >
        <AppleIcon />
        Continuar con Apple
      </Button>
    </div>
  );
}

export function OAuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs text-zinc-400">o continúa con correo</span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}
