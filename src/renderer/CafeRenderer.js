/**
 * CafeRenderer.js — Isometric 2.5D View
 *
 * Draws the cafe as an isometric diorama:
 *   - Diamond-shaped wood floor with tile grid lines
 *   - Left wall (parallelogram) — entrance door + plant
 *   - Right wall (parallelogram) — counter/bar + coffee machine
 *   - Back "ceiling" area — two windows + heart wallpaper
 *   - Corner plants
 *   - Optional sky-tint overlay (dusk/night effect)
 *
 * Room geometry (all responsive to canvas W × H):
 *   backCorner  (W*0.58, H*0.30)  — apex / back corner
 *   leftCorner  (W*0.20, H*0.44)  — front-left corner (door side)
 *   rightCorner (W*0.96, H*0.44)  — front-right corner
 *   frontCorner (W*0.58, H*0.58)  — front apex (nearest viewer)
 *   wallH       H*0.14            — height of vertical wall faces
 *
 * A street/road scene is drawn to the left before the cafe room, giving
 * customers a visible path to walk in from off-screen.
 *
 * Exported helpers:
 *   isoOriginX(W)  — back-corner screen X
 *   isoOriginY(H)  — back-corner screen Y
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

/** Screen X of the isometric back-corner (world origin). */
export function isoOriginX(W) { return W * 0.58; }

/** Screen Y of the isometric back-corner (world origin). */
export function isoOriginY(H) { return H * 0.30; }

