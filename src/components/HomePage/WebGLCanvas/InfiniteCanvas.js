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
    onItemTap       = null,   // (item) => void  — fires instantly on click/tap (use for haptics)
    onItemClick     = null,   // (item) => void  — fires after visual confirmation (use for navigation)
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
  state.onItemTap   = onItemTap;
  state.onItemClick = onItemClick;

  // ── Modules ─────────────────────────────────────────────────────────────────
  // Construction order matters: each module may read references set by earlier ones.
  const renderer            = new Renderer(container, state);
  const imageManager        = new ImageManager(state, renderer);
  const gridManager         = new GridManager(state, renderer, imageManager);
  const cameraController    = new CameraController(state, renderer);
  const inputController     = new InputController(state, container, renderer);
  const interactionManager  = new InteractionManager(state, renderer, gridManager, imageManager);
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
  ];

  // ── Debug panel — live toggle without canvas reinit ──────────────────────────
  let _debugPanel = debug ? new DebugPanel(state, container, imageManager) : null;
  if (_debugPanel) modules.push(_debugPanel);

  function toggleDebug() {
    if (_debugPanel) {
      const idx = modules.indexOf(_debugPanel);
      if (idx !== -1) modules.splice(idx, 1);
      _debugPanel.destroy();
      _debugPanel = null;
      console.log('[Canvas] Debug panel closed');
    } else {
      _debugPanel = new DebugPanel(state, container, imageManager);
      _debugPanel._expand(); // open immediately — no need to hunt for the pill
      modules.push(_debugPanel);
      console.log('[Canvas] Debug panel opened');
    }
  }

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
  function cleanup() {
    clearInterval(_loadedInterval);
    engine.stop();
    inputController.destroy();
    interactionManager.destroy();
    gridManager.destroy();
    imageManager.destroy();
    if (_debugPanel) _debugPanel.destroy();
    hoverDisplay.destroy();
    uiControls.destroy();
    renderer.destroy();
    container.style.position = prevPosition;
    container.style.overflow = '';
  }

  cleanup.toggleDebug = toggleDebug;
  return cleanup;
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
      driftSpeed:   0.3,    // drift acceleration multiplier (see CameraController)
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
 * Creates the zoom control buttons (+ − reset) matching the original design:
 * circular frosted-glass buttons with SVG icons, positioned bottom-left.
 */
