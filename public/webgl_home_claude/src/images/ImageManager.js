import * as THREE from 'three';

/**
 * ImageManager — texture loading, cover-fit UV, and disposal.
 *
 * Textures are loaded lazily as items enter the buffer zone and disposed
 * when they leave it.  Duplicate load requests are deduplicated via a
 * loading-set guard.
 *
 * Cover-fit:
 *   texture.repeat / texture.offset are set so the image fills the plane
 *   without stretching (object-fit: cover equivalent).
 */

/** Unique hues for placeholder tiles so they're visually distinct. */
const PLACEHOLDER_PALETTE = [
  ['#1a1a2e', '#16213e'],
  ['#0d1b2a', '#1b2838'],
  ['#16213e', '#0f3460'],
  ['#1a0533', '#2d1b69'],
  ['#0a2e1a', '#1a4a2e'],
  ['#2e1a0a', '#4a3010'],
  ['#1e0a0a', '#3a1010'],
  ['#0a1e2e', '#103040'],
  ['#1a1e0a', '#2e3010'],
  ['#2e0a1e', '#4a1030'],
];

export default class ImageManager {
  constructor(state, renderer) {
    this.state    = state;
    this.renderer = renderer;

    // Enable CORS so cross-origin images (e.g. picsum.photos) can be
    // drawn onto a canvas for pixel-perfect alpha sampling.
    this.loader = new THREE.TextureLoader();
    this.loader.crossOrigin = 'anonymous';

    // index → THREE.Texture
    this._textures = new Map();
    // indices currently in-flight
    this._loading  = new Set();
    // index → { data: Uint8ClampedArray, width, height }
    // Used by InteractionManager for pixel-perfect hover detection.
    this._alphaData = new Map();

    // Staggered reveal: tracks the timestamp of the next scheduled reveal so
    // images appear one-by-one instead of all at once on initial load.
    this._nextRevealTime = 0;

    this._updateStats();
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Request a texture for the given item index.
   * If already loaded or loading, this is a no-op.
   * Once loaded the texture is applied to `mesh`.
   */
  loadTexture(index, imagePath, mesh) {
    if (this._textures.has(index) || this._loading.has(index)) return;

    this._loading.add(index);
    this._updateStats();

    if (!imagePath) {
      this._createPlaceholder(index, mesh);
      return;
    }

    this.loader.load(
      imagePath,
      (texture) => {
        this._loading.delete(index);
        texture.colorSpace = THREE.SRGBColorSpace;
        this._textures.set(index, texture);
        this._applyTexture(mesh, texture);
        this._updateStats();
      },
      undefined, // onProgress not used
      () => {
        // Fallback to placeholder on error
        this._loading.delete(index);
        this._createPlaceholder(index, mesh);
      },
    );
  }

  /**
   * Dispose the texture for the given index and reset the mesh material
   * to its blank state.
   */
  unloadTexture(index, mesh) {
    const tex = this._textures.get(index);
    if (!tex) return;

    tex.dispose();
    this._textures.delete(index);
    this._alphaData.delete(index);

    if (mesh.material) {
      mesh.material.map   = null;
      mesh.material.color.setHex(0x111111);
      mesh.material.needsUpdate = true;
    }

    // Reset so the mesh is invisible while it has no texture and will fade
    // back in (with stagger) if it re-enters the buffer zone later.
    if (mesh.userData) {
      mesh.userData.targetOpacity = 0;
      mesh.userData.revealAt      = 0; // cancel any pending staggered reveal
      mesh.material.opacity       = 0;
    }

    this._updateStats();
  }

  /**
   * Pixel-perfect hover: sample the alpha channel of a texture at a given
   * mesh UV coordinate, accounting for the cover-fit UV transform.
   *
   * Three.js PlaneGeometry UV convention:
   *   (0,0) = bottom-left, (1,1) = top-right
   * With flipY=true (Three.js default) the texture is flipped on upload, so:
   *   texV=0 → bottom of image file → imageData row = (height-1)
   *   texV=1 → top of image file    → imageData row = 0
   * → imageRow = floor( (1 - texV) * height )
   *
   * @param  {number}        index  - item index
   * @param  {THREE.Vector2} uv     - intersection UV from raycaster
   * @param  {THREE.Texture} tex    - the mesh's current texture
   * @returns {boolean}  true = pixel is opaque enough to count as a hit
   */
  sampleAlpha(index, uv, tex) {
    const cached = this._alphaData.get(index);
    if (!cached) return true; // no data → assume opaque

    // Apply cover-fit UV transform (same as GPU sampling)
    let u = uv.x * tex.repeat.x + tex.offset.x;
    let v = uv.y * tex.repeat.y + tex.offset.y;

    // Clamp to valid range
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));

