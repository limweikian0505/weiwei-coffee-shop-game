/**
 * CafeRenderer.js — True Top-Down Cafe View
 *
 * Renders the cafe interior as a top-down (bird's-eye) room driven by the
 * TileMap grid.  Each tile is drawn according to its type:
 *   WALL    — thick warm-brown border tile with baseboard trim
 *   FLOOR   — warm wood-plank floor tile (subtle alternating grains)
 *   DOOR    — open doorway tile on the left wall (entrance)
 *   COUNTER — dark coffee-counter tile on the right side
 *   TABLE   — drawn as floor (the TableRenderer draws furniture on top)
 *
 * Decorative elements (windows, plants, lights, entrance mat, counter detail,
 * title wallpaper) are composited after the tile pass.
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
    ctx.fillStyle = '#EAD5B0';
    ctx.fillRect(0, 0, W, H);

    // Heart wallpaper in the title strip above the room.
    ctx.save();
    ctx.font      = '11px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.35)';
    for (let px = 18; px < W; px += 48) {
      for (let py = 10; py < tm.originY; py += 24) {
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
            this._drawWallTile(ctx, px, py, tm.tileW, tm.tileH, col, row, tm);
            break;
          case TILE.TABLE: // TABLE tile — draw floor beneath; TableRenderer paints furniture on top
          case TILE.FLOOR:
            this._drawFloorTile(ctx, px, py, tm.tileW, tm.tileH, col, row);
            break;
          case TILE.DOOR:
            this._drawDoorTile(ctx, px, py, tm.tileW, tm.tileH);
            break;
          case TILE.COUNTER:
            this._drawCounterTile(ctx, px, py, tm.tileW, tm.tileH, row, tm);
            break;
          default:
            break;
        }
      }
    }

    // ── C. Decorative elements ─────────────────────────────────────────────────
    this._drawCeilingLights(ctx, tm);
    this._drawWindows(ctx, tm);
    this._drawEntranceMat(ctx, tm);
    this._drawCornerPlants(ctx, tm);
    this._drawEntranceLabel(ctx, tm);
    this._drawCounterDetail(ctx, tm);

    // ── D. Sky-tint overlay (day / night colour grading) ──────────────────────
    if (skyTint) {
      ctx.save();
      ctx.fillStyle = skyTint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ─── Tile drawers ────────────────────────────────────────────────────────────

  _drawWallTile(ctx, px, py, tw, th, col, row, tm) {
    // Base wall fill — warm earthy brown.
    ctx.fillStyle = '#7B6B55';
    ctx.fillRect(px, py, tw, th);

    // Subtle brick/panel lines for texture.
    ctx.strokeStyle = 'rgba(50,30,10,0.28)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(px, py, tw, th);

    // Inner-edge baseboard shadow on walls that face the interior floor.
    // Checks if the tile directly below (for north wall) or to the right
    // (for west wall) is a floor tile — if so, draw a shadow strip.
    const shadowW = Math.max(2, tw * 0.12);
    const shadowH = Math.max(2, th * 0.12);

    // South-facing wall edge (wall above floor)
    if (row + 1 < ROWS) {
      const below = tm.layout[row + 1][col];
      if (below === TILE.FLOOR || below === TILE.TABLE || below === TILE.DOOR) {
        ctx.fillStyle = 'rgba(30,15,0,0.30)';
        ctx.fillRect(px, py + th - shadowH, tw, shadowH);
      }
    }
    // East-facing wall edge (wall left of floor)
    if (col + 1 < COLS) {
      const right = tm.layout[row][col + 1];
      if (right === TILE.FLOOR || right === TILE.TABLE || right === TILE.DOOR || right === TILE.COUNTER) {
        ctx.fillStyle = 'rgba(30,15,0,0.30)';
        ctx.fillRect(px + tw - shadowW, py, shadowW, th);
      }
    }
  }

  _drawFloorTile(ctx, px, py, tw, th, col, row) {
    // Warm wood-plank pattern: alternating light/medium tone rows for planks.
    const plankRow = Math.floor(row * 2 + col * 0.3) % 3;
    const colors   = ['#F0D9B0', '#E8C890', '#EDD3A0'];
    ctx.fillStyle  = colors[plankRow % colors.length];
    ctx.fillRect(px, py, tw, th);

    // Horizontal plank grain lines
    ctx.strokeStyle = 'rgba(160,110,50,0.14)';
    ctx.lineWidth   = 0.5;
    const grainY = py + th * 0.5;
    ctx.beginPath();
    ctx.moveTo(px, grainY);
    ctx.lineTo(px + tw, grainY);
    ctx.stroke();

    // Tile edge grid line
    ctx.strokeStyle = 'rgba(160,110,50,0.10)';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(px, py, tw, th);
  }

  _drawDoorTile(ctx, px, py, tw, th) {
    // Open doorway — lighter warm tone to distinguish from walls.
    ctx.fillStyle = '#D4A96A';
    ctx.fillRect(px, py, tw, th);
    // Threshold line
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 2;
    ctx.strokeRect(px, py, tw, th);
    // Doorway gap indicator (lighter centre strip)
    ctx.fillStyle = 'rgba(255,240,200,0.30)';
    ctx.fillRect(px + tw * 0.2, py, tw * 0.6, th);
  }

  _drawCounterTile(ctx, px, py, tw, th, row, tm) {
    // Dark espresso-counter base.
    ctx.fillStyle = '#5A3D20';
    ctx.fillRect(px, py, tw, th);

    // Counter-top surface highlight (lighter strip on the left/service edge).
    ctx.fillStyle = '#7A5530';
    ctx.fillRect(px, py, tw * 0.28, th);

    // Tile separator lines.
    ctx.strokeStyle = '#3A2008';
    ctx.lineWidth   = 1;
    ctx.strokeRect(px, py, tw, th);

    // Top counter row: draw a small coffee machine icon in the middle tile (row 4).
    if (row === 4) {
      this._drawCoffeeMachineIcon(ctx, px + tw / 2, py + th / 2, Math.min(tw, th) * 0.35);
    }
  }

  // ─── Decorative elements ─────────────────────────────────────────────────────

  /** Soft ceiling-light glow circles on the floor — gives depth to top-down view. */
  _drawCeilingLights(ctx, tm) {
    const lightPositions = [
      { tx: 3,  ty: 2 }, // over upper-left seating area
      { tx: 7,  ty: 2 }, // centre
      { tx: 10, ty: 2 }, // over upper-right seating area
      { tx: 5,  ty: 5 }, // mid-floor
      { tx: 9,  ty: 5 }, // mid-right
    ];
    for (const { tx, ty } of lightPositions) {
      const cx = tm.originX + (tx + 0.5) * tm.tileW;
      const cy = tm.originY + (ty + 0.5) * tm.tileH;
      const r  = Math.max(tm.tileW, tm.tileH) * 0.75;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,   'rgba(255,245,200,0.22)');
      grad.addColorStop(0.6, 'rgba(255,235,170,0.07)');
      grad.addColorStop(1,   'rgba(255,220,140,0.00)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Two windows set into the north wall tiles at columns 4 and 9. */
  _drawWindows(ctx, tm) {
    ctx.save();
    const winW = Math.max(tm.tileW * 0.72, 26);
    const winH = Math.max(tm.tileH * 0.58, 13);
    // Placed in the north-wall row, centred in their tiles.
    const winY = tm.originY + (tm.tileH - winH) * 0.45;

    for (const col of [4, 9]) {
      const wx = tm.originX + col * tm.tileW + (tm.tileW - winW) / 2;

      // Sky pane
      ctx.fillStyle   = '#87CEEB';
      ctx.strokeStyle = '#7A5C1E';
      ctx.lineWidth   = 2;
      _roundRect(ctx, wx, winY, winW, winH, 3);
      ctx.fill();
      ctx.stroke();

      // Cross divider
      ctx.strokeStyle = '#7A5C1E';
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

      // Sill ledge
      ctx.fillStyle = 'rgba(150,100,30,0.30)';
      ctx.fillRect(wx - 2, winY + winH, winW + 4, Math.max(2, tm.tileH * 0.08));
    }
    ctx.restore();
  }

  /** Welcome mat at the entrance (inside the door tiles). */
  _drawEntranceMat(ctx, tm) {
    ctx.save();
    const mx = tm.originX + tm.tileW * 0.12;
    const my = tm.originY + 4 * tm.tileH + tm.tileH * 0.15;
    const mw = tm.tileW * 0.76;
    const mh = tm.tileH * 1.70;

    // Mat base
    _roundRect(ctx, mx, my, mw, mh, 3);
    ctx.fillStyle = '#8B3A3A';
    ctx.fill();

    // Mat border pattern
    ctx.strokeStyle = '#FFB347';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, mx + 2, my + 2, mw - 4, mh - 4, 2);
    ctx.stroke();

    // Mat welcome text
    const fs = Math.max(6, Math.min(mw * 0.38, mh * 0.22));
    ctx.font      = `bold ${fs}px serif`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('欢迎', mx + mw / 2, my + mh / 2 + fs * 0.35);
    ctx.restore();
  }

  /** Small potted plants in the top-left and top-right floor corners. */
  _drawCornerPlants(ctx, tm) {
    const s = Math.max(0.55, Math.min(tm.tileW, tm.tileH) / 52);
    const tl = tm.tileToWorld(1, 1);
    this._drawTopDownPot(ctx, tl.x, tl.y, s);
    const tr = tm.tileToWorld(11, 1);
    this._drawTopDownPot(ctx, tr.x, tr.y, s);
  }

  _drawTopDownPot(ctx, cx, cy, scale = 1) {
    const s = scale;

    ctx.fillStyle   = '#A07040';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#5DB85D';
    ctx.strokeStyle = '#3A7A3A';
    ctx.lineWidth   = 1.5;
    for (const [lx, ly] of [
      [cx - 5 * s, cy - 6 * s],
      [cx + 5 * s, cy - 6 * s],
      [cx, cy - 10 * s],
      [cx, cy + 2 * s],
    ]) {
      ctx.beginPath();
      ctx.arc(lx, ly, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  /** "入口" label overlaid on the door tiles. */
  _drawEntranceLabel(ctx, tm) {
    ctx.save();
    const fontSize = Math.max(7, Math.min(tm.tileW, tm.tileH) * 0.28);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    const lx = tm.originX + tm.tileW * 0.50;
    const ly = tm.originY + 4 * tm.tileH + fontSize * 0.35;
    ctx.fillText('入', lx, ly);
    ctx.fillText('口', lx, ly + fontSize * 1.2);
    ctx.restore();
  }

  /**
   * Counter top detail: service-bar label, menu board on the north wall,
   * and a coffee machine icon drawn by _drawCounterTile for the middle row.
   */
  _drawCounterDetail(ctx, tm) {
    ctx.save();
    // "吧台" label below the coffee machine tile.
    const fontSize = Math.max(7, Math.min(tm.tileW, tm.tileH) * 0.28);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFE0B2';
    ctx.textAlign = 'center';
    const lx = tm.originX + 12.5 * tm.tileW;
    ctx.fillText('吧台', lx, tm.originY + 5.5 * tm.tileH + fontSize * 0.5);

    // Mini chalkboard menu on the north wall between windows (col 7, row 0 area).
    const bx = tm.originX + 6.6 * tm.tileW;
    const by = tm.originY + tm.tileH * 0.08;
    const bw = tm.tileW * 1.8;
    const bh = Math.max(tm.tileH * 0.70, 16);
    _roundRect(ctx, bx, by, bw, bh, 3);
    ctx.fillStyle   = '#2E4020';
    ctx.fill();
    ctx.strokeStyle = '#C8A866';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    const mfs = Math.max(6, bh * 0.32);
    ctx.font      = `${mfs}px serif`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('☕ 今日特饮', bx + bw / 2, by + bh * 0.62);
    ctx.restore();
  }

  /** Small coffee machine silhouette drawn inside a counter tile. */
  _drawCoffeeMachineIcon(ctx, cx, cy, size) {
    ctx.save();
    const s = size;
    // Machine body
    ctx.fillStyle   = '#2A1A0A';
    ctx.strokeStyle = '#C87941';
    ctx.lineWidth   = 1;
    _roundRect(ctx, cx - s, cy - s * 0.9, s * 2, s * 1.8, 3);
    ctx.fill();
    ctx.stroke();
    // Steam wisps
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = 1;
    for (const ox of [-s * 0.25, s * 0.25]) {
      ctx.beginPath();
      ctx.moveTo(cx + ox, cy - s * 0.9);
      ctx.quadraticCurveTo(cx + ox + s * 0.15, cy - s * 1.4, cx + ox, cy - s * 1.8);
      ctx.stroke();
    }
    // Cup silhouette
    ctx.fillStyle = '#C87941';
    ctx.fillRect(cx - s * 0.3, cy + s * 0.2, s * 0.6, s * 0.5);
    ctx.restore();
  }
}

