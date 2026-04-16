/**
 * InfiniteCanvasNextJS.jsx
 *
 * Drop-in React component for Next.js (App Router or Pages Router).
 * Wraps initInfiniteCanvas in a useEffect so the WebGL context is properly
 * mounted / cleaned up with the component lifecycle.
 *
 * Usage (App Router):
 *   'use client';
 *   import InfiniteCanvas from '@/components/InfiniteCanvas';
 *
 *   export default function Page({ projects }) {
 *     return (
 *       <InfiniteCanvas
 *         items={projects}
 *         onNavigate={(slug) => router.push(slug)}
 *         className="w-screen h-screen"
 *       />
 *     );
 *   }
 *
 * Item shape:
 *   { image: string | null, name: string, slug: string }
 *
 *   image — absolute URL, relative path, or null (uses generated placeholder).
 *           For Next.js public folder: '/projects/foo/cover.jpg'
 *           For a CDN:                 'https://cdn.example.com/img/foo.jpg'
 */

'use client';

import { useEffect, useRef } from 'react';
import { initInfiniteCanvas } from './InfiniteCanvas.js';

/**
 * @param {Object}   props
 * @param {Array}    props.items          - [{ image, name, slug }]
 * @param {Function} [props.onNavigate]   - called with slug on image click
 * @param {boolean}  [props.debug]        - show debug panel (default false)
 * @param {Object}   [props.settings]     - override default canvas settings
 * @param {string}   [props.className]    - tailwind / CSS class on the wrapper div
 * @param {Object}   [props.style]        - inline style on the wrapper div
 */
export default function InfiniteCanvas({
  items = [],
  onNavigate,
  debug = false,
  settings = {},
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mount the canvas
    const cleanup = initInfiniteCanvas(container, { items, debug, settings });

    // Forward navigation events to the caller
    function onCanvasNavigate(e) {
      onNavigate?.(e.detail.slug, e.detail);
    }
    container.addEventListener('canvas:navigate', onCanvasNavigate);

    // Returned function is called by React when the component unmounts
    return () => {
      container.removeEventListener('canvas:navigate', onCanvasNavigate);
      cleanup();
    };
  // Re-initialise only when the items array reference changes (e.g. new fetch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    />
  );
}
