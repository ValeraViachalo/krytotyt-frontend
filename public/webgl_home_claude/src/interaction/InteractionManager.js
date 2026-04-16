import * as THREE from 'three';

/**
 * InteractionManager — hover detection and click handling.
 *
 * Pixel-perfect hover:
 *   After a geometry hit, the UV at the intersection point is passed to
 *   ImageManager.sampleAlpha().  If the pixel at that position is transparent
 *   (e.g. the empty corners of a circle or triangle placeholder), the hit is
 *   discarded and the next candidate in the ray is tried.  This makes hover
 *   detection match the visible shape exactly, not the bounding rectangle.
 *
 * Navigation: fires 'canvas:navigate' CustomEvent on the container.
 */
export default class InteractionManager {
  constructor(state, renderer, gridManager, imageManager) {
    this.state        = state;
    this.renderer     = renderer;
    this.gridManager  = gridManager;
    this.imageManager = imageManager;

    this.raycaster = new THREE.Raycaster();
    this._mouse2D  = new THREE.Vector2();

    this._onClick = this._onClick.bind(this);
    renderer.webgl.domElement.addEventListener('click', this._onClick);
  }

  update(_delta) {
    const isTouch = this.state.inputMode === 'touch';

    if (this.state.isDragging && !isTouch) {
      // Mouse drag: suppress hover and show grabbing cursor.
      // Touch drag is different — dragging IS how you aim the centre pointer,
      // so we keep raycasting during touch drag (see below).
      if (this.state.hoveredMesh !== null) {
        this.state.hoveredMesh = null;
        this._setCursor('grabbing');
      }
      return;
    }

    this._updateRaycast();
  }

  destroy() {
    this.renderer.webgl.domElement.removeEventListener('click', this._onClick);
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  _updateRaycast() {
    const s       = this.state;
    const isTouch = s.inputMode === 'touch';
    const w       = this.renderer.width;
    const h       = this.renderer.height;

    // Touch: virtual pointer is always at the screen centre.
    // Mouse: virtual pointer follows the actual cursor.
    let sx, sy;
    if (isTouch) {
      sx = w / 2;
      sy = h / 2;
    } else {
      const pos = s.mouseScreen;
      if (!pos) return;
      sx = pos.x;
      sy = pos.y;
    }

    this._mouse2D.set(
       (sx / w) * 2 - 1,
      -((sy / h) * 2 - 1),
    );

    this.raycaster.setFromCamera(this._mouse2D, this.renderer.camera);

    const hits = this.raycaster.intersectObjects(this.gridManager.getMeshes());

    // Walk hits in depth order; skip transparent pixels so shapes like circles
    // and triangles don't register a hover in their empty corners.
    let hitMesh = null;
    for (const hit of hits) {
      const mesh = hit.object;
      const mat  = mesh.material;

      if (mat.map && hit.uv) {
        if (this.imageManager.sampleAlpha(mesh.userData.index, hit.uv, mat.map)) {
          hitMesh = mesh;
          break;
        }
        // transparent pixel — try next mesh in ray
      } else {
        // No texture yet (loading state) — treat plane as fully opaque
        hitMesh = mesh;
        break;
      }
    }

    s.hoveredMesh = hitMesh;

    // Don't change cursor on touch — there is no cursor on a touch screen
    if (!isTouch) {
      this._setCursor(hitMesh ? 'pointer' : 'default');
    }
  }

  _onClick(_e) {
    const isTouch = this.state.inputMode === 'touch';

    // Touch taps naturally move more pixels than mouse clicks — use a wider
    // threshold.  If the user dragged significantly (panning the canvas to aim
    // a new image) we don't want that to count as a click.
    const threshold = isTouch ? 18 : 3;
    if (this.state.dragDistance > threshold) return;

    // Touch: use the current centre-hovered mesh (most accurate after panning
    // stops), falling back to the snapshot taken at touchstart.
    // Mouse: use the snapshot taken at mousedown (hoveredMesh may have been
    // cleared by the RAF loop while isDragging was true).
    const mesh = isTouch
      ? (this.state.hoveredMesh  || this.state.clickedMesh)
      : (this.state.clickedMesh  || this.state.hoveredMesh);
    if (!mesh) return;

    const item = this.gridManager.getItemForMesh(mesh);
    if (!item) return;

    console.log('[InfiniteCanvas] navigate →', item.slug, item.name);

    // 1. Direct callback (synchronous, simplest for Next.js)
    if (typeof this.state.onItemClick === 'function') {
      this.state.onItemClick(item);
    }

    // 2. Native CustomEvent — attach via container.addEventListener('canvas:navigate', …)
    this.state.container.dispatchEvent(
      new CustomEvent('canvas:navigate', {
        detail:  { slug: item.slug, name: item.name },
        bubbles: true,
      }),
    );
  }

  _setCursor(value) {
    this.renderer.webgl.domElement.style.cursor = value;
  }
}
