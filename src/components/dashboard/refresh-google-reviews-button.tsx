"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { refreshGoogleReviews } from "@/app/dashboard/redes-sociales/actions";

/** Google's real push mechanism for new reviews (Cloud Pub/Sub) needs its
 * own GCP topic/subscription setup — see google-business.ts — so a manual
 * click is the actual "get current data" affordance for now, same idea as
 * RefreshStatusButton for fal.ai generation jobs elsewhere in the app. */
export function RefreshGoogleReviewsButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    const res = await refreshGoogleReviews();
    setRefreshing(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(res.data.newReviews > 0 ? `${res.data.newReviews} reseña(s) nueva(s).` : "Ya tienes las reseñas más recientes.");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleRefresh} loading={refreshing}>
      <RotateCcw className="h-3.5 w-3.5" />
      Actualizar reseñas
    </Button>
  );
}
