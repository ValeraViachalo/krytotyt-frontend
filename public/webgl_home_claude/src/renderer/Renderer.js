import * as THREE from 'three';

/**
 * Renderer — Three.js setup and per-frame render call.
 *
 * Uses an OrthographicCamera where 1 world unit == 1 CSS pixel at zoom 1.
 * The canvas is sized to the container and kept in sync via ResizeObserver.
 *
 * Coordinate conventions (shared across all modules):
 *   - World X: positive → right
 *   - World Y: positive → up   (Three.js default)
 *   - panX/panY = camera.position.x/y
 *   - Increasing panX → camera moves right → scene content appears to move LEFT
 */
export default class Renderer {
  constructor(container, state) {
    this.container = container;
    this.state     = state;

    // ── Scene ────────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();

    // ── Camera ───────────────────────────────────────────────────────────────
    // Frustum spans the container dimensions so 1 unit == 1 pixel at zoom 1.
    const w = container.clientWidth  || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    this.camera = new THREE.OrthographicCamera(
      -w / 2, w / 2,  // left, right
       h / 2, -h / 2, // top,  bottom  (Y flipped matches screen convention)
      0.1, 2000,
    );
    this.camera.position.z = 100;

    // ── WebGL Renderer ────────────────────────────────────────────────────────
    this.webgl = new THREE.WebGLRenderer({
      antialias:   true,
      alpha:       true,   // transparent background
      powerPreference: 'high-performance',
    });
    // Use full native pixel density — no cap.  The cap was causing blurriness
    // on retina / HiDPI displays where dpr > 2.
    this.webgl.setPixelRatio(window.devicePixelRatio);
    this.webgl.setSize(w, h);
    this.webgl.setClearColor(0x000000, 0); // fully transparent clear

    // Disable auto-clear — we render a single scene per frame
    this.webgl.autoClear = true;

    container.appendChild(this.webgl.domElement);

    // ── Resize handling ───────────────────────────────────────────────────────
    this._onResize = this._onResize.bind(this);
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(container);
  }

  // ── Public helpers ──────────────────────────────────────────────────────────

  get width()  { return this.container.clientWidth  || window.innerWidth;  }
  get height() { return this.container.clientHeight || window.innerHeight; }

  /**
   * Convert a screen position (pixels, top-left origin) to world coordinates.
   *
   * Derivation:
   *   worldX = (screenX - w/2) / zoom + camera.position.x
   *   worldY = -(screenY - h/2) / zoom + camera.position.y
   */
  screenToWorld(screenX, screenY) {
    const zoom = this.camera.zoom;
    const w    = this.width;
    const h    = this.height;
    return {
      x: (screenX - w / 2) / zoom + this.camera.position.x,
      y: -(screenY - h / 2) / zoom + this.camera.position.y,
    };
  }

  // ── Module interface ────────────────────────────────────────────────────────

  /** Called last in the engine loop — renders the scene. */
  update(_delta) {
    this.webgl.render(this.scene, this.camera);
  }

  destroy() {
    this._resizeObserver.disconnect();
    this.webgl.dispose();
    if (this.webgl.domElement.parentNode) {
      this.webgl.domElement.parentNode.removeChild(this.webgl.domElement);
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  _onResize() {
    const w = this.width;
    const h = this.height;

    this.webgl.setSize(w, h);

    // Recalculate frustum keeping 1 unit == 1 pixel
    this.camera.left   = -w / 2;
    this.camera.right  =  w / 2;
    this.camera.top    =  h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
  }
}