function _createZoomControls(container, state) {
  const MQ_MOBILE = '(max-width: 768px)';
  const mq = window.matchMedia(MQ_MOBILE);

  const wrap = document.createElement('div');

  function applyLayout(mobile) {
    wrap.style.left          = mobile ? '24px' : '85px';
    wrap.style.bottom        = mobile ? '10px' : '85px';
    wrap.style.flexDirection = mobile ? 'column' : 'row';
  }

  wrap.style.cssText = `
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    z-index: 100;
  `;
  applyLayout(mq.matches);

  // ── SVG icon markup ──────────────────────────────────────────────────────────
  const SVG_PLUS = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.25 6.25008C0.25 5.97393 0.473858 5.75007 0.75 5.75008L11.75 5.75008C12.0261 5.75008 12.25 5.97393 12.25 6.25008C12.25 6.52622 12.0261 6.75008 11.75 6.75008L0.750001 6.75007C0.473859 6.75007 0.25 6.52622 0.25 6.25008Z" fill="white" stroke="white" stroke-width="0.5"/>
    <path d="M6.24992 0.25C6.52607 0.25 6.74993 0.473858 6.74992 0.75L6.74992 11.75C6.74992 12.0261 6.52607 12.25 6.24992 12.25C5.97378 12.25 5.74992 12.0261 5.74992 11.75L5.74993 0.750001C5.74993 0.473859 5.97378 0.25 6.24992 0.25Z" fill="white" stroke="white" stroke-width="0.5"/>
  </svg>`;
  const SVG_MINUS = `<svg width="13" height="2" viewBox="0 0 13 2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.25 0.750076C0.25 0.473933 0.473858 0.250075 0.75 0.250075L11.75 0.250075C12.0261 0.250076 12.25 0.473933 12.25 0.750075C12.25 1.02622 12.0261 1.25008 11.75 1.25008L0.750001 1.25007C0.473859 1.25007 0.25 1.02622 0.25 0.750076Z" fill="white" stroke="white" stroke-width="0.5"/>
  </svg>`;
  const SVG_RESET = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0V1.5H14.999L15.6006 1.9502C16.8117 2.85771 17.7948 4.03505 18.4717 5.38867C19.1064 6.65812 19.4556 8.05036 19.4961 9.4668L19.5 9.75C19.5 15.1349 15.1349 19.5 9.75 19.5C4.36507 19.5 0 15.1349 0 9.75C0 4.44868 4.23065 0.138505 9.5 0.00585938V1.50586C7.61408 1.56322 5.80183 2.2637 4.36816 3.49805C2.87123 4.78689 1.88646 6.57007 1.59277 8.52344C1.29909 10.4768 1.71587 12.4706 2.76758 14.1426C3.81934 15.8146 5.43629 17.0537 7.32422 17.6348C9.21207 18.2158 11.2458 18.1008 13.0557 17.3096C14.8656 16.5183 16.332 15.1037 17.1875 13.3232C18.043 11.5428 18.2309 9.51395 17.7178 7.60645C17.2046 5.69913 16.0238 4.03956 14.3906 2.92871L14 2.66309V5.5H12.5V0H18Z" fill="white"/>
  </svg>`;

  const BTN_BASE = `
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(85,85,85,0.5);
    backdrop-filter: blur(27px);
    -webkit-backdrop-filter: blur(27px);
    border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: opacity 0.3s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  `;

  function makeBtn(svgHtml, isReset) {
    const el = document.createElement('button');
    el.innerHTML = svgHtml;
    el.style.cssText = BTN_BASE;
    const icon = el.querySelector('svg');
    if (icon) {
      icon.style.cssText = `width: ${isReset ? '20px' : '16px'}; height: ${isReset ? '20px' : '16px'};`;
    }
    el.addEventListener('mouseenter', () => { if (!el._inactive) el.style.opacity = '0.7'; });
    el.addEventListener('mouseleave', () => { el.style.opacity = '1'; });
    el._inactive = false;
    el._icon = icon;

    el._setInactive = (inactive) => {
      el._inactive = inactive;
      el.style.background = inactive ? 'rgba(49,49,49,0.3)' : 'rgba(85,85,85,0.5)';
      el.style.cursor      = inactive ? 'not-allowed' : 'pointer';
      el.style.opacity     = '1';
      if (icon) icon.style.opacity = inactive ? '0.4' : '1';
    };

    return el;
  }

  const zoomInEl  = makeBtn(SVG_PLUS,  false);
  const zoomOutEl = makeBtn(SVG_MINUS, false);
  const resetEl   = makeBtn(SVG_RESET, true);

  // ── Discrete zoom states ─────────────────────────────────────────────────────
  // 5 steps: index 2 is the default, 0 is minimum (2× −), 4 is maximum (2× +).
  const ZOOM_STEPS   = [0.44, 0.67, 1.0, 1.5, 2.25];
  const DEFAULT_IDX  = 2;
  const ZOOM_LABELS  = ['minimum', 'low', 'default', 'high', 'maximum'];
  let   zoomIdx      = DEFAULT_IDX;

  // Clamp scroll/wheel zoom to the same range as the button steps.
  state.settings.minZoom = ZOOM_STEPS[0];
  state.settings.maxZoom = ZOOM_STEPS[ZOOM_STEPS.length - 1];

  function applyZoomStep(nextIdx) {
    zoomIdx          = Math.max(0, Math.min(ZOOM_STEPS.length - 1, nextIdx));
    state.targetZoom = ZOOM_STEPS[zoomIdx];
    console.log(`[Canvas] Zoom state: ${zoomIdx + 1}/${ZOOM_STEPS.length} — ${ZOOM_LABELS[zoomIdx]} (${ZOOM_STEPS[zoomIdx]})`);
    refreshInactive();
  }

  function refreshInactive() {
    zoomInEl._setInactive(zoomIdx >= ZOOM_STEPS.length - 1);
    zoomOutEl._setInactive(zoomIdx <= 0);
  }

  zoomInEl.addEventListener('click', () => {
    if (zoomInEl._inactive) return;
    applyZoomStep(zoomIdx + 1);
  });
  zoomOutEl.addEventListener('click', () => {
    if (zoomOutEl._inactive) return;
    applyZoomStep(zoomIdx - 1);
  });
  resetEl.addEventListener('click', () => {
    state.velX = 0;
    state.velY = 0;
    state.panX = 0;
    state.panY = 0;
    applyZoomStep(DEFAULT_IDX);
  });

  // Hide reset button on mobile
  resetEl.style.display = mq.matches ? 'none' : 'flex';

  // Responsive layout
  function onMQChange(e) {
    applyLayout(e.matches);
    resetEl.style.display = e.matches ? 'none' : 'flex';
  }
  mq.addEventListener('change', onMQChange);

  // Prevent button interactions from starting a canvas drag
  wrap.addEventListener('mousedown',  (e) => e.stopPropagation());
  wrap.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });

  wrap.appendChild(zoomInEl);
  wrap.appendChild(zoomOutEl);
  wrap.appendChild(resetEl);
  container.appendChild(wrap);

  refreshInactive();

  return {
    destroy() {
      mq.removeEventListener('change', onMQChange);
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
    pointer-events: none;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  container.appendChild(el);

  let _lastMesh  = null;
  let _lastFlash = false;

  return {
    update(_delta) {
      const mesh  = state.hoveredMesh;
      const flash = !!state.clickFlash;

      // Re-evaluate when either the hovered mesh or the flash flag changes
      if (mesh === _lastMesh && flash === _lastFlash) return;
      _lastMesh  = mesh;
      _lastFlash = flash;

      if (mesh && !flash) {
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
