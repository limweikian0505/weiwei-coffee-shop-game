/**
 * TileMap.js
 * Tile/grid foundation for the top-down cafe.
 *
 * Grid layout (COLS × ROWS):
 *   WALL    (0) — impassable boundary
 *   FLOOR   (1) — walkable floor tile
 *   DOOR    (2) — walkable entrance/exit tile
 *   COUNTER (3) — impassable counter/bar tile
 *
 * Screen mapping:
 *   The grid fills a rectangular region of the canvas, leaving
 *   space at the top for the title bar and at the bottom for HUD buttons.
 *
 * Coordinate conventions:
 *   Tile coordinates : integer (tx, ty) where (0,0) is the top-left corner.
 *   World coordinates: float  (x,  y)  in CSS pixels, origin at canvas top-left.
 */

export const COLS = 14;
export const ROWS = 9;

export const TILE = {
  WALL:    0,
  FLOOR:   1,
  DOOR:    2, // walkable — entrance / exit
  COUNTER: 3, // impassable — counter / bar
  TABLE:   4, // impassable — furniture (set dynamically by Game.js)
};

/**
 * Base tile layout — row-major [row][col].
 *
 * Col:  0  1  2  3  4  5  6  7  8  9 10 11 12 13
 */
const BASE_LAYOUT = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // row 0 — north wall
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],  // row 1
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],  // row 2
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],  // row 3 — counter at col 12
  [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],  // row 4 — door at col 0, counter at col 12
  [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],  // row 5 — door at col 0, counter at col 12
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],  // row 6
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],  // row 7
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // row 8 — south wall
];

