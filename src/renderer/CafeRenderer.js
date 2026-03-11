/**
 * CafeRenderer.js — Top-Down Isometric Cafe View
 *
 * Draws the cafe interior with:
 *   - Cream sky/background area with heart wallpaper
 *   - Straight flat rectangular back walls (left side + right side)
 *   - 7×7 orange isometric tile floor grid (diamond/rhombus shape)
 *   - Wall features: entrance door (left), coffee counter (right), windows
 *   - Corner plants on the floor
 *   - Optional sky-tint overlay (dusk/night effect)
 *
 * Room geometry (all responsive to canvas W × H):
 *   isoOriginX(W) = W * 0.50  — horizontal centre / back apex of floor
 *   isoOriginY(H) = H * 0.36  — top edge of floor / bottom of back walls
 *   wallH         = H * 0.18  — height of flat rectangular back walls
 *   tileW         = min(W*0.14, H*0.12)   — iso tile width
 *   tileH         = tileW * 0.5           — iso tile height
 *
 * Exported helpers (used elsewhere):
 *   isoOriginX(W)
 *   isoOriginY(H)
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

/** Screen X of the isometric floor back-apex (world origin). */
export function isoOriginX(W) { return W * 0.50; }

/** Screen Y of the isometric floor back-apex / bottom of back walls. */
export function isoOriginY(H) { return H * 0.36; }

