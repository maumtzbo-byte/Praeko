import { redirect } from "next/navigation";

// Calendario and Publicaciones showed the same content_calendar data as two
// separate pages — merged into one page (list/calendar toggle) at
// /dashboard/publicaciones. Kept as a redirect instead of a 404 for anyone
// with the old URL bookmarked.
export default function CalendarioPage() {
  redirect("/dashboard/publicaciones");
}