export class TileMap {
  /**
   * @param {number} canvasW - CSS-pixel canvas width
   * @param {number} canvasH - CSS-pixel canvas height
   */
  constructor(canvasW, canvasH) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    // Deep-copy layout so individual instances can be modified safely.
    this.layout  = BASE_LAYOUT.map((row) => [...row]);
    this._recalc();
  }

  /** Recompute pixel dimensions after a canvas resize. */
  resize(canvasW, canvasH) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this._recalc();
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  _recalc() {
    const W = this.canvasW;
    const H = this.canvasH;
    // Reserve vertical space for the title bar (top) and HUD buttons (bottom).
    const topPad = Math.max(30, H * 0.07);
    const botPad = Math.max(55, H * 0.13);

    this.originX = 0;
    this.originY = topPad;
    this.gridW   = W;
    this.gridH   = H - topPad - botPad;

    this.tileW = this.gridW / COLS;
    this.tileH = this.gridH / ROWS;
  }

  // ─── Tile mutation ────────────────────────────────────────────────────────────

  /**
   * Overwrite a single tile's type.  Used by Game.js to mark furniture as
   * impassable after placing tables.
   *
   * @param {number} tx - Tile column
   * @param {number} ty - Tile row
   * @param {number} type - TILE.* constant
   */
  setTile(tx, ty, type) {
    if (tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS) {
      this.layout[ty][tx] = type;
    }
  }

  // ─── Tile queries ─────────────────────────────────────────────────────────────

  /**
   * Whether tile (tx, ty) can be walked on.
   * Tiles outside the grid boundary are not walkable.
   */
  isWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
    const t = this.layout[ty][tx];
    return t === TILE.FLOOR || t === TILE.DOOR;
  }

  // ─── Coordinate conversion ────────────────────────────────────────────────────

  /** Centre of tile (tx, ty) in world (CSS-pixel) coordinates. */
  tileToWorld(tx, ty) {
    return {
      x: this.originX + (tx + 0.5) * this.tileW,
      y: this.originY + (ty + 0.5) * this.tileH,
    };
  }

  /** Tile column that contains world x. */
  worldToTileX(wx) {
    return Math.floor((wx - this.originX) / this.tileW);
  }

  /** Tile row that contains world y. */
  worldToTileY(wy) {
    return Math.floor((wy - this.originY) / this.tileH);
  }

  /** Tile (tx, ty) containing world position (wx, wy). */
  worldToTile(wx, wy) {
    return { tx: this.worldToTileX(wx), ty: this.worldToTileY(wy) };
  }

  /** World x of tile-column centre. */
  tileCenterX(tx) { return this.originX + (tx + 0.5) * this.tileW; }

  /** World y of tile-row centre. */
  tileCenterY(ty) { return this.originY + (ty + 0.5) * this.tileH; }

  // ─── Pathfinding ──────────────────────────────────────────────────────────────

  /**
   * BFS tile-path from (fromTx, fromTy) to (toTx, toTy).
   *
   * Returns an array of {tx, ty} steps (not including the start tile),
   * or [] when source == destination or no walkable path exists.
   *
   * Blocked and out-of-bounds tiles are never traversed.
   */
  findPath(fromTx, fromTy, toTx, toTy) {
    if (fromTx === toTx && fromTy === toTy) return [];

    const visited = new Set([`${fromTx},${fromTy}`]);
    const queue   = [{ tx: fromTx, ty: fromTy, path: [] }];
    const DIRS    = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0,  dy: -1 },
    ];

    while (queue.length) {
      const { tx, ty, path } = queue.shift();

      for (const { dx, dy } of DIRS) {
        const nx  = tx + dx;
        const ny  = ty + dy;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const newPath = [...path, { tx: nx, ty: ny }];
        if (nx === toTx && ny === toTy) return newPath;
        if (this.isWalkable(nx, ny)) queue.push({ tx: nx, ty: ny, path: newPath });
      }
    }

    return []; // no path found
  }

  // ─── Special positions ────────────────────────────────────────────────────────

  /** First walkable tile just inside the entrance door (column 1, row 4). */
  getEntranceTile() {
    return { tx: 1, ty: 4 };
  }

  /**
   * World-space position for the customer spawn point (just off the left edge).
   * @returns {{ x: number, y: number }}
   */
  getSpawnWorldPos() {
    return {
      x: this.originX - this.tileW,
      y: this.tileCenterY(4),
    };
  }

  /**
   * World-space position customers walk toward when fully leaving the cafe.
   * @returns {{ x: number, y: number }}
   */
  getExitWorldPos() {
    return {
      x: this.originX - this.tileW * 2.5,
      y: this.tileCenterY(4),
    };
  }

  /**
   * Find the nearest walkable tile to the given world position.
   * Searches in expanding rings up to distance 4, checking cardinal
   * neighbours (N/E/S/W) before diagonal ones at each ring level so that
   * the result is axis-aligned whenever possible.  This avoids diagonally-
   * offset approach tiles that produce unnecessarily long customer paths.
   *
   * Falls back to the entrance tile when no walkable tile is found nearby.
   *
   * @param {number} wx
   * @param {number} wy
   * @returns {{ tx: number, ty: number }}
   */
  nearestWalkableTile(wx, wy) {
    const { tx: baseTx, ty: baseTy } = this.worldToTile(wx, wy);

    for (let d = 0; d <= 4; d++) {
      // d === 0 : check the tile that contains the world position itself.
      if (d === 0) {
        if (this.isWalkable(baseTx, baseTy)) return { tx: baseTx, ty: baseTy };
        continue;
      }

      // Cardinal neighbours at Manhattan distance d (N → E → S → W).
      // These are preferred over diagonal cells at the same ring distance.
      for (const [dx, dy] of [[0, -d], [d, 0], [0, d], [-d, 0]]) {
        if (this.isWalkable(baseTx + dx, baseTy + dy)) {
          return { tx: baseTx + dx, ty: baseTy + dy };
        }
      }

      // Non-cardinal cells of the Chebyshev ring at distance d
      // (corners and mixed-axis cells checked after all cardinals).
      for (let dy = -d; dy <= d; dy++) {
        for (let dx = -d; dx <= d; dx++) {
          if (dx === 0 || dy === 0) continue;                   // cardinals already handled
          if (Math.abs(dx) !== d && Math.abs(dy) !== d) continue; // inner cells
          if (this.isWalkable(baseTx + dx, baseTy + dy)) {
            return { tx: baseTx + dx, ty: baseTy + dy };
          }
        }
      }
    }

    return this.getEntranceTile(); // fallback
  }
}