export class CafeRenderer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }

  render(ctx, skyTint = null) {
    const W = this.w;
    const H = this.h;

    const originX = isoOriginX(W);
    const originY = isoOriginY(H);
    const wallH   = H * 0.18;

    // Tile size — capped so the floor fits on screen in both orientations
    const tileW = Math.min(W * 0.14, H * 0.12);
    const tileH = tileW * 0.5;

    // ── A. Sky / background ───────────────────────────────────────────────────
    this._drawSky(ctx, W, H, originY);

    // ── B. Flat rectangular back walls ────────────────────────────────────────
    this._drawLeftWall(ctx, W, H, originX, originY, wallH);
    this._drawRightWall(ctx, W, H, originX, originY, wallH);

    // ── C. Orange isometric tile floor ────────────────────────────────────────
    this._drawFloor(ctx, originX, originY, tileW, tileH);

    // ── D. Wall & floor features ──────────────────────────────────────────────
    this._drawDoor(ctx, W, H, originX, originY, wallH);
    this._drawCounter(ctx, W, H, originX, originY, wallH);
    this._drawWindows(ctx, W, H, originX, originY, wallH);
    this._drawPlants(ctx, H, originX, originY, tileW, tileH);

    // ── E. Sky tint overlay ───────────────────────────────────────────────────
    if (skyTint) {
      ctx.save();
      ctx.fillStyle = skyTint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ─── A. Sky / background ────────────────────────────────────────────────────

  _drawSky(ctx, W, H, originY) {
    ctx.save();

    // Warm cream background fills the entire canvas
    ctx.fillStyle = '#FFF0D9';
    ctx.fillRect(0, 0, W, H);

    // Heart wallpaper scattered in the upper sky area (above the walls)
    ctx.font      = '13px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.38)';
    const heartBottom = originY * 0.82;
    for (let px = 18; px < W; px += 52) {
      for (let py = 16; py < heartBottom; py += 36) {
        ctx.fillText('♥', px, py);
      }
    }

    ctx.restore();
  }

  // ─── B. Back walls ──────────────────────────────────────────────────────────

  _drawLeftWall(ctx, W, H, originX, originY, wallH) {
    ctx.save();

    const wallTop = originY - wallH;

    ctx.fillStyle = '#EDD5B0';
    ctx.fillRect(0, wallTop, originX, wallH);

    ctx.strokeStyle = '#B89060';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0, wallTop, originX, wallH);

    ctx.restore();
  }

  _drawRightWall(ctx, W, H, originX, originY, wallH) {
    ctx.save();

    const wallTop = originY - wallH;

    ctx.fillStyle = '#DCC89A';
    ctx.fillRect(originX, wallTop, W - originX, wallH);

    ctx.strokeStyle = '#A88040';
    ctx.lineWidth   = 1;
    ctx.strokeRect(originX, wallTop, W - originX, wallH);

    ctx.restore();
  }

  // ─── C. Isometric tile floor ────────────────────────────────────────────────

  _drawFloor(ctx, originX, originY, tileW, tileH) {
    const ROWS = 7;
    const COLS = 7;

    // Draw tiles back-to-front (row 0 = back, row 6 = front)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Tile centre: top vertex of (0,0) sits exactly at (originX, originY)
        const cx = originX + (col - row) * (tileW / 2);
        const cy = originY + (col + row + 1) * (tileH / 2);
        this._drawTile(ctx, cx, cy, tileW, tileH);
      }
    }
  }

  _drawTile(ctx, cx, cy, tileW, tileH) {
    const hw = tileW / 2;
    const hh = tileH / 2;

    // ── Base fill ──────────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx,      cy - hh);   // top
    ctx.lineTo(cx + hw, cy);        // right
    ctx.lineTo(cx,      cy + hh);   // bottom
    ctx.lineTo(cx - hw, cy);        // left
    ctx.closePath();
    ctx.fillStyle = '#F0A030';
    ctx.fill();

    // ── Top-right facet — lighter highlight ───────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx,      cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx,      cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,200,80,0.35)';
    ctx.fill();

    // ── Bottom-left facet — darker shadow ─────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx,      cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.lineTo(cx,      cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();

    // ── Tile border ───────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx,      cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx,      cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(80,40,0,0.50)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ─── D. Door ────────────────────────────────────────────────────────────────

  _drawDoor(ctx, W, H, originX, originY, wallH) {
    ctx.save();

    // Door on the left wall, near the centre-left portion
    const doorW  = Math.max(28, originX * 0.22);
    const doorH  = wallH * 0.80;
    const doorX  = originX * 0.30;
    const doorY  = originY - doorH;

    // Door fill
    ctx.fillStyle = '#DEB887';
    _roundRect(ctx, doorX, doorY, doorW, doorH, 4);
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Centre panel line
    ctx.strokeStyle = 'rgba(139,105,20,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(doorX + doorW / 2, doorY + doorH * 0.08);
    ctx.lineTo(doorX + doorW / 2, doorY + doorH * 0.92);
    ctx.stroke();

    // Gold knob
    ctx.fillStyle   = '#FFD700';
    ctx.strokeStyle = '#B8960C';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(doorX + doorW * 0.72, doorY + doorH * 0.55, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // "入口 ➡" label below door
    const fontSize = Math.max(8, H * 0.018);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    ctx.fillText('入口 ➡', doorX + doorW / 2, originY + fontSize + 2);

    ctx.restore();
  }

  // ─── D. Counter ─────────────────────────────────────────────────────────────

  _drawCounter(ctx, W, H, originX, originY, wallH) {
    ctx.save();

    const rightW   = W - originX;
    const counterW = Math.max(50, rightW * 0.42);
    const counterH = wallH * 0.58;
    const topH     = wallH * 0.08;
    const counterX = originX + rightW * 0.28;
    const counterY = originY - counterH;

    // Counter body
    ctx.fillStyle   = '#7B4F2E';
    ctx.fillRect(counterX, counterY, counterW, counterH);
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 2;
    ctx.strokeRect(counterX, counterY, counterW, counterH);

    // Top ledge
    ctx.fillStyle   = '#A07040';
    ctx.fillRect(counterX, counterY - topH, counterW, topH);
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(counterX, counterY - topH, counterW, topH);

    // Label
    const fontSize = Math.max(9, H * 0.022);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFE0B2';
    ctx.textAlign = 'center';
    ctx.fillText('☕ 吧台', counterX + counterW / 2, counterY + counterH * 0.62);

    // Coffee machine on top ledge
    this._drawCoffeeMachine(ctx, counterX + counterW / 2, counterY - topH, H);

    ctx.restore();
  }

  _drawCoffeeMachine(ctx, cx, cy, H) {
    const s  = Math.max(0.55, H / 960);
    const mW = 34 * s;
    const mH = 28 * s;

    ctx.fillStyle   = '#2C1A08';
    ctx.strokeStyle = '#1A0900';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, cx - mW / 2, cy - mH, mW, mH, 4 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#C0392B';
    ctx.strokeStyle = '#922B21';
    ctx.lineWidth   = 1;
    _roundRect(ctx, cx - mW * 0.44, cy - mH + 3 * s, mW * 0.88, mH * 0.36, 2 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#2C3E50';
    ctx.strokeStyle = '#1A252F';
    ctx.lineWidth   = 0.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * 9 * s, cy - 4 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(200,200,200,0.55)';
    ctx.lineWidth   = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5 * s, cy - mH);
      ctx.quadraticCurveTo(cx + i * 5 * s + 3 * s, cy - mH - 6 * s, cx + i * 5 * s, cy - mH - 12 * s);
      ctx.stroke();
    }
  }

  // ─── D. Windows ─────────────────────────────────────────────────────────────

  _drawWindows(ctx, W, H, originX, originY, wallH) {
    ctx.save();

    const winW = Math.max(36, W * 0.08);
    const winH = wallH * 0.62;
    const winY = originY - wallH * 0.92;

    // Two windows — one on each side of the wall centre
    const positions = [W * 0.28, W * 0.58];

    for (const wx of positions) {
      // Sky pane
      ctx.fillStyle   = '#87CEEB';
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 2;
      _roundRect(ctx, wx, winY, winW, winH, 4);
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

      // Left curtain
      ctx.fillStyle = '#FF8FAB';
      ctx.beginPath();
      ctx.moveTo(wx - 3,     winY);
      ctx.quadraticCurveTo(wx + 7,  winY + winH * 0.4, wx - 1,     winY + winH);
      ctx.lineTo(wx + 9,             winY + winH);
      ctx.quadraticCurveTo(wx + 10, winY + winH * 0.4, wx + 9,     winY);
      ctx.closePath();
      ctx.fill();

      // Right curtain
      ctx.beginPath();
      ctx.moveTo(wx + winW + 3,      winY);
      ctx.quadraticCurveTo(wx + winW - 7,  winY + winH * 0.4, wx + winW + 1,  winY + winH);
      ctx.lineTo(wx + winW - 9,             winY + winH);
      ctx.quadraticCurveTo(wx + winW - 10, winY + winH * 0.4, wx + winW - 9, winY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // ─── D. Plants ──────────────────────────────────────────────────────────────

  _drawPlants(ctx, H, originX, originY, tileW, tileH) {
    const s = Math.max(0.6, H / 700);

    // Left-edge tile centre (6,0) and right-edge tile centre (0,6) of the floor
    // With the +1 formula: cy = originY + (col + row + 1) * tileH/2
    const leftX  = originX + (0 - 6) * tileW / 2;           // originX - 3*tileW
    const leftY  = originY + (0 + 6 + 1) * tileH / 2;       // originY + 3.5*tileH

    const rightX = originX + (6 - 0) * tileW / 2;           // originX + 3*tileW
    const rightY = originY + (6 + 0 + 1) * tileH / 2;       // originY + 3.5*tileH

    this._drawIsoPot(ctx, leftX,  leftY,  s);
    this._drawIsoPot(ctx, rightX, rightY, s);
  }

  _drawIsoPot(ctx, cx, cy, scale = 1) {
    const s = scale;

    // Pot body
    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 9 * s, cy - 8 * s);
    ctx.lineTo(cx + 9 * s, cy - 8 * s);
    ctx.lineTo(cx + 7 * s, cy + 4 * s);
    ctx.lineTo(cx - 7 * s, cy + 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pot top ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 * s, 9 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle   = '#A07040';
    ctx.fill();
    ctx.strokeStyle = '#4A2E0E';
    ctx.stroke();

    // Leaves
    const leafData = [
      [cx,         cy - 16 * s, 9 * s],
      [cx - 7 * s, cy - 22 * s, 6 * s],
      [cx + 7 * s, cy - 22 * s, 6 * s],
      [cx,         cy - 27 * s, 6 * s],
    ];
    ctx.fillStyle   = '#5DB85D';
    ctx.strokeStyle = '#3A7A3A';
    ctx.lineWidth   = 1.5;
    for (const [leafX, leafY, r] of leafData) {
      ctx.beginPath();
      ctx.arc(leafX, leafY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
