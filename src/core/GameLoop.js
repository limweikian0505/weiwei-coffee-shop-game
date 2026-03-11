/**
 * GameLoop.js
 * Drives the main game update + render cycle using requestAnimationFrame.
 * Delta time is capped at 0.1 s to avoid the "spiral of death" when the
 * tab loses focus and a huge dt arrives on the next frame.
 */

export class GameLoop {
  /** @param {Object} game - must implement game.update(dt) and game.render() */
  constructor(game) {
    this.game         = game;
    this._lastTime    = null;
    this._rafHandle   = null;
    this._running     = false;
    this._paused      = false;

    // Pause the loop when the page is hidden (e.g. phone Home button pressed),
    // and reset the clock on resume to prevent a huge dt jump.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._paused = true;
      } else {
        this._paused    = false;
        this._lastTime  = null; // reset so next tick gets dt = 0
      }
    });
  }

  /** Start the loop. */
  start() {
    if (this._running) return;
    this._running  = true;
    this._lastTime = performance.now();
    this._tick(this._lastTime);
  }

  /** Stop the loop. */
  stop() {
    this._running = false;
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _tick = (timestamp) => {
    if (!this._running) return;

    if (!this._paused) {
      // Calculate delta time in seconds, capped at 0.1 s
      const dt = this._lastTime === null
        ? 0
        : Math.min((timestamp - this._lastTime) / 1000, 0.1);

      this._lastTime = timestamp;

      this.game.update(dt);
      this.game.render();
    }

    this._rafHandle = requestAnimationFrame(this._tick);
  };
}
