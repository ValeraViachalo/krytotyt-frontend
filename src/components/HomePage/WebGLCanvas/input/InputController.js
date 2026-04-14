/**
 * InputController — mouse, wheel, and touch event handling.
 *
 * All handlers are event-driven; update() is a no-op used only to satisfy
 * the module interface.
 *
 * Drag:
 *   - 1:1 movement with cursor, no smoothing.
 *   - Updates state.panX/panY directly so the camera reacts this same frame.
 *   - Tracks per-event velocity for post-release inertia.
 *
 * Wheel:
 *   - Adjusts state.targetZoom; CameraController lerps toward it.
 *   - Records cursor position so zoom is centred on cursor.
 *
 * Touch:
 *   - Single-finger drag mirrors mouse behaviour.
 *   - preventDefault stops native scroll; pinch hooks stubbed for later.
 */
export default class InputController {
  constructor(state, container, renderer) {
    this.state     = state;
    this.container = container;
    this.renderer  = renderer;

    // Drag tracking
    this._prevX = 0;
    this._prevY = 0;
    this._lastMoveTime = 0; // performance.now() timestamp of last move event

    // Track distance moved during a mousedown/up cycle to distinguish
    // a click from a drag (used by InteractionManager).
    this._downX = 0;
    this._downY = 0;
    this.state.dragDistance = 0;

    // Smoothed velocity (EMA) so post-drag inertia isn't spiky
    this._smoothVelX = 0;
    this._smoothVelY = 0;

    this._bindHandlers();
    this._attach();
  }

  update(_delta) { /* event-driven */ }

