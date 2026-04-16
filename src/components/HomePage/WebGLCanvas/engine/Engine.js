/**
 * Engine — main loop lifecycle.
 *
 * Owns the requestAnimationFrame loop and calls update(delta) on every
 * registered module in the order they were supplied.  DeltaTime is capped
 * at 100 ms so a tab becoming visible after being hidden doesn't cause a
 * huge jump.
 */
export default class Engine {
  /**
   * @param {Object} state   - Shared state object
   * @param {Array}  modules - Ordered list of { update(delta) } objects
   */
  constructor(state, modules) {
    this.state   = state;
    this.modules = modules;
    this.rafId   = null;
    this.lastTime = 0;
    this._loop = this._loop.bind(this);
  }

  start() {
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(timestamp) {
    this.rafId = requestAnimationFrame(this._loop);

    const rawDelta = (timestamp - this.lastTime) / 1000;
    this.lastTime  = timestamp;

    // Cap delta so a dormant tab doesn't produce a massive jump
    const delta = Math.min(rawDelta, 0.1);

    this.state.deltaTime = delta;
    this.state.fps       = delta > 0 ? Math.round(1 / delta) : 0;

    for (const mod of this.modules) {
      mod.update(delta);
    }
  }
}
