/**
 * StarRatingPopup.js
 * Manages floating star-rating animations that appear above customers.
 */

export class StarRatingPopup {
  constructor() {
    this._animations = [];
  }

  /**
   * @param {number} x - canvas X (customer position)
   * @param {number} y - canvas Y
   * @param {number} stars - 1–5
   */
  addRating(x, y, stars) {
    const stars_str = '⭐'.repeat(stars);
    this._animations.push({
      text  : stars_str,
      x, y  : y - 20,
      alpha : 1,
      vy    : -50, // pixels per second upward
      life  : 1.5, // seconds
      timer : 1.5,
    });
  }

  update(dt) {
    for (const a of this._animations) {
      a.timer -= dt;
      a.y     += a.vy * dt;
      a.alpha  = Math.max(0, a.timer / a.life);
    }
    this._animations = this._animations.filter((a) => a.timer > 0);
  }

  render(ctx) {
    ctx.save();
    ctx.font      = '18px serif';
    ctx.textAlign = 'center';
    for (const a of this._animations) {
      ctx.globalAlpha = a.alpha;
      ctx.fillText(a.text, a.x, a.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
