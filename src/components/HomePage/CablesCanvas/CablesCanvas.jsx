"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./CablesCanvas.scss";

const PATCH_DIR = "/cables/";
const CANVAS_ID = "cables-canvas";

export default function CablesCanvas({
  projectsData,
  patchDir = PATCH_DIR,
  canvasId = CANVAS_ID,
  patchOptions: patchOptionsProp = {},
}) {
  const router = useRouter();
  const patchRef = useRef(null);
  const initializedRef = useRef(false);
  const scriptRef = useRef(null);

  const initPatch = useCallback(() => {
    if (initializedRef.current) return;
    if (!window.CABLES?.exportedPatch) return;
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

    const options = {
      patch: CABLES.exportedPatch,
      prefixAssetPath: '/',
      jsPath: patchDir + "js/",
      glCanvasId: canvasId,
      glCanvasResizeToWindow: true,
      canvas: { alpha: true, premultipliedAlpha: true },
      onError: (initiator, ...args) =>
        console.error("[CABLES]", initiator, ...args),
      onPatchLoaded: () => {
        console.log("[CABLES] Patch loaded");
      },
      onFinishedLoading: () => {
        console.log("[CABLES] Finished loading");
        patchRef.current?.setVariable("zoomState", 1);
        patchRef.current?.setVariable("projectsData", projectsData);
      },
      projectClickedSlug,
      variables: {
        zoomState: 0,
        projectsData,
      },
      ...patchOptionsProp,
    };

    patchRef.current = new CABLES.Patch(options);
  }, [router, patchDir, canvasId, projectsData, patchOptionsProp]);

  useEffect(() => {
    // If script was already loaded (e.g. hot-reload / back-navigation)
    if (window.CABLES?.exportedPatch && !initializedRef.current) {
      initPatch();
      return;
    }

    // Dynamically inject the patch script (like the reference CablesPatch)
    const script = document.createElement("script");
    script.src = patchDir + "patch.js";
    script.async = true;
    script.onload = () => initPatch();
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Fully destroy patch on unmount to free WebGL context
      if (patchRef.current) {
        patchRef.current.pause?.();
        patchRef.current.close?.();
        patchRef.current = null;
      }
      initializedRef.current = false;

      // Clean up global references
      if (window.projectClickedSlug) {
        delete window.projectClickedSlug;
      }

      // Clean up injected script
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }

      // Remove CABLES exported patch so it re-initializes on next mount
      if (window.CABLES?.exportedPatch) {
        delete window.CABLES.exportedPatch;
      }
    };
  }, [patchDir, initPatch]);

  return (
    <div className="cables-wrapper">
      <canvas
        id={canvasId}
        className="cables-canvas"
        tabIndex={1}
      />
    </div>
  );
}
