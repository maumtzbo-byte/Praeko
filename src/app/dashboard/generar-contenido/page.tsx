import { redirect } from "next/navigation";

// "Generar plan de 7 días" (this page's only real action) moved into
// /dashboard/publicaciones — its actions.ts stays at this path since
// onboarding-reveal.tsx still imports generateContentPlan from here. Kept
// as a redirect instead of a 404 for anyone with the old URL bookmarked.
export default function GenerarContenidoPage() {
  redirect("/dashboard/publicaciones");
}
