/**
 * iso.js
 * Isometric projection utilities — cabinet / 2:1 diamond grid.
 *
 * TILE_W and TILE_H define the isometric cell size.
 * The origin (0,0) world maps to screen (originX, originY).
 *
 * Axes:
 *   +wx → lower-right on screen
 *   +wy → lower-left  on screen
 */

export const TILE_W = 64; // width of one iso tile
export const TILE_H = 32; // height (half of width for classic 2:1 iso)

/**
 * Convert world (wx, wy) → screen (sx, sy).
 * @param {number} wx
 * @param {number} wy
 * @param {number} originX - screen X for world (0,0)
 * @param {number} originY - screen Y for world (0,0)
 * @returns {{ sx: number, sy: number }}
 */
export function worldToIso(wx, wy, originX, originY) {
  return {
    sx: originX + (wx - wy) * (TILE_W / 2),
    sy: originY + (wx + wy) * (TILE_H / 2),
  };
}

/**
 * Convert screen (sx, sy) → world (wx, wy).
 * @param {number} sx
 * @param {number} sy
 * @param {number} originX
 * @param {number} originY
 * @returns {{ wx: number, wy: number }}
 */
export function isoToWorld(sx, sy, originX, originY) {
  const dx = sx - originX;
  const dy = sy - originY;
  return {
    wx: (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2,
    wy: (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2,
  };
}
