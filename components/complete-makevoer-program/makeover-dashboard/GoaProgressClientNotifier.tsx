// GoaProgressClientEvaluator.tsx
"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

export default function GoaProgressClientEvaluator({
  programId,
//   shouldEvaluate,
}: {
  programId: string;
//   shouldEvaluate: boolean;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    firedRef.current = true;

    // fire-and-forget
    axios
      .post("/api/makeover-program/goa-progress", { programId })
      .catch(() => {});
  }, [programId]);

  return null;
}