export class CafeRenderer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }

  render(ctx, skyTint = null) {
    const { w: W, h: H } = this;

    // ── Room geometry ─────────────────────────────────────────────────────────
    const bx = isoOriginX(W);  const by = isoOriginY(H);   // back corner
    const lx = W * 0.20;       const ly = H * 0.44;         // left corner
    const rx = W * 0.96;       const ry = H * 0.44;         // right corner
    const fx = W * 0.58;       const fy = H * 0.58;         // front corner
    const wallH = H * 0.14;                                   // wall face height

    // ── Street / outdoor scene (drawn first, behind everything) ───────────────
    this._drawStreet(ctx, W, H);

    // ── Background (ceiling / sky above room) ─────────────────────────────────
    this._drawBackground(ctx, W, H, bx, by, lx, ly, rx, ry, wallH);

    // ── Side walls (draw before floor so floor edge covers wall bottom) ────────
    this._drawLeftWall(ctx, bx, by, lx, ly, wallH);
    this._drawRightWall(ctx, bx, by, rx, ry, wallH);

    // ── Floor ─────────────────────────────────────────────────────────────────
    this._drawFloor(ctx, bx, by, lx, ly, rx, ry, fx, fy);

    // ── Features on walls ─────────────────────────────────────────────────────
    this._drawDoor(ctx, bx, by, lx, ly, wallH, H);
    this._drawCounter(ctx, bx, by, rx, ry, wallH, W, H);
    this._drawWindows(ctx, W, H, bx, by, wallH);
    this._drawPlants(ctx, lx, ly, rx, ry, fy, H);

    // ── Sky tint overlay ──────────────────────────────────────────────────────
    if (skyTint) {
      ctx.save();
      ctx.fillStyle = skyTint;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ─── Street / outdoor scene ─────────────────────────────────────────────────

  _drawStreet(ctx, W, H) {
    ctx.save();

    // Full canvas sky background
    ctx.fillStyle = '#D4EDFF';
    ctx.fillRect(0, 0, W, H);

    // Road trapezoid (asphalt): left side of canvas below the cafe door area
    // Top edge: (0, H*0.40) → (W*0.30, H*0.44)
    // Bottom edge: (0, H*0.75) → (W*0.25, H*0.58)
    ctx.beginPath();
    ctx.moveTo(0,        H * 0.40);
    ctx.lineTo(W * 0.30, H * 0.44);
    ctx.lineTo(W * 0.25, H * 0.58);
    ctx.lineTo(0,        H * 0.75);
    ctx.closePath();
    ctx.fillStyle = '#AAAAAA';
    ctx.fill();

    // Pavement/sidewalk strip along the top edge of the road
    ctx.beginPath();
    ctx.moveTo(0,        H * 0.40);
    ctx.lineTo(W * 0.30, H * 0.44);
    ctx.lineTo(W * 0.30, H * 0.44 - 8);
    ctx.lineTo(0,        H * 0.40 - 8);
    ctx.closePath();
    ctx.fillStyle = '#CCCCCC';
    ctx.fill();

    // Dashed yellow centre-line stripe down the road
    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = Math.max(2, H * 0.004);
    ctx.setLineDash([H * 0.04, H * 0.03]);
    ctx.beginPath();
    // Centre of road: interpolate between top-mid and bottom-mid of the trapezoid
    ctx.moveTo(0,        H * 0.575);
    ctx.lineTo(W * 0.275, H * 0.51);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Lamp post at roughly (W*0.05, H*0.32)
    const lpX = W * 0.05;
    const lpY = H * 0.32;
    const postW = Math.max(5, W * 0.008);
    const postH = H * 0.18;
    // Post shaft (brown rect)
    ctx.fillStyle   = '#5C3A1E';
    ctx.strokeStyle = '#3A1E08';
    ctx.lineWidth   = 1;
    ctx.fillRect(lpX - postW / 2, lpY, postW, postH);
    ctx.strokeRect(lpX - postW / 2, lpY, postW, postH);
    // Lamp head (circle)
    ctx.beginPath();
    ctx.arc(lpX, lpY, postW * 1.8, 0, Math.PI * 2);
    ctx.fillStyle   = '#F5E642';
    ctx.strokeStyle = '#3A1E08';
    ctx.lineWidth   = 1.5;
    ctx.fill();
    ctx.stroke();
    // Arm extending right
    ctx.beginPath();
    ctx.moveTo(lpX, lpY);
    ctx.lineTo(lpX + postW * 2.5, lpY + postH * 0.10);
    ctx.strokeStyle = '#5C3A1E';
    ctx.lineWidth   = postW * 0.8;
    ctx.stroke();

    // Small bushes/grass tufts along the pavement edge
    const bushPositions = [W * 0.08, W * 0.14, W * 0.21];
    for (const bx2 of bushPositions) {
      const by2 = H * 0.395;
      // Two overlapping circles for each bush
      ctx.fillStyle   = '#5A9E3A';
      ctx.strokeStyle = '#3A6A1E';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(bx2,                   by2, W * 0.012, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx2 + W * 0.008,       by2 - H * 0.005, W * 0.010, 0, Math.PI * 2);
      ctx.fillStyle = '#72B84A';
      ctx.fill(); ctx.stroke();
    }

    ctx.restore();
  }

  // ─── Background ─────────────────────────────────────────────────────────────

  _drawBackground(ctx, W, H, bx, by, lx, ly, rx, ry, wallH) {
    ctx.save();

    // Warm cream background fills the entire top area
    const bgBottom = Math.max(ly, ry);
    ctx.fillStyle = '#FFF0D9';
    ctx.fillRect(0, 0, W, bgBottom);

    // Heart wallpaper scattered across the background
    ctx.font      = '13px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.38)';
    const patBottom = by - wallH * 0.1;
    for (let px = 18; px < W; px += 52) {
      for (let py = 16; py < patBottom; py += 36) {
        ctx.fillText('♥', px, py);
      }
    }

    ctx.restore();
  }

  // ─── Floor ──────────────────────────────────────────────────────────────────

  _drawFloor(ctx, bx, by, lx, ly, rx, ry, fx, fy) {
    ctx.save();

    // Base floor fill — warm wood tone
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(rx, ry);
    ctx.lineTo(fx, fy);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.fillStyle = '#C8A26A';
    ctx.fill();

    // Isometric grid lines — "left-right" diagonals (parallel to bx,by → rx,ry)
    ctx.strokeStyle = 'rgba(139,99,60,0.28)';
    ctx.lineWidth   = 1;

    const stepsD = 5; // lines parallel to back→left / front→right axis
    for (let i = 1; i < stepsD; i++) {
      const t   = i / stepsD;
      const x1  = bx + (lx - bx) * t;
      const y1  = by + (ly - by) * t;
      const x2  = rx + (fx - rx) * t;
      const y2  = ry + (fy - ry) * t;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const stepsW = 7; // lines parallel to back→right / front→left axis
    for (let i = 1; i < stepsW; i++) {
      const t   = i / stepsW;
      const x1  = bx + (rx - bx) * t;
      const y1  = by + (ry - by) * t;
      const x2  = lx + (fx - lx) * t;
      const y2  = ly + (fy - ly) * t;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Floor border
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(rx, ry);
    ctx.lineTo(fx, fy);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.strokeStyle = '#8B6538';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ─── Left wall ──────────────────────────────────────────────────────────────

  _drawLeftWall(ctx, bx, by, lx, ly, wallH) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(lx, ly);
    ctx.lineTo(lx, ly - wallH);
    ctx.lineTo(bx, by - wallH);
    ctx.closePath();
    ctx.fillStyle = '#EDD5B0';
    ctx.fill();

    // Subtle horizontal mortar lines on wall
    ctx.strokeStyle = 'rgba(139,99,60,0.15)';
    ctx.lineWidth   = 1;
    for (let i = 1; i <= 3; i++) {
      const t  = i / 4;
      const y0 = by - wallH + wallH * t;
      const y1 = ly - wallH + wallH * t;
      ctx.beginPath();
      ctx.moveTo(bx, y0);
      ctx.lineTo(lx, y1);
      ctx.stroke();
    }

    // Wall outline
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(lx, ly);
    ctx.lineTo(lx, ly - wallH);
    ctx.lineTo(bx, by - wallH);
    ctx.closePath();
    ctx.strokeStyle = '#B89060';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ─── Right wall ─────────────────────────────────────────────────────────────

  _drawRightWall(ctx, bx, by, rx, ry, wallH) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(rx, ry);
    ctx.lineTo(rx, ry - wallH);
    ctx.lineTo(bx, by - wallH);
    ctx.closePath();
    ctx.fillStyle = '#DCC89A';
    ctx.fill();

    ctx.strokeStyle = 'rgba(139,99,60,0.15)';
    ctx.lineWidth   = 1;
    for (let i = 1; i <= 3; i++) {
      const t  = i / 4;
      const y0 = by - wallH + wallH * t;
      const y1 = ry - wallH + wallH * t;
      ctx.beginPath();
      ctx.moveTo(bx, y0);
      ctx.lineTo(rx, y1);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(rx, ry);
    ctx.lineTo(rx, ry - wallH);
    ctx.lineTo(bx, by - wallH);
    ctx.closePath();
    ctx.strokeStyle = '#A88040';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ─── Door ───────────────────────────────────────────────────────────────────

  _drawDoor(ctx, bx, by, lx, ly, wallH, H) {
    ctx.save();

    // Door near the leftCorner end of the left wall (closer to the street entrance)
    const t0 = 0.55;
    const t1 = 0.80;

    const d0x = bx + (lx - bx) * t0;  const d0y = by + (ly - by) * t0;
    const d1x = bx + (lx - bx) * t1;  const d1y = by + (ly - by) * t1;

    const doorH = wallH * 0.82;

    // Door fill
    ctx.beginPath();
    ctx.moveTo(d0x, d0y);
    ctx.lineTo(d1x, d1y);
    ctx.lineTo(d1x, d1y - doorH);
    ctx.lineTo(d0x, d0y - doorH);
    ctx.closePath();
    ctx.fillStyle   = '#DEB887';
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Door panel line
    const midX = (d0x + d1x) / 2;
    const midY = (d0y + d1y) / 2;
    ctx.strokeStyle = 'rgba(139,105,20,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(midX, d0y - doorH * 0.1);
    ctx.lineTo(midX, d1y - doorH * 0.1 - (d1y - d0y) * 0.01);
    ctx.stroke();

    // Door knob
    ctx.fillStyle   = '#FFD700';
    ctx.strokeStyle = '#B8960C';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(d1x - (d1x - d0x) * 0.18, d1y - doorH * 0.42, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // "入口" sign
    const fontSize = Math.max(8, H * 0.018);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    ctx.fillText('入口 ➡', (d0x + d1x) / 2, d1y + fontSize + 2);

    ctx.restore();
  }

  // ─── Counter ────────────────────────────────────────────────────────────────

  _drawCounter(ctx, bx, by, rx, ry, wallH, W, H) {
    ctx.save();

    // Counter occupies right portion of the right wall
    const t0 = 0.52;
    const t1 = 0.94;
    const c0x = bx + (rx - bx) * t0;  const c0y = by + (ry - by) * t0;
    const c1x = bx + (rx - bx) * t1;  const c1y = by + (ry - by) * t1;

    const cH   = wallH * 0.56;  // counter body height
    const topH = wallH * 0.07;  // top ledge thickness

    // Counter body
    ctx.beginPath();
    ctx.moveTo(c0x, c0y);
    ctx.lineTo(c1x, c1y);
    ctx.lineTo(c1x, c1y - cH);
    ctx.lineTo(c0x, c0y - cH);
    ctx.closePath();
    ctx.fillStyle   = '#7B4F2E';
    ctx.fill();
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Top ledge
    ctx.beginPath();
    ctx.moveTo(c0x, c0y - cH);
    ctx.lineTo(c1x, c1y - cH);
    ctx.lineTo(c1x, c1y - cH - topH);
    ctx.lineTo(c0x, c0y - cH - topH);
    ctx.closePath();
    ctx.fillStyle   = '#A07040';
    ctx.fill();
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label
    const fontSize = Math.max(9, W * 0.024);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFE0B2';
    ctx.textAlign = 'center';
    ctx.fillText('☕ 吧台', (c0x + c1x) / 2, (c0y + c1y) / 2 - cH * 0.25);

    // Coffee machine on counter
    this._drawCoffeeMachine(ctx, (c0x + c1x) / 2, c0y - cH - topH, H);

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

  // ─── Windows ────────────────────────────────────────────────────────────────

  _drawWindows(ctx, W, H, bx, by, wallH) {
    ctx.save();

    const winW = W * 0.08;
    const winH = wallH * 0.62;
    const winY = by - wallH * 0.92;

    // Two windows, one on each side of centre
    const positions = [W * 0.28, W * 0.62];

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
      ctx.moveTo(wx, winY + winH / 2);
      ctx.lineTo(wx + winW, winY + winH / 2);
      ctx.stroke();

      // Left curtain
      ctx.fillStyle = '#FF8FAB';
      ctx.beginPath();
      ctx.moveTo(wx - 3, winY);
      ctx.quadraticCurveTo(wx + 7, winY + winH * 0.4, wx - 1, winY + winH);
      ctx.lineTo(wx + 9, winY + winH);
      ctx.quadraticCurveTo(wx + 10, winY + winH * 0.4, wx + 9, winY);
      ctx.closePath();
      ctx.fill();

      // Right curtain
      ctx.beginPath();
      ctx.moveTo(wx + winW + 3, winY);
      ctx.quadraticCurveTo(wx + winW - 7, winY + winH * 0.4, wx + winW + 1, winY + winH);
      ctx.lineTo(wx + winW - 9, winY + winH);
      ctx.quadraticCurveTo(wx + winW - 10, winY + winH * 0.4, wx + winW - 9, winY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // ─── Plants ─────────────────────────────────────────────────────────────────

  _drawPlants(ctx, lx, ly, rx, ry, fy, H) {
    const s = Math.max(0.6, H / 700);
    // Front-left plant
    const pl_x = lx + (rx - lx) * 0.07;
    const pl_y = ly + (fy - ly) * 0.62;
    this._drawIsoPot(ctx, pl_x, pl_y, s);
    // Front-right plant
    const pr_x = lx + (rx - lx) * 0.93;
    const pr_y = ry + (fy - ry) * 0.62;
    this._drawIsoPot(ctx, pr_x, pr_y, s);
  }

  _drawIsoPot(ctx, cx, cy, scale = 1) {
    const s = scale;

    // Pot body
    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 1.5;
    // Pot sides
    ctx.beginPath();
    ctx.moveTo(cx - 9 * s, cy - 8 * s);
    ctx.lineTo(cx + 9 * s, cy - 8 * s);
    ctx.lineTo(cx + 7 * s, cy + 4 * s);
    ctx.lineTo(cx - 7 * s, cy + 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Pot top ellipse (iso look)
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 * s, 9 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#A07040';
    ctx.fill();
    ctx.strokeStyle = '#4A2E0E';
    ctx.stroke();

    // Leaves
    const leafData = [
      [cx,          cy - 16 * s, 9 * s],
      [cx - 7 * s,  cy - 22 * s, 6 * s],
      [cx + 7 * s,  cy - 22 * s, 6 * s],
      [cx,          cy - 27 * s, 6 * s],
    ];
    ctx.fillStyle   = '#5DB85D';
    ctx.strokeStyle = '#3A7A3A';
    ctx.lineWidth   = 1.5;
    for (const [lx2, ly2, r] of leafData) {
      ctx.beginPath();
      ctx.arc(lx2, ly2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
