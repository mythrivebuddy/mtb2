"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MakeoverDashboardClientGate({
  isDayLocked,
}: {
  isDayLocked: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const didRedirect = sessionStorage.getItem("focus-redirected");

    if (!isDayLocked && !didRedirect) {
      sessionStorage.setItem("focus-redirected", "1");
      router.replace("/dashboard/complete-makeover-program/todays-actions");
    }

    if (isDayLocked) {
      sessionStorage.removeItem("focus-redirected");
    }
  }, [isDayLocked, router]);

  return null;
}
