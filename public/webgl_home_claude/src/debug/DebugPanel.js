/**
 * DebugPanel — foldable overlay for development.
 *
 * Default state: collapsed to a small "⚙ DEBUG" pill button.
 * Click the pill → panel expands.
 * Click the panel header → collapses back to pill.
 *
 * Bounds debug toggle:
 *   OFF → canvas fills the full window (no visible border)
 *   ON  → canvas shrinks to 65% of viewport (centred, black margin visible)
 *         so you can see the canvas edges and watch tiles being created /
 *         destroyed as you pan near the buffer boundary.
 */
export default class DebugPanel {
  constructor(state, container, imageManager) {
    this.state     = state;
    this.container = container;

    // Stash original container styles so we can restore on teardown or
    // when bounds-debug is switched off.
    this._origStyles = {
      position: container.style.position || '',
      width:    container.style.width    || '',
      height:   container.style.height   || '',
      left:     container.style.left     || '',
      top:      container.style.top      || '',
    };

    this._isExpanded = false; // collapsed by default
    this._pill       = null;
    this._panel      = null;
    this._statsEl    = null;
    this._boundsViz  = null;

    this._createPill();
    this._createPanel();
    this._createBoundsCanvas();
  }

  // ── Module interface ──────────────────────────────────────────────────────────

  update(_delta) {
    if (this._isExpanded) this._renderStats();

    if (this.state.settings.showBoundsDebug) {
      this._drawBounds();
    } else {
      this._clearBounds();
    }
  }

