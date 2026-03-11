/**
 * CafeRenderer.js  — Landscape-optimized
 * Draws the static cafe background for horizontal/landscape screens.
 *   - Wall takes top 35% of height (h*0.35)
 *   - Counter on the right side, proportional to canvas width
 *   - Two windows spread across the wider back wall
 *   - Entrance door on the left
 *   - Floor with plank lines
 *   - Corner plants
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class CafeRenderer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }

  render(ctx, skyTint = null) {
    const { w, h } = this;
    const wallH = h * 0.35;

    this._drawWall(ctx, w, wallH);
    this._drawFloor(ctx, w, h, wallH);
    this._drawWindows(ctx, w, wallH);
    this._drawDoor(ctx, h, wallH);
    this._drawCounter(ctx, w, h, wallH);
    this._drawPlants(ctx, w, h, wallH);

    if (skyTint) {
      ctx.save();
      ctx.fillStyle = skyTint;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  _drawWall(ctx, w, wallH) {
    ctx.fillStyle = '#FFF0D9';
    ctx.fillRect(0, 0, w, wallH);

    ctx.save();
    ctx.font      = '14px serif';
    ctx.fillStyle = 'rgba(255,182,193,0.35)';
    for (let x = 30; x < w; x += 55) {
      for (let y = 14; y < wallH; y += 40) {
        ctx.fillText('♥', x, y);
      }
    }
    ctx.restore();

    ctx.strokeStyle = '#C8A882';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(0, wallH);
    ctx.lineTo(w, wallH);
    ctx.stroke();
  }

  _drawFloor(ctx, w, h, wallH) {
    ctx.fillStyle = '#C8A882';
    ctx.fillRect(0, wallH, w, h - wallH);

    ctx.strokeStyle = 'rgba(139,99,60,0.30)';
    ctx.lineWidth   = 1.5;
    const plankH    = 36;
    for (let y = wallH + plankH; y < h; y += plankH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(139,99,60,0.12)';
    ctx.lineWidth   = 1;
    for (let x = 80; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, wallH);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  // Two windows spread across the wider wall for landscape
  _drawWindows(ctx, w, wallH) {
    const positions = [w * 0.35, w * 0.58];
    const ww = Math.min(100, w * 0.12);
    const wh = wallH - 16;
    const wy = 8;

    for (const wx of positions) {
      ctx.fillStyle   = '#87CEEB';
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 3;
      _roundRect(ctx, wx, wy, ww, wh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy);
      ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh / 2);
      ctx.lineTo(wx + ww, wy + wh / 2);
      ctx.stroke();

      // Curtains
      ctx.fillStyle = '#FF8FAB';
      ctx.beginPath();
      ctx.moveTo(wx - 6, wy);
      ctx.quadraticCurveTo(wx + 10, wy + wh * 0.4, wx - 3, wy + wh);
      ctx.lineTo(wx + 14, wy + wh);
      ctx.quadraticCurveTo(wx + 16, wy + wh * 0.4, wx + 14, wy);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(wx + ww + 6, wy);
      ctx.quadraticCurveTo(wx + ww - 10, wy + wh * 0.4, wx + ww + 3, wy + wh);
      ctx.lineTo(wx + ww - 14, wy + wh);
      ctx.quadraticCurveTo(wx + ww - 16, wy + wh * 0.4, wx + ww - 14, wy);
      ctx.closePath();
      ctx.fill();
    }
  }

  _drawDoor(ctx, h, wallH) {
    const dw = Math.min(50, h * 0.12);
    const dh = wallH - 10;
    const dx = 20;
    const dy = 6;

    ctx.fillStyle   = '#DEB887';
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth   = 3;
    _roundRect(ctx, dx, dy, dw, dh, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#FFD700';
    ctx.strokeStyle = '#B8960C';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(dx + dw - 8, dy + dh / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font      = `bold ${Math.max(9, h * 0.022)}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    ctx.fillText('入口 →', dx + dw / 2, dy + dh + 12);
  }

  _drawCounter(ctx, w, h, wallH) {
    // Landscape: counter is narrower but still on the right
    const cw = Math.min(130, w * 0.14);
    const ch = h - wallH - 10;
    const cx = w - cw - 8;
    const cy = wallH + 6;

    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 4;
    _roundRect(ctx, cx, cy, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#A0723A';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 3;
    _roundRect(ctx, cx, cy, cw, 16, 5);
    ctx.fill();
    ctx.stroke();

    const counterFont = Math.max(11, w * 0.018);
    ctx.font      = `bold ${counterFont}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('☕ 吧台', cx + cw / 2, cy + 13);

    this._drawCoffeeMachine(ctx, cx + cw / 2, cy + 44);
  }

  _drawCoffeeMachine(ctx, cx, cy) {
    ctx.fillStyle   = '#3D1F00';
    ctx.strokeStyle = '#1A0900';
    ctx.lineWidth   = 3;
    _roundRect(ctx, cx - 26, cy, 52, 46, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#C0392B';
    ctx.strokeStyle = '#922B21';
    ctx.lineWidth   = 2;
    _roundRect(ctx, cx - 18, cy + 6, 36, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = '#2C3E50';
    ctx.strokeStyle = '#1A252F';
    ctx.lineWidth   = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx - 14 + i * 14, cy + 37, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(200,200,200,0.55)';
    ctx.lineWidth   = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 8, cy - 3);
      ctx.quadraticCurveTo(cx + i * 8 + 5, cy - 10, cx + i * 8, cy - 17);
      ctx.stroke();
    }
  }

  _drawPlants(ctx, w, h, wallH) {
    // Left plant near door
    this._drawPlant(ctx, 85, h - 16);
    // Right plant near counter
    this._drawPlant(ctx, w - Math.min(160, w * 0.17), h - 16);
  }

  _drawPlant(ctx, x, baseY) {
    ctx.fillStyle   = '#8B5E3C';
    ctx.strokeStyle = '#4A2E0E';
    ctx.lineWidth   = 2;
    _roundRect(ctx, x, baseY - 24, 18, 24, 3);
    ctx.fill();
    ctx.stroke();

    const leafPositions = [
      [x + 9, baseY - 33, 16],
      [x - 1,  baseY - 43, 12],
      [x + 18, baseY - 43, 12],
      [x + 9, baseY - 52, 11],
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