    // Flip V: Three.js texture V=0 is bottom of image
    const row = Math.floor((1 - v) * (cached.height - 1));
    const col = Math.floor(u          * (cached.width  - 1));

    const alphaIndex = (row * cached.width + col) * 4 + 3;
    return cached.data[alphaIndex] > 20;
  }

  destroy() {
    this._textures.forEach(t => t.dispose());
    this._textures.clear();
    this._loading.clear();
    this._alphaData.clear();
    this._updateStats();
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  _createPlaceholder(index, mesh) {
    const W   = 256;
    const H   = 180;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    // willReadFrequently hint not needed; alpha must be preserved
    const ctx = canvas.getContext('2d', { alpha: true });

    const [bg, accent] = PLACEHOLDER_PALETTE[index % PLACEHOLDER_PALETTE.length];

    // ── Every 4th item uses a transparent-background shape ────────────────────
    // This lets you verify that alpha-channel images (non-rectangular PNGs)
    // render correctly — transparent areas show the canvas background through.
    const shapeType = index % 4;

    if (shapeType === 0) {
      // Circle — clearly non-rectangular
      this._drawTransparentShape(ctx, W, H, bg, accent, 'circle', index);
    } else if (shapeType === 1) {
      // Rounded pill / horizontal bar
      this._drawTransparentShape(ctx, W, H, bg, accent, 'pill', index);
    } else if (shapeType === 2) {
      // Diagonal triangle
      this._drawTransparentShape(ctx, W, H, bg, accent, 'triangle', index);
    } else {
      // Opaque rectangle (original style)
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, bg);
      grad.addColorStop(1, accent);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 1;
      for (let x = 0; x <= W; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    // Index label on all types
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle    = 'rgba(255,255,255,0.5)';
    ctx.font         = 'bold 22px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, W / 2, H / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace   = THREE.SRGBColorSpace;
    texture.premultiplyAlpha = false; // keep straight alpha for correct blending

    this._textures.set(index, texture);
    this._loading.delete(index);
    this._applyTexture(mesh, texture);
    this._updateStats();
  }

  /**
   * Draw a transparent-background shape so non-rectangular image rendering
   * can be verified.  The plane geometry stays rectangular; transparent pixels
   * let the scene background show through.
   */
  _drawTransparentShape(ctx, W, H, bg, accent, shape, index) {
    // Clear to fully transparent first
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, bg);

    ctx.fillStyle = grad;

    if (shape === 'circle') {
      const r = Math.min(W, H) / 2 - 4;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.fill();

      // Thin highlight ring
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (shape === 'pill') {
      const r   = H / 2 - 6;
      const pad = r + 6;
      ctx.beginPath();
      ctx.moveTo(pad, 6);
      ctx.lineTo(W - pad, 6);
      ctx.arcTo(W - 6, 6, W - 6, H - 6, r);
      ctx.lineTo(W - 6, H - 6);
      ctx.arcTo(W - 6, H - 6, pad, H - 6, r);
      ctx.lineTo(pad, H - 6);
      ctx.arcTo(6, H - 6, 6, 6, r);
      ctx.lineTo(6, 6);
      ctx.arcTo(6, 6, W - pad, 6, r);
      ctx.closePath();
      ctx.fill();

    } else if (shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(W / 2, 8);
      ctx.lineTo(W - 8, H - 8);
      ctx.lineTo(8, H - 8);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }

  /**
   * Apply texture to mesh with cover-fit UV scaling.
   *
   * The plane dimensions are stored in mesh.userData.planeW / planeH.
   * We scale texture.repeat so the image fills the plane without distortion.
   */
  _applyTexture(mesh, texture) {
    const { planeW, planeH } = mesh.userData;

    if (texture.image) {
      const imgW = texture.image.width  || planeW;
      const imgH = texture.image.height || planeH;

      const imgAspect  = imgW / imgH;
      const cellAspect = planeW / planeH;

      if (imgAspect > cellAspect) {
        // Image is wider → fit height, crop sides
        const scale = cellAspect / imgAspect;
        texture.repeat.set(scale, 1);
        texture.offset.set((1 - scale) / 2, 0);
      } else {
        // Image is taller → fit width, crop top/bottom
        const scale = imgAspect / cellAspect;
        texture.repeat.set(1, scale);
        texture.offset.set(0, (1 - scale) / 2);
      }
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
    }

    mesh.material.map   = texture;
    mesh.material.color.setHex(0xffffff);
    mesh.material.needsUpdate = true;

    // Snap the mesh scale to the current imageScale RIGHT NOW so the image
    // appears at its correct size — no shrink animation on first reveal.
    const imgScale = this.state.settings.imageScale ?? 1.0;
    mesh.scale.set(
      mesh.userData.baseScaleX * imgScale,
      mesh.userData.baseScaleY * imgScale,
      1,
    );

    // Staggered reveal — only for images that are currently on screen.
    // Off-screen buffer images reveal instantly (revealAt = 0) so they are
    // already visible when the user pans to them.  On-screen images appear
    // one-by-one at 250 ms intervals for a clean sequential fade-in.
    const now = performance.now();
    const isOnScreen = this._isOnScreen(mesh);

    if (isOnScreen) {
      // Queue this reveal after the previous one
      if (this._nextRevealTime < now) this._nextRevealTime = now;
      mesh.userData.revealAt   = this._nextRevealTime;
      this._nextRevealTime    += 250;
    } else {
      // Off-screen: no delay — load silently in the background
      mesh.userData.revealAt = 0;
    }
    mesh.userData.targetOpacity = 1;

    // Cache a small downsampled copy of the pixel data for alpha picking.
    this._cacheAlphaData(mesh.userData.index, texture);
  }

  /**
   * Returns true if the mesh's logical grid position falls within the current
   * visible viewport (accounting for zoom and pan).  Used to decide whether
   * the staggered reveal applies or the image should just appear immediately.
   */
  _isOnScreen(mesh) {
    const zoom = this.renderer.camera.zoom;
    const hw   = this.renderer.width  / (2 * zoom);
    const hh   = this.renderer.height / (2 * zoom);
    const { logicalX, logicalY, planeW, planeH } = mesh.userData;
    const cx = this.state.panX;
    const cy = this.state.panY;
    return (
      logicalX + planeW / 2 > cx - hw &&
      logicalX - planeW / 2 < cx + hw &&
      logicalY + planeH / 2 > cy - hh &&
      logicalY - planeH / 2 < cy + hh
    );
  }

  /**
   * Rasterise the texture into a tiny 64×64 canvas and store its ImageData.
   * The small size keeps memory low while being plenty accurate for hit-testing.
   * CORS-tainted images (where the server doesn't send ACAO headers) are
   * silently skipped — they'll be treated as fully opaque.
   */
  _cacheAlphaData(index, texture) {
    const img = texture.image;
    if (!img) return;

    try {
      const W = 64, H = 64;
      const c   = document.createElement('canvas');
      c.width   = W;
      c.height  = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, W, H);
      this._alphaData.set(index, {
        data:   ctx.getImageData(0, 0, W, H).data,
        width:  W,
        height: H,
      });
    } catch (_e) {
      // SecurityError from CORS-tainted canvas — skip; hover treats as opaque
    }
  }

  _updateStats() {
    this.state.imageStats = {
      loaded:  this._textures.size,
      loading: this._loading.size,
    };
  }
}
