/**
 * drawUtils.js
 * Shared Canvas 2D drawing utilities used across all renderer and UI modules.
 */

/**
 * Draw a rounded rectangle path on the given context.
 * The path is NOT filled or stroked — call ctx.fill() / ctx.stroke() after.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} r - Corner radius
 */
export function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}
