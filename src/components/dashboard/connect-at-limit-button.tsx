"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UpgradePlanModal } from "@/components/dashboard/upgrade-plan-modal";

/** Same "Conectar" affordance as an unblocked platform card, not a muted
 * "you can't do this" link — clicking it still feels like starting the
 * connection, and the upgrade prompt only shows up once someone's actually
 * expressed intent, not as a passive wall they have to notice first. */
export function ConnectAtLimitButton() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <Button size="sm" className="w-full" onClick={() => setShowUpgrade(true)}>
        Conectar
      </Button>
      {showUpgrade && <UpgradePlanModal reason="redes" onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
