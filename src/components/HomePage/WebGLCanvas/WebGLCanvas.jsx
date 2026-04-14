'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initInfiniteCanvas } from './InfiniteCanvas.js';

export default function WebGLCanvas({ projectsData, debug = false, settings = {} }) {
  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !projectsData?.length) return;

    const cleanup = initInfiniteCanvas(container, {
      items: projectsData,
      debug,
      settings,
      onItemClick: (item) => {
        if (item?.slug) {
          router.push(`/cases/${item.slug}`);
        }
      },
    });

    function onCanvasNavigate(e) {
      if (e.detail?.slug) {
        router.push(`/cases/${e.detail.slug}`);
      }
    }
    container.addEventListener('canvas:navigate', onCanvasNavigate);

    return () => {
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
