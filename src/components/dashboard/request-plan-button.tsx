"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanRequestModal from "./plan-request-modal";

export default function RequestPlanButton({
  businessName,
  planDisplayName,
  priceUsd,
  featured,
}: {
  businessName: string;
  planDisplayName: string;
  priceUsd: number;
  featured?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={featured ? undefined : "secondary"}
        className={featured ? "w-full bg-accent text-white hover:bg-accent-strong" : "w-full"}
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4" />
        Solicitar este plan
      </Button>
      <PlanRequestModal
        open={open}
        onClose={() => setOpen(false)}
        businessName={businessName}
        planDisplayName={planDisplayName}
        priceUsd={priceUsd}
      />
    </>
  );
}
