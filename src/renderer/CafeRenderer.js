/**
 * CafeRenderer.js
 * Draws the static cafe background:
 *   - Wood floor with plank lines
 *   - Cream walls with wallpaper hearts
 *   - Right-side counter with coffee machine + steam
 *   - Decorative corner plants
 *   - Back-wall window with curtains
 *   - Entrance door on the left wall
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class CafeRenderer {
  /**
   * @param {number} w - Canvas width
   * @param {number} h - Canvas height
   */
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }

  /** Redraw the entire background each frame. */
  render(ctx) {
    const { w, h } = this;
    const wallH    = h * 0.30; // top 30 % = wall

    this._drawWall(ctx, w, wallH);
    this._drawFloor(ctx, w, h, wallH);
    this._drawWindow(ctx, w, wallH);
    this._drawDoor(ctx, wallH);
    this._drawCounter(ctx, w, h, wallH);
    this._drawPlants(ctx, w, h, wallH);
  }

  // ─── Private draw helpers ────────────────────────────────────────────────────

  _drawWall(ctx, w, wallH) {
    // Cream/beige fill
    ctx.fillStyle = '#FFF0D9';
    ctx.fillRect(0, 0, w, wallH);

    // Subtle wallpaper hearts
    ctx.save();
    ctx.font      = '14px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.35)';
    for (let x = 30; x < w; x += 55) {
      for (let y = 14; y < wallH; y += 40) {
        ctx.fillText('♥', x, y);
      }
    }
    ctx.restore();

    // Wall/floor divider
    ctx.strokeStyle = '#C8A882';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(0, wallH);
    ctx.lineTo(w, wallH);
    ctx.stroke();
  }

  _drawFloor(ctx, w, h, wallH) {
    // Wood colour base
    ctx.fillStyle = '#C8A882';
    ctx.fillRect(0, wallH, w, h - wallH);

    // Plank lines
    ctx.strokeStyle = 'rgba(139,99,60,0.30)';
    ctx.lineWidth   = 1.5;
    const plankH    = 40;
    for (let y = wallH + plankH; y < h; y += plankH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Vertical grain lines (subtle)
    ctx.strokeStyle = 'rgba(139,99,60,0.12)';
    ctx.lineWidth   = 1;
    for (let x = 80; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, wallH);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  _drawWindow(ctx, w, wallH) {
    const wx = w * 0.45;
    const wy = 14;
    const ww = 120;
    const wh = wallH - 22;

    // Window frame
    ctx.fillStyle   = '#87CEEB';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 4;
    _roundRect(ctx, wx, wy, ww, wh, 8);
    ctx.fill();
    ctx.stroke();

    // Cross dividers
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();

    // Left curtain
    ctx.fillStyle = '#FF8FAB';
    ctx.beginPath();
    ctx.moveTo(wx - 8, wy);
    ctx.quadraticCurveTo(wx + 14, wy + wh * 0.4, wx - 4, wy + wh);
    ctx.lineTo(wx + 18, wy + wh);
    ctx.quadraticCurveTo(wx + 22, wy + wh * 0.4, wx + 18, wy);
    ctx.closePath();
    ctx.fill();

    // Right curtain
    ctx.beginPath();
    ctx.moveTo(wx + ww + 8, wy);
    ctx.quadraticCurveTo(wx + ww - 14, wy + wh * 0.4, wx + ww + 4, wy + wh);
    ctx.lineTo(wx + ww - 18, wy + wh);
    ctx.quadraticCurveTo(wx + ww - 22, wy + wh * 0.4, wx + ww - 18, wy);
    ctx.closePath();
    ctx.fill();
  }

  _drawDoor(ctx, wallH) {
    const dx = 30;
    const dy = 8;
    const dw = 55;
    const dh = wallH - 12;

    // Door body
    ctx.fillStyle   = '#DEB887';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 3;
    _roundRect(ctx, dx, dy, dw, dh, 6);
    ctx.fill();
    ctx.stroke();

    // Door knob
    ctx.fillStyle   = '#FFD700';
    ctx.strokeStyle = '#B8960C';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(dx + dw - 10, dy + dh / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Entrance label
    ctx.font      = "bold 11px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    ctx.fillText('入口 →', dx + dw / 2, dy + dh + 14);
  }

  _drawCounter(ctx, w, h, wallH) {
    const cw = 140;
    const ch = h * 0.45;
    const cx = w - cw - 10;
    const cy = wallH + 20;

    // Counter body
    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 4;
    _roundRect(ctx, cx, cy, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    // Counter top surface
    ctx.fillStyle   = '#A0723A';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 3;
    _roundRect(ctx, cx, cy, cw, 18, 6);
    ctx.fill();
    ctx.stroke();

    // Counter label
    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('☕ 吧台', cx + cw / 2, cy + 14);

    // Coffee machine on counter
    this._drawCoffeeMachine(ctx, cx + cw / 2, cy + 50);
  }

  _drawCoffeeMachine(ctx, cx, cy) {
    // Machine body
    ctx.fillStyle   = '#3D1F00';
    ctx.strokeStyle = '#1A0900';
    ctx.lineWidth   = 3;
    _roundRect(ctx, cx - 30, cy, 60, 55, 8);
    ctx.fill();
    ctx.stroke();

    // Screen / porthole circle
    ctx.fillStyle   = '#87CEEB';
    ctx.strokeStyle = '#1A0900';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 22, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Button row
    const btnColors = ['#FF6B6B', '#FFD700', '#66BB6A'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle   = btnColors[i];
      ctx.strokeStyle = '#1A0900';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(cx - 18 + i * 18, cy + 47, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Steam wisps
    ctx.strokeStyle = 'rgba(200,200,200,0.55)';
    ctx.lineWidth   = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 10, cy - 4);
      ctx.quadraticCurveTo(cx + i * 10 + 6, cy - 12, cx + i * 10, cy - 20);
      ctx.stroke();
    }
  }

  _drawPlants(ctx, w, h, wallH) {
    // Bottom-left plant
    this._drawPlant(ctx, 10, h - 20);
    // Bottom-right plant (near counter)
    this._drawPlant(ctx, w - 170, h - 20);
  }

  _drawPlant(ctx, x, baseY) {
    // Stem / pot
    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 2;
    _roundRect(ctx, x, baseY - 28, 22, 28, 4);
    ctx.fill();
    ctx.stroke();

    // Leaves (green circles)
    const leafPositions = [
      [x + 11, baseY - 40, 20],
      [x - 2,  baseY - 52, 16],
      [x + 22, baseY - 52, 16],
      [x + 11, baseY - 64, 14],
    ];
    ctx.fillStyle   = '#5DB85D';
    ctx.strokeStyle = '#3A7A3A';
    ctx.lineWidth   = 2;
    for (const [lx, ly, r] of leafPositions) {
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

