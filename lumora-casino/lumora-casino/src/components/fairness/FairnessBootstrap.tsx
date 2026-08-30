"use client";

import { useEffect } from "react";
import { useCasinoStore } from "@/lib/store/casino";

export function FairnessBootstrap() {
  const init = useCasinoStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}
