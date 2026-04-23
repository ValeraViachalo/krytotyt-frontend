import * as THREE from 'three';

/**
 * GridManager — layout, infinite wrapping, and hover visual effects.
 *
 * ── Layout ────────────────────────────────────────────────────────────────────
 * Items are placed in a regular grid with random per-item offsets and size
 * variations.  A shared 1×1 PlaneGeometry is used for all meshes; each mesh
 * is scaled to its desired world-unit dimensions via mesh.scale.
 *
 * ── Infinite wrapping ────────────────────────────────────────────────────────
 * The grid repeats seamlessly.  Every frame, any mesh whose position drifts
 * more than half the total grid size from the camera is teleported to the
 * opposite side.  Because items wrap by exactly gridWidth / gridHeight, the
 * spacing pattern is preserved and the seam is invisible.
 *
 * ── Hover effects ────────────────────────────────────────────────────────────
 * Hovered mesh → scale × hoverScale, opacity → hoverOpacity.
 * All other meshes → opacity → dimOpacity.
 * All values lerp smoothly every frame.
 */
export default class GridManager {
  constructor(state, renderer, imageManager) {
    this.state        = state;
    this.renderer     = renderer;
    this.imageManager = imageManager;

    // Each entry: { mesh, item, index }
    this.meshes = [];

    // Shared geometry (scaled per-mesh via mesh.scale)
    this._geometry = new THREE.PlaneGeometry(1, 1);

    // Random seed each load so the layout is different every time
    this._seed = Math.floor(Math.random() * 0xffffffff);
  }

  // ── Initialisation ────────────────────────────────────────────────────────────

  init(items) {
    if (items.length === 0) return;

    const s   = this.state;
    const cfg = s.settings;

    const stepX = cfg.cellWidth  + cfg.gapX;
    const stepY = cfg.cellHeight + cfg.gapY;

    // ── Grid dimensions ───────────────────────────────────────────────────────
    // Grid coverage is guaranteed down to a fixed COVERAGE_ZOOM (0.28), which
    // is independent of the UI minZoom.  This lets us set a much lower minZoom
    // in settings so users can zoom out far enough to see the bounds rectangle,
    // without the grid ballooning in size to compensate.
    const COVERAGE_ZOOM = 0.28;
    const minViewW = this.renderer.width  / COVERAGE_ZOOM;
    const minViewH = this.renderer.height / COVERAGE_ZOOM;

    // Minimum cols/rows to guarantee full coverage with 20% safety margin
    const minCols = Math.ceil(minViewW * 1.2 / stepX);
    const minRows = Math.ceil(minViewH * 1.2 / stepY);

    // Also ensure enough columns to hold all items without excessive empty rows
    const idealCols = Math.max(4, Math.ceil(Math.sqrt(items.length * 1.8)));
    const cols      = Math.max(idealCols, minCols);
    const rows      = Math.max(minRows, Math.ceil(items.length / cols));

    const gridW = cols * stepX;
    const gridH = rows * stepY;

    // Store grid dimensions in settings so other modules can read them
    cfg.gridWidth  = gridW;
    cfg.gridHeight = gridH;
    cfg.gridCols   = cols;
    cfg.gridRows   = rows;

    // Grid is centred at world origin
    const originX = -gridW / 2 + stepX / 2;
    const originY = -gridH / 2 + stepY / 2;

    // Total grid cells — may be larger than items.length; extra cells cycle
    // through items so the whole tile is always filled (no empty regions).
    const totalCells = cols * rows;

    for (let cellIdx = 0; cellIdx < totalCells; cellIdx++) {
      const item = items[cellIdx % items.length];
      const i    = cellIdx; // unique index per mesh position
      const col  = cellIdx % cols;
      const row  = Math.floor(cellIdx / cols);

      // Per-item size variation for an organic look
      const sizeK = this._rand(cfg.sizeVariationMin, cfg.sizeVariationMax);
      const planeW = cfg.cellWidth  * sizeK;
      const planeH = cfg.cellHeight * sizeK;

      // Normalised scatter direction [-1, 1].  Stored in userData so that
      // changing cfg.scatter live re-positions items every frame without
      // having to rebuild the whole grid.
      const scatterDX = this._rand(-1, 1);
      const scatterDY = this._rand(-1, 1);

      const scatter  = cfg.scatter ?? 1.0;
      const logicalX = originX + col * stepX;
      const logicalY = originY + row * stepY;
      const posX = logicalX + scatterDX * cfg.gapX * scatter;
      const posY = logicalY + scatterDY * cfg.gapY * scatter;

      // Slight z-offset for stable depth ordering (avoids z-fighting)
      const posZ = i * 0.001;

      const material = new THREE.MeshBasicMaterial({
        color:       0x222222,  // shown before texture loads
        transparent: true,
        opacity:     0,         // fades in once texture is applied
        depthWrite:  false,     // required for correct alpha blending order
        alphaTest:   0.0,       // keep 0 — we use opacity lerp, not hard cutoff
        side:        THREE.FrontSide,
      });

      const mesh = new THREE.Mesh(this._geometry, material);
      mesh.scale.set(planeW, planeH, 1);
      mesh.position.set(posX, posY, posZ);
      mesh.userData = {
        item,
        index:      i,
        planeW,
        planeH,
        baseScaleX: planeW,
        baseScaleY: planeH,
        // Logical grid position (no scatter) — wrapping operates on these
        logicalX,
        logicalY,
        // Unit scatter direction; multiplied by gapX/Y * cfg.scatter each frame
        scatterDX,
        scatterDY,
        // Target values used by the lerp system
        targetOpacity: 0,
        targetScale:   1,
      };

      this.renderer.scene.add(mesh);
      this.meshes.push({ mesh, item, index: i });
    } // end for(cellIdx)

    // ── Grid bounds line ──────────────────────────────────────────────────────
    // A dashed rectangle showing the extent of one grid tile.  It is
    // repositioned every frame to stay centred on the camera so it's visible
    // whenever you zoom out far enough to see the whole tile.
    const corners = [
      new THREE.Vector3(-gridW / 2, -gridH / 2, 0),
      new THREE.Vector3( gridW / 2, -gridH / 2, 0),
      new THREE.Vector3( gridW / 2,  gridH / 2, 0),
      new THREE.Vector3(-gridW / 2,  gridH / 2, 0),
    ];
    const boundsGeo = new THREE.BufferGeometry().setFromPoints(corners);
    const boundsMat = new THREE.LineDashedMaterial({
      color:       0x383838,
      dashSize:    60,
      gapSize:     30,
      transparent: true,
      opacity:     0.8,
    });
    this._boundsLine = new THREE.LineLoop(boundsGeo, boundsMat);
    this._boundsLine.computeLineDistances();
    this._boundsLine.position.z = -5; // behind all image meshes
    this.renderer.scene.add(this._boundsLine);

    // Kick off texture loading for items that start in the buffer zone.
    // Each mesh stays at opacity 0 until ImageManager sets targetOpacity = 1
    // the moment its texture finishes loading — giving a per-image fade-in.
    this._updateVisibility();
  }

