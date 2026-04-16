/**
 * CameraController — zoom, drift, inertia, and camera synchronisation.
 *
 * Reads from state:
 *   panX / panY          - current camera world position (source of truth)
 *   velX / velY          - velocity (world units / second)
 *   targetZoom           - desired zoom level
 *   zoomCursorX/Y        - screen position of cursor when wheel was fired
 *   isDragging           - when true, velocity/drift are NOT applied
 *   mouse.x / mouse.y    - cursor, normalised to ±0.5 from screen centre
 *
 * Writes to:
 *   camera.position      - synced from panX/panY every frame
 *   camera.zoom          - lerped toward targetZoom
 */
export default class CameraController {
  constructor(state, renderer) {
    this.state    = state;
    this.renderer = renderer;
    this.camera   = renderer.camera;
  }

  update(delta) {
    const s   = this.state;
    const cfg = s.settings;

    if (!s.isDragging) {
      this._applyDrift(s, cfg, delta);
      this._applyDamping(s, cfg, delta);

      // Advance position from velocity
      s.panX += s.velX * delta;
      s.panY += s.velY * delta;
    }
    // When dragging, panX/panY are updated directly by InputController —
    // we just sync the camera below.

    this._applyZoom(s, cfg, delta);

    // Always sync camera position to state
    this.camera.position.x = s.panX;
    this.camera.position.y = s.panY;
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  /**
   * Drift — the canvas slowly moves in the cursor's direction.
   *
   * Rules:
   *  • Stops completely whenever an image is hovered (mouse or touch).
   *  • Speed is FIXED and cursor-distance-independent.  The cursor position
   *    only sets the *direction* of drift; once outside the dead zone the
   *    canvas accelerates at a constant rate regardless of how far the cursor
   *    is from centre.
   *  • The direction vector is normalised so diagonal drift (cursor in a
   *    corner) has exactly the same speed as purely horizontal/vertical drift.
   *  • When the cursor is inside the dead zone, cursor-driven drift stops but
   *    the constant background drift (baseDriftX) continues so the canvas is
   *    never fully static.
   *  • In touch mode there is no cursor, so only the background drift runs.
   */
  _applyDrift(s, cfg, delta) {
    const { driftSpeed, driftDeadZone, baseDriftX } = cfg;

    // Mouse: stop drift when an image is hovered so the user can read it.
    // Touch: centre pointer is always raycasting so hoveredMesh is nearly always
    // set — stopping drift on hover would kill it permanently on touch screens.
    if (s.hoveredMesh !== null && s.inputMode !== 'touch') return;

    // Fixed drift speed (world units / s²) once past the dead zone
    const speed = driftSpeed * 400;

    if (s.inputMode !== 'touch') {
      // Build a direction vector based on which side of the dead zone we're on
      let dx = 0, dy = 0;
      if (Math.abs(s.mouse.x) > driftDeadZone) dx =  Math.sign(s.mouse.x);
      if (Math.abs(s.mouse.y) > driftDeadZone) dy = -Math.sign(s.mouse.y); // screen Y inverted

      // Normalise so diagonal == horizontal/vertical (no speed-up in corners)
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        s.velX += (dx / len) * speed * delta;
        s.velY += (dy / len) * speed * delta;
      }
    }
    // Touch: no cursor, so only background drift applies.

    // Constant background drift so the canvas is never fully static
    s.velX += baseDriftX * delta;
  }

  /**
   * Frame-rate-independent exponential damping.
   * damping == 0 → instant stop, damping == 1 → no friction.
   */
  _applyDamping(s, cfg, delta) {
    const factor = Math.pow(cfg.damping, delta * 60);
    s.velX *= factor;
    s.velY *= factor;
  }

  /**
   * Zoom — lerp camera.zoom toward targetZoom.
   *
   * Every frame we adjust panX/panY so the world point currently under the
   * cursor stays fixed on screen as zoom changes.  This gives "zoom toward
   * cursor" behaviour without any coordinate-space gymnastics.
   *
   * Math:
   *   worldX = (screenX - w/2) / zoom + panX
   *   Keeping worldX constant while zoom changes:
   *     newPanX = worldX - (screenX - w/2) / newZoom
   */
  _applyZoom(s, cfg, delta) {
    const prevZoom = this.camera.zoom;
    const lerpK    = 1 - Math.pow(1 - cfg.zoomSpeed, delta * 60);
    const newZoom  = prevZoom + (s.targetZoom - prevZoom) * lerpK;

    if (Math.abs(newZoom - prevZoom) < 0.00005) return;

    const w  = this.renderer.width;
    const h  = this.renderer.height;
    const sx = (s.zoomCursorX ?? w / 2) - w / 2;  // screen offset from centre
    const sy = -((s.zoomCursorY ?? h / 2) - h / 2); // flipped for world Y

    // World position of cursor at current zoom
    const worldX = sx / prevZoom + s.panX;
    const worldY = sy / prevZoom + s.panY;

    // Apply zoom
    this.camera.zoom = Math.max(cfg.minZoom, Math.min(cfg.maxZoom, newZoom));
    this.camera.updateProjectionMatrix();

    // Adjust pan so the cursor stays over the same world point
    s.panX = worldX - sx / this.camera.zoom;
    s.panY = worldY - sy / this.camera.zoom;
  }
}
