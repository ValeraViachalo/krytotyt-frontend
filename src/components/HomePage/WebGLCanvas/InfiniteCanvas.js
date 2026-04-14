/**
 * InfiniteCanvas — public API
 *
 * Single entry point for both standalone HTML usage and Next.js integration.
 *
 * Usage:
 *   import { initInfiniteCanvas } from './InfiniteCanvas.js';
 *
 *   const cleanup = initInfiniteCanvas(containerElement, {
 *     items: [{ image: '/img/foo.jpg', name: 'Foo', slug: '/projects/foo' }],
 *     debug: false,
 *   });
 *
 *   // In Next.js useEffect:
 *   return cleanup;
 *
 * Navigation events (emitted on the container element):
 *   container.addEventListener('canvas:navigate', (e) => {
 *     router.push(e.detail.slug);
 *   });
 */

import Engine              from './engine/Engine.js';
import Renderer            from './renderer/Renderer.js';
import CameraController    from './camera/CameraController.js';
import InputController     from './input/InputController.js';
import GridManager         from './grid/GridManager.js';
import ImageManager        from './images/ImageManager.js';
import InteractionManager  from './interaction/InteractionManager.js';
import DebugPanel          from './debug/DebugPanel.js';

/**
 * @param {HTMLElement} container
 * @param {Object}      options
 * @param {Array}       options.items       - [{ image, name, slug }]
 * @param {boolean}     [options.debug]     - Mount debug panel (default false)
 * @param {Object}      [options.settings]  - Override default settings
 * @returns {Function}  cleanup
 */
