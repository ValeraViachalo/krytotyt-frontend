"use client";

import { usePathname } from "next/navigation";
import WebGLCanvas from "@/components/HomePage/WebGLCanvas/WebGLCanvas";

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
      <WebGLCanvas projectsData={projectsData} />
    </div>
  );
}
