"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/navigation";
import "./CablesCanvas.scss";

const PATCH_DIR = "/cables/";
const CANVAS_ID = "cables-canvas";

function CablesCanvas({
  projectsData,
  patchDir = PATCH_DIR,
  canvasId = CANVAS_ID,
  patchOptions: patchOptionsProp = {},
}, ref) {
  const router = useRouter();
  const patchRef = useRef(null);
  const initializedRef = useRef(false);

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
        patchRef.current?.setVariable("projectsData", projectsData);
        window.dispatchEvent(new Event("cables:patch-ready"));
      },
      projectClickedSlug,
      variables: {
        projectsData,
      },
      ...patchOptionsProp,
    };

    patchRef.current = new CABLES.Patch(options);
    CABLES.patch = patchRef.current;
  }, [router, patchDir, canvasId, projectsData, patchOptionsProp]);

  useImperativeHandle(ref, () => ({
    pause: () => {
      const p = patchRef.current;
      if (!p) return;
      p.config.doRequestAnimation = false;
      p.pause();
    },
    resume: () => {
      const p = patchRef.current;
      if (!p) return;
      p.config.doRequestAnimation = true;
      p.resume();
      p.renderloop?.resume();
    },
  }), []);

  useEffect(() => {
    // If CABLES is already available, just init
    if (window.CABLES?.exportedPatch && !initializedRef.current) {
      initPatch();
      return;
    }

    // Dynamically inject the patch script
    const script = document.createElement("script");
    script.src = patchDir + "patch.js";
    script.async = true;
    script.onload = () => initPatch();
    document.body.appendChild(script);

    // No cleanup — this component lives permanently in the layout
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

export default forwardRef(CablesCanvas);
