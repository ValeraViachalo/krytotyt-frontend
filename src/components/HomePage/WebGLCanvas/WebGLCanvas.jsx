'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initInfiniteCanvas } from './InfiniteCanvas.js';

export default function WebGLCanvas({ projectsData, debug = false, settings = {} }) {
  const router     = useRouter();
  const containerRef = useRef(null);
  const hapticsRef   = useRef(null);

  // Initialise WebHaptics once on the client — lazy so it never blocks render
  useEffect(() => {
    import('web-haptics').then(({ WebHaptics }) => {
      hapticsRef.current = new WebHaptics();
    }).catch(() => {});
  }, []);

  function triggerHaptic() {
    try {
      if (hapticsRef.current) {
        hapticsRef.current.trigger('medium');
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (_) {}
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !projectsData?.length) return;

    const cleanup = initInfiniteCanvas(container, {
      items: projectsData,
      debug,
      settings,
      onItemTap:   () => triggerHaptic(),
      onItemClick: (item) => {
        if (item?.slug) {
          router.push(`/cases/${item.slug}`);
        }
      },
    });

    // Expose console toggle — toggles the panel in-place, no canvas reinit
    window.__canvasDebug = () => cleanup.toggleDebug();

    function onCanvasNavigate(e) {
      if (e.detail?.slug) {
        router.push(`/cases/${e.detail.slug}`);
      }
    }
    container.addEventListener('canvas:navigate', onCanvasNavigate);

    return () => {
      delete window.__canvasDebug;
      container.removeEventListener('canvas:navigate', onCanvasNavigate);
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsData]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}