  // ── Module interface ──────────────────────────────────────────────────────────

  update(delta) {
    this._wrapMeshes();
    this._updateVisibility();
    this._updateHoverEffects(delta);

    // Keep the bounds rectangle centred on the camera each frame so it is
    // always the closest grid-tile outline to whatever the user is looking at.
    if (this._boundsLine) {
      this._boundsLine.position.x = this.state.panX;
      this._boundsLine.position.y = this.state.panY;
    }
  }

  destroy() {
    for (const { mesh } of this.meshes) {
      this.renderer.scene.remove(mesh);
      mesh.material.dispose();
    }
    if (this._boundsLine) {
      this.renderer.scene.remove(this._boundsLine);
      this._boundsLine.geometry.dispose();
      this._boundsLine.material.dispose();
    }
    this._geometry.dispose();
    this.meshes = [];
  }

  // ── Public helpers ────────────────────────────────────────────────────────────

  /** Returns the flat list of Three.js meshes (for raycasting). */
  getMeshes() {
    return this.meshes.map(e => e.mesh);
  }

  /** Returns the data item associated with a mesh, or undefined. */
  getItemForMesh(mesh) {
    return this.meshes.find(e => e.mesh === mesh)?.item;
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  /**
   * Teleport any mesh that has drifted more than half the grid size away
   * from the camera to the opposite side, maintaining the seamless tile.
   */
  _wrapMeshes() {
    const { panX, panY, settings } = this.state;
    const { gridWidth, gridHeight, gapX, gapY } = settings;
    const scatter = settings.scatter ?? 1.0;
    const halfW   = gridWidth  / 2;
    const halfH   = gridHeight / 2;

    for (const { mesh } of this.meshes) {
      const ud = mesh.userData;

      // Wrap on the logical (no-scatter) position so the tile seam is clean
      const dx = ud.logicalX - panX;
      const dy = ud.logicalY - panY;
      if (dx >  halfW) ud.logicalX -= gridWidth;
      if (dx < -halfW) ud.logicalX += gridWidth;
      if (dy >  halfH) ud.logicalY -= gridHeight;
      if (dy < -halfH) ud.logicalY += gridHeight;

      // Reapply scatter every frame so live cfg.scatter changes take effect
      mesh.position.x = ud.logicalX + ud.scatterDX * gapX * scatter;
      mesh.position.y = ud.logicalY + ud.scatterDY * gapY * scatter;
    }
  }

  /**
   * Compute the current view bounds (with a buffer multiplier) and request
   * texture loads / unloads accordingly.
   *
   * We use logicalX/Y (pre-scatter grid position) for the bounds check so
   * that scatter offsets don't accidentally push cells outside the load zone.
   * A multiplier of 3.0 preloads 1.5× the viewport ahead in each direction.
   */
  _updateVisibility() {
    const bounds = this._getBufferBounds(3.0);

    for (const { mesh, item, index } of this.meshes) {
      const { planeW, planeH } = mesh.userData;
      // Use the stable logical (no-scatter) position so cells are loaded based
      // on their grid slot, not their potentially-offset rendered position.
      const x  = mesh.userData.logicalX;
      const y  = mesh.userData.logicalY;
      const hw = planeW / 2;
      const hh = planeH / 2;

      const inBuffer =
        x + hw > bounds.left   &&
        x - hw < bounds.right  &&
        y + hh > bounds.bottom &&
        y - hh < bounds.top;

      if (inBuffer) {
        this.imageManager.loadTexture(index, item.image, mesh);
      } else {
        this.imageManager.unloadTexture(index, mesh);
      }
    }
  }

  /** View frustum extended by `mult` in each direction. */
  _getBufferBounds(mult) {
    const { panX, panY } = this.state;
    const zoom = this.renderer.camera.zoom;
    const hw   = (this.renderer.width  / zoom) * mult / 2;
    const hh   = (this.renderer.height / zoom) * mult / 2;
    return {
      left:   panX - hw,
      right:  panX + hw,
      top:    panY + hh,
      bottom: panY - hh,
    };
  }

  /**
   * Lerp every mesh's opacity and scale toward their hover-driven targets.
   * Uses frame-rate-independent lerp via pow().
   *
   * Opacity has two independent speeds:
   *   opacityLerpSpeed — how fast an image fades in after its texture loads
   *   hoverLerpSpeed   — how fast the dim / highlight reacts to hover
   */
  _updateHoverEffects(delta) {
    const cfg = this.state.settings;
    const {
      hoverScale, hoverOpacity, dimOpacity,
      opacityLerpSpeed, hoverLerpSpeed, scaleLerpSpeed,
    } = cfg;

    const loadLerp  = 1 - Math.pow(1 - opacityLerpSpeed,           delta * 60);
    const hoverLerp = 1 - Math.pow(1 - (hoverLerpSpeed ?? 0.10),   delta * 60);
    const sLerp     = 1 - Math.pow(1 - scaleLerpSpeed,             delta * 60);

    const hoveredFromRaycast = this.state.hoveredMesh;
    const isTouch            = this.state.inputMode === 'touch';
    const isDragging         = this.state.isDragging;
    const clicked            = this.state.clickedMesh;

    // Mouse: while dragging, InteractionManager clears hoveredMesh so panning
    // does not fight the raycast — but that made every image lerp to full
    // opacity for the whole mousedown→mouseup.  Use the mesh captured at
    // mousedown for dim/scale until release (touch keeps live raycast hover).
    const useDragSnapshot = isDragging && !isTouch;
    const hovered =
      useDragSnapshot ? (clicked || null) : hoveredFromRaycast;

    const hasHover =
      hovered !== null &&
      (isTouch || !isDragging || !!clicked);
    const now      = performance.now();

    for (const { mesh } of this.meshes) {
      const isHovered = hasHover && mesh === hovered;
      const ud        = mesh.userData;

      // ── Opacity ───────────────────────────────────────────────────────────
      // A mesh stays at opacity 0 until:
      //   1. its texture has finished loading  (targetOpacity > 0)
      //   2. its stagger delay has elapsed     (revealAt <= now)
      const texReady = (ud.targetOpacity ?? 0) > 0;
      const revealed = texReady && (!ud.revealAt || now >= ud.revealAt);

      const mat = mesh.material;
      if (!revealed) {
        // Texture not ready or stagger delay hasn't elapsed — keep invisible
        mat.opacity += (0 - mat.opacity) * loadLerp;
      } else if (hasHover) {
        // Hover active — dim all except the hovered one
        const goal = isHovered ? hoverOpacity : dimOpacity;
        mat.opacity += (goal - mat.opacity) * hoverLerp;
      } else {
        // Normal state — fade to fully visible (load-in speed)
        mat.opacity += (1.0 - mat.opacity) * loadLerp;
      }

      // ── Scale ─────────────────────────────────────────────────────────────
      const targetSc = (isHovered && cfg.hoverScaleEnabled) ? hoverScale : 1.0;
      const imageScale = cfg.imageScale ?? 1.0;
      const effX = ud.baseScaleX * imageScale;
      const effY = ud.baseScaleY * imageScale;
      const curRatio = effX > 0 ? mesh.scale.x / effX : 1;
      const newRatio  = curRatio + (targetSc - curRatio) * sLerp;
      mesh.scale.set(effX * newRatio, effY * newRatio, 1);
    }
  }

  // ── Seeded pseudo-random ──────────────────────────────────────────────────────

  _rand(min, max) {
    // Simple LCG so layouts are reproducible
    this._seed = (this._seed * 1664525 + 1013904223) & 0xffffffff;
    const t = (this._seed >>> 0) / 0xffffffff;
    return min + t * (max - min);
  }
}
