/**
 * CafeRenderer.js — True Top-Down Cafe View
 *
 * Renders the cafe interior as a top-down (bird's-eye) room driven by the
 * TileMap grid.  Each tile is drawn according to its type:
 *   WALL    — thick brown border tile
 *   FLOOR   — warm wood-coloured floor tile with subtle grid lines
 *   DOOR    — open doorway tile on the left wall (entrance)
 *   COUNTER — dark coffee-counter tile on the right side
 *
 * Decorative elements (windows, plants, entrance label, title wallpaper)
 * are drawn after the tile pass.
 *
 * The optional skyTint overlay is applied last so day/night colour-grading
 * affects the whole scene.
 */

import { TILE, COLS, ROWS } from '../core/TileMap.js';
import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class CafeRenderer {
  /**
   * @param {number}  w       - CSS-pixel canvas width
   * @param {number}  h       - CSS-pixel canvas height
   * @param {TileMap} tileMap - TileMap instance (required for top-down rendering)
   */
  constructor(w, h, tileMap = null) {
    this.w       = w;
    this.h       = h;
    this.tileMap = tileMap;
  }

  render(ctx, skyTint = null) {
    if (this.tileMap) {
      this._renderTopDown(ctx, skyTint);
    } else {
      // Minimal fallback — plain background so the game is never blank.
      ctx.fillStyle = '#FFF0D9';
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  // ─── Top-down render ────────────────────────────────────────────────────────

  _renderTopDown(ctx, skyTint) {
    const tm = this.tileMap;
    const W  = this.w;
    const H  = this.h;

    // ── A. Full-canvas background ──────────────────────────────────────────────
    ctx.fillStyle = '#FFF0D9';
    ctx.fillRect(0, 0, W, H);

    // Heart wallpaper in the title strip above the room.
    ctx.save();
    ctx.font      = '12px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.38)';
    for (let px = 18; px < W; px += 52) {
      for (let py = 12; py < tm.originY; py += 28) {
        ctx.fillText('♥', px, py);
      }
    }
    ctx.restore();

    // ── B. Tile-by-tile pass ───────────────────────────────────────────────────
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = tm.layout[row][col];
        const px   = tm.originX + col * tm.tileW;
        const py   = tm.originY + row * tm.tileH;

        switch (tile) {
          case TILE.WALL:
            this._drawWallTile(ctx, px, py, tm.tileW, tm.tileH);
            break;
          case TILE.FLOOR:
            this._drawFloorTile(ctx, px, py, tm.tileW, tm.tileH, col, row);
            break;
          case TILE.DOOR:
            this._drawDoorTile(ctx, px, py, tm.tileW, tm.tileH);
            break;
          case TILE.COUNTER:
            this._drawCounterTile(ctx, px, py, tm.tileW, tm.tileH);
            break;
          default:
            break;
        }
      }
    }

    // ── C. Decorative elements ─────────────────────────────────────────────────
    this._drawWindows(ctx, tm);
    this._drawCornerPlants(ctx, tm);
    this._drawEntranceLabel(ctx, tm);
    this._drawCounterLabel(ctx, tm);

    // ── D. Sky-tint overlay (day / night colour grading) ──────────────────────
    if (skyTint) {
      ctx.save();
      ctx.fillStyle = skyTint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ─── Tile drawers ────────────────────────────────────────────────────────────

  _drawWallTile(ctx, px, py, tw, th) {
    ctx.fillStyle = '#7B6B55';
    ctx.fillRect(px, py, tw, th);
    ctx.strokeStyle = 'rgba(50,35,15,0.55)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(px, py, tw, th);
  }

  _drawFloorTile(ctx, px, py, tw, th, col, row) {
    // Subtle checkerboard for visual depth.
    const light = (col + row) % 2 === 0;
    ctx.fillStyle = light ? '#F5E2BE' : '#EDCE9E';
    ctx.fillRect(px, py, tw, th);
    ctx.strokeStyle = 'rgba(160,120,60,0.18)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(px, py, tw, th);
  }

  _drawDoorTile(ctx, px, py, tw, th) {
    // Open doorway — lighter warm tone to distinguish from walls.
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(px, py, tw, th);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(px, py, tw, th);
  }

  _drawCounterTile(ctx, px, py, tw, th) {
    ctx.fillStyle   = '#6B4F2E';
    ctx.fillRect(px, py, tw, th);
    ctx.strokeStyle = '#3D2208';
    ctx.lineWidth   = 1;
    ctx.strokeRect(px, py, tw, th);
  }

  // ─── Decorative elements ─────────────────────────────────────────────────────

  /** Two windows in the north wall. */
  _drawWindows(ctx, tm) {
    ctx.save();
    const winW = Math.max(tm.tileW * 0.70, 28);
    const winH = Math.max(tm.tileH * 0.60, 14);
    const winY = tm.originY + tm.tileH * 0.20;

    // Placed at column 4 and column 9 of the north wall row.
    const cols = [4, 9];
    for (const col of cols) {
      const wx = tm.originX + col * tm.tileW + (tm.tileW - winW) / 2;

      // Sky pane
      ctx.fillStyle   = '#87CEEB';
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 2;
      _roundRect(ctx, wx, winY, winW, winH, 3);
      ctx.fill();
      ctx.stroke();

      // Cross divider
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx + winW / 2, winY);
      ctx.lineTo(wx + winW / 2, winY + winH);
      ctx.moveTo(wx,            winY + winH / 2);
      ctx.lineTo(wx + winW,     winY + winH / 2);
      ctx.stroke();

      // Curtains
      ctx.fillStyle = '#FF8FAB';
      // Left curtain
      ctx.beginPath();
      ctx.moveTo(wx,            winY);
      ctx.quadraticCurveTo(wx + winW * 0.22, winY + winH * 0.5, wx, winY + winH);
      ctx.lineTo(wx + winW * 0.22, winY + winH);
      ctx.quadraticCurveTo(wx + winW * 0.28, winY + winH * 0.5, wx + winW * 0.22, winY);
      ctx.closePath();
      ctx.fill();
      // Right curtain
      ctx.beginPath();
      ctx.moveTo(wx + winW,            winY);
      ctx.quadraticCurveTo(wx + winW * 0.78, winY + winH * 0.5, wx + winW, winY + winH);
      ctx.lineTo(wx + winW * 0.78, winY + winH);
      ctx.quadraticCurveTo(wx + winW * 0.72, winY + winH * 0.5, wx + winW * 0.78, winY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Small potted plants in the top-left and top-right floor corners. */
  _drawCornerPlants(ctx, tm) {
    const s = Math.max(0.55, Math.min(tm.tileW, tm.tileH) / 55);
    // Top-left corner (col 1, row 1)
    const tl = tm.tileToWorld(1, 1);
    this._drawTopDownPot(ctx, tl.x, tl.y, s);
    // Top-right corner (col 11, row 1)
    const tr = tm.tileToWorld(11, 1);
    this._drawTopDownPot(ctx, tr.x, tr.y, s);
  }

  _drawTopDownPot(ctx, cx, cy, scale = 1) {
    const s = scale;

    // Circular pot (top view)
    ctx.fillStyle   = '#A07040';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leaf canopy (circular, slightly offset)
    ctx.fillStyle   = '#5DB85D';
    ctx.strokeStyle = '#3A7A3A';
    ctx.lineWidth   = 1.5;
    for (const [lx, ly] of [[cx - 5 * s, cy - 6 * s], [cx + 5 * s, cy - 6 * s],
                              [cx, cy - 10 * s],         [cx, cy + 2 * s]]) {
      ctx.beginPath();
      ctx.arc(lx, ly, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  /** "入口" label overlaid on the door tiles. */
  _drawEntranceLabel(ctx, tm) {
    ctx.save();
    const fontSize = Math.max(8, Math.min(tm.tileW, tm.tileH) * 0.32);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    // Position in the middle of the two DOOR tiles (rows 4–5, col 0).
    const lx = tm.originX + tm.tileW * 0.5;
    const ly = tm.originY + 4.5 * tm.tileH + fontSize * 0.4;
    ctx.fillText('入', lx, ly);
    ctx.restore();
  }

  /** "☕ 吧台" label and a tiny coffee machine icon on the counter tiles. */
  _drawCounterLabel(ctx, tm) {
    ctx.save();
    const fontSize = Math.max(8, Math.min(tm.tileW, tm.tileH) * 0.30);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFE0B2';
    ctx.textAlign = 'center';
    // Middle of the counter column (col 12, rows 3–5).
    const lx = tm.originX + 12.5 * tm.tileW;
    const ly = tm.originY + 4 * tm.tileH;
    ctx.fillText('☕', lx, ly);
    ctx.fillText('吧台', lx, ly + fontSize * 1.2);
    ctx.restore();
  }
}
