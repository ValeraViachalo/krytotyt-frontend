"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import "./CablesCanvas.scss";

export default function CablesCanvas({ projectsData }) {
  const router = useRouter();
  const patchRef = useRef(null);
  const initializedRef = useRef(false);

  // Build the projectsData array expected by the CABLES patch

  function initPatch() {
    if (initializedRef.current || !window.CABLES?.exportedPatch) return;
    initializedRef.current = true;

    function projectClickedSlug(params) {
      const slug =
        Array.isArray(params) && params[0] != null
          ? String(params[0])
          : params != null
            ? String(params)
            : "";
      if (slug) router.push(`/cases/${slug}`);
    }

    // Expose globally so CABLES CallBack_v2 can reach it
    window.projectClickedSlug = projectClickedSlug;

    patchRef.current = new CABLES.Patch({
      patch: CABLES.exportedPatch,
      prefixAssetPath: "",
      assetPath: "/cables/assets/",
      jsPath: "/cables/js/",
      glCanvasId: "cables-canvas",
      glCanvasResizeToWindow: true,
      onError: (initiator, ...args) =>
        console.error("[CABLES]", initiator, ...args),
      onPatchLoaded: () => {
        console.log("[CABLES] Patch loaded");
      },
      onFinishedLoading: () => {
        console.log("[CABLES] Finished loading");
        patchRef.current.setVariable("zoomState", 1);
        patchRef.current.setVariable("projectsData", projectsData);
      },
      projectClickedSlug,
      variables: {
        zoomState: 0,
        projectsData,
      },
    });
  }

  // If CABLES is already loaded (hot reload / back-navigation), init immediately
  useEffect(() => {
    const handler = () => initPatch();
    document.addEventListener("CABLES.jsLoaded", handler);

    // Script may have already fired before this effect ran
    if (window.CABLES?.exportedPatch && !initializedRef.current) initPatch();

    return () => {
      document.removeEventListener("CABLES.jsLoaded", handler);
      // Destroy patch on unmount to free WebGL context
      patchRef.current?.pause?.();
      patchRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  return (
    <div className="cables-wrapper">
      <canvas
        id="cables-canvas"
        className="cables-canvas"
        tabIndex={1}
        />
        <Script
        src="/cables/patch.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