  destroy() {
    this._detach();
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  _bindHandlers() {
    this._onMouseMove  = this._onMouseMove.bind(this);
    this._onMouseDown  = this._onMouseDown.bind(this);
    this._onMouseUp    = this._onMouseUp.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onWheel      = this._onWheel.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove  = this._onTouchMove.bind(this);
    this._onTouchEnd   = this._onTouchEnd.bind(this);
  }

  _attach() {
    const c = this.container;
    c.addEventListener('mousemove',  this._onMouseMove);
    c.addEventListener('mousedown',  this._onMouseDown);
    c.addEventListener('mouseleave', this._onMouseLeave);
    window.addEventListener('mouseup', this._onMouseUp);
    c.addEventListener('wheel',      this._onWheel,      { passive: false });
    c.addEventListener('touchstart', this._onTouchStart, { passive: false });
    c.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    c.addEventListener('touchend',   this._onTouchEnd);
  }

  _detach() {
    const c = this.container;
    c.removeEventListener('mousemove',  this._onMouseMove);
    c.removeEventListener('mousedown',  this._onMouseDown);
    c.removeEventListener('mouseleave', this._onMouseLeave);
    window.removeEventListener('mouseup', this._onMouseUp);
    c.removeEventListener('wheel',      this._onWheel);
    c.removeEventListener('touchstart', this._onTouchStart);
    c.removeEventListener('touchmove',  this._onTouchMove);
    c.removeEventListener('touchend',   this._onTouchEnd);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Cursor position relative to the container top-left corner. */
  _relPos(e) {
    const r = this.container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /** Update normalised mouse position (centre = 0, range ≈ ±0.5). */
  _updateMouseNorm(pos) {
    const w = this.renderer.width;
    const h = this.renderer.height;
    this.state.mouse.x      = pos.x / w - 0.5;
    this.state.mouse.y      = pos.y / h - 0.5;
    this.state.mouseScreen  = pos;
  }

  // ── Mouse ────────────────────────────────────────────────────────────────────

  _onMouseMove(e) {
    const pos = this._relPos(e);
    this._updateMouseNorm(pos);
    this.state.inputMode = 'mouse'; // any mouse movement switches back to mouse mode

    if (this.state.isDragging) {
      const dx = pos.x - this._prevX;
      const dy = pos.y - this._prevY;
      const zoom = this.renderer.camera.zoom;

      // 1:1 — convert screen delta to world delta accounting for zoom
      const wdx =  dx / zoom;
      const wdy = -dy / zoom; // screen Y is inverted vs world Y

      this.state.panX -= wdx;
      this.state.panY -= wdy;

      // Compute velocity using actual event-to-event time (more accurate than
      // render deltaTime, since mouse events fire at their own rate).
      const now       = performance.now();
      const eventDt   = Math.max((now - this._lastMoveTime) / 1000, 0.004);
      this._lastMoveTime = now;

      const rawVelX = -wdx / eventDt;
      const rawVelY = -wdy / eventDt;

      // Exponential moving average damps single-frame spikes
      const ema = 0.35;
      this._smoothVelX = this._smoothVelX * (1 - ema) + rawVelX * ema;
      this._smoothVelY = this._smoothVelY * (1 - ema) + rawVelY * ema;

      // Cap to avoid ridiculously fast coasting
      const cap = 2400;
      this.state.velX = Math.max(-cap, Math.min(cap, this._smoothVelX));
      this.state.velY = Math.max(-cap, Math.min(cap, this._smoothVelY));

      this.state.dragDistance += Math.sqrt(dx * dx + dy * dy);
    }

    this._prevX = pos.x;
    this._prevY = pos.y;
  }

  _onMouseDown(e) {
    if (e.button !== 0) return;
    this.state.inputMode     = 'mouse';
    const pos = this._relPos(e);
    this.state.isDragging    = true;
    this.state.dragDistance  = 0;
    // Snapshot the hovered mesh now — the RAF loop will clear hoveredMesh once
    // isDragging is true, so _onClick needs this pre-drag value.
    this.state.clickedMesh   = this.state.hoveredMesh;
    this._prevX = pos.x;
    this._prevY = pos.y;
    this._downX = pos.x;
    this._downY = pos.y;
    this._lastMoveTime = performance.now();
    this._smoothVelX   = 0;
    this._smoothVelY   = 0;
    this.container.style.cursor = 'grabbing';
  }

  _onMouseUp(_e) {
    if (!this.state.isDragging) return;
    this.state.isDragging       = false;
    this.container.style.cursor = '';
  }

  _onMouseLeave(_e) {
    // Pointer left the canvas area (moved over a sibling element above it,
    // e.g. AboutPopup, or left the window). Clear mouseScreen so the
    // InteractionManager knows to deactivate hover on the next frame.
    this.state.mouseScreen = null;
  }

  // ── Wheel ────────────────────────────────────────────────────────────────────

  _onWheel(e) {
    e.preventDefault();

    const s    = this.state;
    const zoom = this.renderer.camera.zoom;

    let dx = e.deltaX;
    let dy = e.deltaY;

    // Normalise deltaMode (line / page → pixel equivalents)
    if (e.deltaMode === 1) { dx *= 24;  dy *= 24;  }
    if (e.deltaMode === 2) { dx *= 400; dy *= 400; }

    // ── Ctrl / Cmd + scroll → zoom (centered on cursor) ─────────────────────
    // This is the standard pinch-to-zoom shortcut on macOS trackpads and
    // matches the convention used by Figma, Miro, etc.
    if (e.ctrlKey || e.metaKey) {
      const pos         = this._relPos(e);
      const zoomFactor  = 1 - dy * 0.005;
      s.targetZoom      = Math.max(
        s.settings.minZoom,
        Math.min(s.settings.maxZoom, s.targetZoom * zoomFactor),
      );
      s.zoomCursorX = pos.x;
      s.zoomCursorY = pos.y;
      return;
    }

    // ── Regular scroll → pan (1:1 with scroll pixels, no extra momentum) ────
    // On macOS trackpads the OS already provides natural deceleration, so
    // adding artificial inertia would double-decelerate and feel sluggish.
    s.panX += dx / zoom;
    s.panY -= dy / zoom; // screen Y inverted vs world Y
  }

  // ── Touch ────────────────────────────────────────────────────────────────────

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    this.state.inputMode    = 'touch'; // switch to touch mode
    const t = e.touches[0];
    this.state.isDragging   = true;
    this.state.dragDistance = 0;
    // Snapshot the centre-hovered mesh so _onClick can use it even if the
    // RAF runs and changes hoveredMesh before the synthetic click fires.
    this.state.clickedMesh  = this.state.hoveredMesh;
    this._prevX        = t.clientX;
    this._prevY        = t.clientY;
    this._lastMoveTime = performance.now();
    this._smoothVelX   = 0;
    this._smoothVelY   = 0;
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length !== 1) return;
    const t   = e.touches[0];
    const dx  = t.clientX - this._prevX;
    const dy  = t.clientY - this._prevY;
    const zoom = this.renderer.camera.zoom;

    const wdx =  dx / zoom;
    const wdy = -dy / zoom;

    this.state.panX -= wdx;
    this.state.panY -= wdy;

    const now     = performance.now();
    const eventDt = Math.max((now - this._lastMoveTime) / 1000, 0.004);
    this._lastMoveTime = now;

    const ema = 0.35;
    this._smoothVelX = this._smoothVelX * (1 - ema) + (-wdx / eventDt) * ema;
    this._smoothVelY = this._smoothVelY * (1 - ema) + (-wdy / eventDt) * ema;
    const cap = 2400;
    this.state.velX = Math.max(-cap, Math.min(cap, this._smoothVelX));
    this.state.velY = Math.max(-cap, Math.min(cap, this._smoothVelY));

    this.state.dragDistance += Math.sqrt(dx * dx + dy * dy);

    this._prevX = t.clientX;
    this._prevY = t.clientY;

    // Update normalised mouse for drift
    const pos = this._relPos({ clientX: t.clientX, clientY: t.clientY });
    this._updateMouseNorm(pos);
  }

  _onTouchEnd(e) {
    this.state.isDragging = false;

    // Because we call preventDefault() in touchstart (to block native page
    // scroll), the browser never fires a synthetic 'click' after touchend.
    // Dispatch one ourselves so InteractionManager._onClick can handle tap
    // detection with its own drag-distance threshold.
    const t = e.changedTouches[0];
    if (t) {
      e.target.dispatchEvent(new MouseEvent('click', {
        clientX:   t.clientX,
        clientY:   t.clientY,
        bubbles:   true,
        cancelable: true,
      }));
    }
  }
}