export function initInfiniteCanvas(container, options = {}) {
  const {
    items           = [],
    debug           = false,
    settings: settingsOverride = {},
    onItemClick     = null,   // (item: { image, name, slug }) => void
  } = options;

  // Ensure relative positioning for the debug panel / bounds canvas
  const prevPosition = container.style.position;
  if (!container.style.position || container.style.position === 'static') {
    container.style.position = 'relative';
  }
  // Prevent overflow from debug bounds canvas
  container.style.overflow = 'hidden';

  // ── Shared state ────────────────────────────────────────────────────────────
  const state = _createState(container, items, settingsOverride);
  state.onItemClick = onItemClick; // direct callback, called alongside the CustomEvent

  // ── Modules ─────────────────────────────────────────────────────────────────
  // Construction order matters: each module may read references set by earlier ones.
  const renderer            = new Renderer(container, state);
  const imageManager        = new ImageManager(state, renderer);
  const gridManager         = new GridManager(state, renderer, imageManager);
  const cameraController    = new CameraController(state, renderer);
  const inputController     = new InputController(state, container, renderer);
  const interactionManager  = new InteractionManager(state, renderer, gridManager, imageManager);
  const debugPanel          = debug ? new DebugPanel(state, container, imageManager) : null;

  // Expose camera zoom to debug panel via settings (avoids cross-module coupling)
  const _origZoomUpdate = cameraController.update.bind(cameraController);
  cameraController.update = (delta) => {
    _origZoomUpdate(delta);
    state.settings._lastZoom = renderer.camera.zoom;
  };

  // ── Grid initialisation ──────────────────────────────────────────────────────
  gridManager.init(items);

  // ── UI controls (zoom buttons) ───────────────────────────────────────────────
  const uiControls    = _createZoomControls(container, state);
  const hoverDisplay  = _createHoverDisplay(container, state);

  // ── Engine — update order matters ───────────────────────────────────────────
  //   1. Input   — updates panX/panY during drag
  //   2. Camera  — applies velocity/drift/zoom, syncs camera.position
  //   3. Grid    — wraps meshes, updates visibility, lerps hover effects
  //   4. Interaction — raycasts with up-to-date camera
  //   5. Renderer — renders the frame
  //   6. Debug   — overlays (last so it reads final state)
  const modules = [
    inputController,
    cameraController,
    gridManager,
    interactionManager,
    hoverDisplay,        // runs after interaction so hoveredMesh is up-to-date
    renderer,
    ...(debugPanel ? [debugPanel] : []),
  ];

  const engine = new Engine(state, modules);
  engine.start();

  // ── canvas:loaded event ──────────────────────────────────────────────────
  // Fire once when at least 5 images have finished loading so the host page
  // can fade out its loading overlay without showing a mostly-black canvas.
  let _loadedFired = false;
  const _loadedInterval = setInterval(() => {
    if (_loadedFired) { clearInterval(_loadedInterval); return; }
    if (state.imageStats.loaded >= 5) {
      _loadedFired = true;
      clearInterval(_loadedInterval);
      container.dispatchEvent(
        new CustomEvent('canvas:loaded', { bubbles: true }),
      );
    }
  }, 100);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  return function cleanup() {
    clearInterval(_loadedInterval);
    engine.stop();
    inputController.destroy();
    interactionManager.destroy();
    gridManager.destroy();
    imageManager.destroy();
    if (debugPanel) debugPanel.destroy();
    hoverDisplay.destroy();
    uiControls.destroy();
    renderer.destroy();
    container.style.position = prevPosition;
    container.style.overflow = '';
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _createState(container, items, overrides) {
  return {
    container,
    items,

    // Camera / pan (world units, updated by CameraController and InputController)
    panX: 0,
    panY: 0,

    // Velocity (world units / second)
    velX: 0,
    velY: 0,

    // Zoom
    targetZoom:  1,
    zoomCursorX: null, // screen px — null means "use container centre"
    zoomCursorY: null,

    // Input
    isDragging:   false,
    dragDistance: 0,     // accumulated px moved since last mousedown
    mouse:       { x: 0, y: 0 },       // normalised ±0.5 from screen centre
    // null until the first mousemove — prevents an immediate hover/dim on load
    mouseScreen: null,

    // Interaction
    hoveredMesh:  null,
    clickedMesh:  null,  // snapshot taken at mousedown/touchstart, used by click handler

    // 'mouse' | 'touch' — auto-switches based on last input device used.
    // Touch mode: hover is driven by a virtual pointer fixed at screen centre;
    // dragging the canvas moves images under that point.  A tap (low dragDistance)
    // on the currently-hovered image triggers the click callback.
    inputMode: 'mouse',

    // Per-frame stats
    deltaTime: 0,
    fps:       0,

    // Populated by ImageManager
    imageStats: { loaded: 0, loading: 0 },

    // Runtime-tunable settings
    settings: {
      // ── Cell dimensions (world units = CSS pixels at zoom 1) ──────────────
      cellWidth:  380,
      cellHeight: 260,
      gapX:       80,
      gapY:       80,

      // ── Size variation for organic layout ─────────────────────────────────
      sizeVariationMin: 0.72,
      sizeVariationMax: 1.28,

      // ── Movement ──────────────────────────────────────────────────────────
      driftSpeed:   0.10,    // max drift speed multiplier
      driftDeadZone: 0.18,  // dead zone, fraction of half-screen
      baseDriftX:   1.2,    // constant background drift (world units/s)
      damping:      0.87,   // friction applied per 60fps frame

      // ── Zoom ──────────────────────────────────────────────────────────────
      // minZoom is intentionally lower than the grid's coverage guarantee
      // (0.28) so users can zoom out far enough to see the bounds rectangle.
      // Below ~0.28 the grid tile may be smaller than the viewport and images
      // repeat — that is the expected infinite-canvas behaviour.
      zoomSpeed: 0.14,
      minZoom:   0.06,
      maxZoom:   4.0,

      // ── Hover effects ─────────────────────────────────────────────────────
      hoverScale:       1.07,
      hoverOpacity:     1.0,
      dimOpacity:       0.1,
      opacityLerpSpeed: 0.12,  // speed of the per-image load fade-in
      hoverLerpSpeed:   0.10,  // speed of hover dim / highlight transitions
      scaleLerpSpeed:   0.14,

      // ── Image scale ───────────────────────────────────────────────────────
      // Global multiplier applied to every mesh's base dimensions.
      // 1.0 = default size; 1.5 = 50% larger; 0.5 = half size.
      imageScale: 0.55,

      // ── Grid dimensions (set by GridManager.init) ─────────────────────────
      gridWidth:  0,
      gridHeight: 0,
      gridCols:   0,
      gridRows:   0,

      // ── Layout ────────────────────────────────────────────────────────────
      // How far items can randomly deviate from their grid cell centre.
      // 1.0 = offset up to ±1× the gap; 1.5 = up to ±1.5× the gap.
      scatter: 2.8,

      // ── Hover ─────────────────────────────────────────────────────────────
      hoverScaleEnabled: false, // toggled from debug panel

      // ── Debug ─────────────────────────────────────────────────────────────
      showBoundsDebug: false,
      _lastZoom:       1, // written by camera wrapper, read by DebugPanel

      // Allow caller to override anything above
      ...overrides,
    },
  };
}

/**
 * Creates the +  −  ↺  zoom control buttons visible in the bottom-left corner.
 * These are plain DOM elements so they work in any environment.
 */
function _createZoomControls(container, state) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    left: calc(24px + env(safe-area-inset-left, 0px));
    display: flex;
    gap: 8px;
    z-index: 10000;
  `;

  const btnStyle = `
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 10px;
    color: rgba(255,255,255,0.9);
    font-size: 20px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  `;

  function btn(label, onClick) {
    const el = document.createElement('button');
    el.innerHTML = label;
    el.style.cssText = btnStyle;
    el.addEventListener('mouseenter', () => { el.style.background = 'rgba(255,255,255,0.30)'; el.style.borderColor = 'rgba(255,255,255,0.55)'; });
    el.addEventListener('mouseleave', () => { el.style.background = 'rgba(255,255,255,0.18)'; el.style.borderColor = 'rgba(255,255,255,0.35)'; });
    el.addEventListener('click', onClick);
    return el;
  }

  const zoomIn  = btn('+', () => {
    state.targetZoom = Math.min(state.settings.maxZoom, state.targetZoom * 1.3);
  });
  const zoomOut = btn('−', () => {
    state.targetZoom = Math.max(state.settings.minZoom, state.targetZoom / 1.3);
  });
  const reset   = btn('↺', () => {
    state.targetZoom = 1;
    state.velX = 0;
    state.velY = 0;
    state.panX = 0;
    state.panY = 0;
  });

  // Prevent slider/button interactions from starting a canvas drag
  wrap.addEventListener('mousedown',  (e) => e.stopPropagation());
  wrap.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });

  wrap.appendChild(zoomIn);
  wrap.appendChild(zoomOut);
  wrap.appendChild(reset);
  container.appendChild(wrap);

  return {
    destroy() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    },
  };
}

/**
 * Displays the hovered item's name as centred white text at the bottom of
 * the canvas.  Fades in/out with a CSS transition.
 *
 * Exposed as a module so it runs in the engine loop after InteractionManager
 * has already updated state.hoveredMesh.
 */
function _createHoverDisplay(container, state) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    top: 50%;
    left: 0; right: 0;
    transform: translateY(-50%);
    text-align: center;
    color: rgba(255,255,255,0.92);
    font: 14px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    letter-spacing: 0.02em;
    pointer-events: none;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  container.appendChild(el);

  let _lastMesh = null;

  return {
    update(_delta) {
      const mesh = state.hoveredMesh;
      if (mesh === _lastMesh) return;
      _lastMesh = mesh;

      if (mesh) {
        el.textContent   = mesh.userData.item?.name ?? '';
        el.style.opacity = '1';
      } else {
        el.style.opacity = '0';
      }
    },
    destroy() {
      if (el.parentNode) el.parentNode.removeChild(el);
    },
  };
}
