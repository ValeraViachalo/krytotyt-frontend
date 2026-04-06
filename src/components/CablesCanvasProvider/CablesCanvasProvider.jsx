"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import CablesCanvas from "@/components/HomePage/CablesCanvas/CablesCanvas";

export default function CablesCanvasProvider({ projectsData }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className="cables-global-wrapper"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: isHome ? 1 : -1,
        pointerEvents: isHome ? "auto" : "none",
        opacity: isHome ? 1 : 0,
      }}
    >
      <CablesCanvas projectsData={projectsData} />
    </div>
  );
}