  destroy() {
    this._setCanvasScale(1.0);
    [this._pill, this._panel, this._boundsViz].forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  // ── Pill (collapsed state) ────────────────────────────────────────────────────

  _createPill() {
    const pill = document.createElement('button');
    pill.innerHTML = '⚙&thinsp;DEBUG';
    pill.style.cssText = `
      position: absolute;
      top: 16px; right: 16px;
      background: rgba(0,0,0,0.65);
      color: rgba(170,255,200,0.55);
      font: 10px/1 monospace;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 7px 11px;
      border-radius: 5px;
      border: 1px solid rgba(100,255,180,0.14);
      cursor: pointer;
      z-index: 9999;
      transition: background 0.15s, color 0.15s;
    `;
    pill.addEventListener('mouseenter', () => {
      pill.style.background = 'rgba(0,0,0,0.85)';
      pill.style.color      = 'rgba(170,255,200,0.9)';
    });
    pill.addEventListener('mouseleave', () => {
      pill.style.background = 'rgba(0,0,0,0.65)';
      pill.style.color      = 'rgba(170,255,200,0.55)';
    });
    // Stop mousedown/touch from reaching the canvas container drag handler
    pill.addEventListener('mousedown',  (e) => e.stopPropagation());
    pill.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    pill.addEventListener('click', () => this._expand());
    this.container.appendChild(pill);
    this._pill = pill;
  }

  // ── Full panel (expanded state) ───────────────────────────────────────────────

  _createPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 16px; right: 16px;
      width: 244px;
      max-height: calc(100% - 32px);
      overflow-y: auto;
      background: rgba(0,0,0,0.84);
      color: #aaffcc;
      font: 11px/1.65 monospace;
      padding: 0 0 12px;
      border-radius: 6px;
      border: 1px solid rgba(100,255,180,0.14);
      z-index: 9999;
      user-select: none;
      display: none;
    `;
    // Stop mousedown/touch on the panel from reaching the canvas drag handler
    panel.addEventListener('mousedown',  (e) => e.stopPropagation());
    panel.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });

    // ── Header (click to collapse) ────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px 9px;
      border-bottom: 1px solid rgba(100,255,180,0.1);
      cursor: pointer;
    `;
    header.addEventListener('mouseenter', () => header.style.background = 'rgba(100,255,180,0.04)');
    header.addEventListener('mouseleave', () => header.style.background = '');
    header.addEventListener('click', () => this._collapse());

    const title = document.createElement('span');
    title.textContent = 'CANVAS DEBUG';
    title.style.cssText = 'font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(170,255,200,0.4);';

    const collapseIcon = document.createElement('span');
    collapseIcon.textContent = '−';
    collapseIcon.style.cssText = 'color:rgba(100,255,180,0.35);font-size:16px;line-height:1;margin-top:-2px;';

    header.appendChild(title);
    header.appendChild(collapseIcon);
    panel.appendChild(header);

    // ── Stats ─────────────────────────────────────────────────────────────────
    this._statsEl = document.createElement('div');
    this._statsEl.style.cssText = 'padding: 8px 14px 4px;';
    panel.appendChild(this._statsEl);

    // ── Controls ──────────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = 'padding: 0 14px;';

    const divider = () => {
      const d = document.createElement('div');
      d.style.cssText = 'border-top:1px solid rgba(100,255,180,0.1);margin:7px 0;';
      return d;
    };

    body.appendChild(divider());

    // Bounds debug — also drives canvas scale
    body.appendChild(this._makeToggle('Bounds debug',
      () => this.state.settings.showBoundsDebug,
      v  => {
        this.state.settings.showBoundsDebug = v;
        this._setCanvasScale(v ? 0.65 : 1.0);
      },
    ));

    // Hover scale
    body.appendChild(this._makeToggle('Hover scale',
      () => this.state.settings.hoverScaleEnabled,
      v  => { this.state.settings.hoverScaleEnabled = v; },
    ));

    body.appendChild(divider());

    body.appendChild(this._makeSlider('Drift speed', 0, 0.5, 0.01,
      () => this.state.settings.driftSpeed,
      v  => { this.state.settings.driftSpeed = v; },
    ));
    body.appendChild(this._makeSlider('Zoom speed', 0.02, 0.5, 0.01,
      () => this.state.settings.zoomSpeed,
      v  => { this.state.settings.zoomSpeed = v; },
    ));
    body.appendChild(this._makeSlider('Scatter', 0, 3.0, 0.05,
      () => this.state.settings.scatter,
      v  => { this.state.settings.scatter = v; },
    ));
    body.appendChild(this._makeSlider('Image scale', 0.3, 2.0, 0.05,
      () => this.state.settings.imageScale,
      v  => { this.state.settings.imageScale = v; },
    ));
    body.appendChild(this._makeSlider('Dim opacity', 0, 0.8, 0.01,
      () => this.state.settings.dimOpacity,
      v  => { this.state.settings.dimOpacity = v; },
    ));
    body.appendChild(this._makeSlider('Dim speed', 0.01, 0.4, 0.01,
      () => this.state.settings.hoverLerpSpeed,
      v  => { this.state.settings.hoverLerpSpeed = v; },
    ));

    body.appendChild(divider());

    // ── Copy settings button ──────────────────────────────────────────────
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy settings';
    copyBtn.style.cssText = `
      width: 100%; margin-top: 2px;
      font: 10px monospace; padding: 5px 0;
      border-radius: 3px; border: 1px solid rgba(100,255,180,0.2);
      background: rgba(100,255,180,0.06); color: rgba(170,255,200,0.7);
      cursor: pointer; transition: all 0.12s;
    `;
    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.background = 'rgba(100,255,180,0.14)';
      copyBtn.style.color = 'rgba(170,255,200,1)';
    });
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.background = 'rgba(100,255,180,0.06)';
      copyBtn.style.color = 'rgba(170,255,200,0.7)';
    });
    copyBtn.addEventListener('click', () => {
      const s = this.state.settings;
      const exported = {
        driftSpeed:        +s.driftSpeed.toFixed(3),
        zoomSpeed:         +s.zoomSpeed.toFixed(3),
        scatter:           +s.scatter.toFixed(2),
        imageScale:        +s.imageScale.toFixed(2),
        dimOpacity:        +s.dimOpacity.toFixed(2),
        hoverLerpSpeed:    +s.hoverLerpSpeed.toFixed(3),
        hoverScaleEnabled: s.hoverScaleEnabled,
      };
      const text = JSON.stringify(exported, null, 2);
      navigator.clipboard?.writeText(text).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy settings'; }, 1800);
      }).catch(() => {
        console.log('[DebugPanel] settings snapshot:\n', text);
        copyBtn.textContent = 'Logged to console';
        setTimeout(() => { copyBtn.textContent = 'Copy settings'; }, 1800);
      });
    });
    body.appendChild(copyBtn);

    panel.appendChild(body);
    this.container.appendChild(panel);
    this._panel = panel;
  }

  // ── Expand / collapse ─────────────────────────────────────────────────────────

  _expand() {
    this._isExpanded           = true;
    this._pill.style.display   = 'none';
    this._panel.style.display  = 'block';
  }

  _collapse() {
    this._isExpanded           = false;
    this._pill.style.display   = 'block';
    this._panel.style.display  = 'none';
  }

  // ── Stats render ──────────────────────────────────────────────────────────────

  _renderStats() {
    const s = this.state;
    this._statsEl.innerHTML = `
      <div style="line-height:1.8">
        <span style="color:#555">FPS</span>   <b style="color:#fff">${s.fps}</b><br>
        <span style="color:#555">Zoom</span>  <b style="color:#fff">${(s.settings._lastZoom || 1).toFixed(3)}</b><br>
        <span style="color:#555">Pan</span>   <b style="color:#fff">${Math.round(s.panX)}, ${Math.round(s.panY)}</b><br>
        <span style="color:#555">Vel</span>   <b style="color:#fff">${s.velX.toFixed(1)}, ${s.velY.toFixed(1)}</b><br>
        <span style="color:#555">Items</span> <b style="color:#fff">${s.items.length}</b>
        &nbsp;&nbsp;<span style="color:#555">Tex</span> <b style="color:#fff">${s.imageStats.loaded}</b>
        <span style="color:#555"> / loading</span> <b style="color:#fff">${s.imageStats.loading}</b><br>
        <span style="color:#555">Drag</span>  <b style="color:#fff">${s.isDragging ? 'yes' : 'no'}</b>
        &nbsp;&nbsp;<span style="color:#555">Hover</span> <b style="color:#fff">${s.hoveredMesh ? (s.hoveredMesh.userData.item?.name || '✓') : '—'}</b>
      </div>
    `;
  }

  // ── Canvas scaling (linked to bounds debug) ───────────────────────────────────

  _setCanvasScale(scale) {
    const c = this.container;
    if (scale >= 0.99) {
      // Restore original styles exactly
      Object.assign(c.style, this._origStyles);
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w  = Math.round(vw * scale);
      const h  = Math.round(vh * scale);
      c.style.position = 'fixed';
      c.style.width    = `${w}px`;
      c.style.height   = `${h}px`;
      c.style.left     = `${Math.round((vw - w) / 2)}px`;
      c.style.top      = `${Math.round((vh - h) / 2)}px`;
    }
  }

  // ── Bounds canvas overlay ─────────────────────────────────────────────────────

  _createBoundsCanvas() {
    const c = document.createElement('canvas');
    c.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9998;
    `;
    this.container.appendChild(c);
    this._boundsViz = c;
  }

  _syncBoundsSize() {
    this._boundsViz.width  = this.container.clientWidth;
    this._boundsViz.height = this.container.clientHeight;
  }

  _drawBounds() {
    this._syncBoundsSize();
    const canvas = this._boundsViz;
    const ctx    = canvas.getContext('2d');
    const w      = canvas.width;
    const h      = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Viewport edge
    ctx.strokeStyle = 'rgba(80,255,120,0.55)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Buffer zone (3× viewport, centred)
    ctx.strokeStyle = 'rgba(255,200,50,0.35)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-w, -h, w * 3, h * 3);
    ctx.setLineDash([]);

    // Legend
    ctx.font      = '10px monospace';
    ctx.fillStyle = 'rgba(80,255,120,0.7)';
    ctx.fillText('● viewport', 8, 16);
    ctx.fillStyle = 'rgba(255,200,50,0.6)';
    ctx.fillText('● buffer 3×', 8, 29);
  }

  _clearBounds() {
    if (!this._boundsViz) return;
    const ctx = this._boundsViz.getContext('2d');
    ctx.clearRect(0, 0, this._boundsViz.width, this._boundsViz.height);
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────

  _makeToggle(label, get, set) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:3px 0;';

    const lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.color = '#8a8a8a';

    const btn = document.createElement('button');
    const refresh = () => {
      const on = get();
      btn.textContent     = on ? 'ON' : 'OFF';
      btn.style.background = on ? 'rgba(80,255,120,0.18)' : 'rgba(255,255,255,0.05)';
      btn.style.color      = on ? '#aaffcc'               : 'rgba(170,255,200,0.35)';
      btn.style.borderColor = on ? 'rgba(100,255,180,0.3)' : 'rgba(255,255,255,0.1)';
    };
    btn.style.cssText = `
      font: 10px monospace;
      padding: 2px 8px;
      border-radius: 3px;
      border: 1px solid;
      cursor: pointer;
      transition: all 0.12s;
    `;
    refresh();
    btn.addEventListener('click', () => { set(!get()); refresh(); });

    row.appendChild(lbl);
    row.appendChild(btn);
    return row;
  }

  _makeSlider(label, min, max, step, get, set) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin: 5px 0;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:2px;';

    const lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.color = '#8a8a8a';

    const val = document.createElement('span');
    val.textContent = get().toFixed(2);
    val.style.color = '#fff';

    header.appendChild(lbl);
    header.appendChild(val);

    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = min;
    slider.max   = max;
    slider.step  = step;
    slider.value = get();
    slider.style.cssText = 'width:100%;accent-color:#44ffaa;';
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      set(v);
      val.textContent = v.toFixed(2);
    });

    wrap.appendChild(header);
    wrap.appendChild(slider);
    return wrap;
  }
}
