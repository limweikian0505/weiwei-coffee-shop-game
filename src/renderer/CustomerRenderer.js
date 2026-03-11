/**
 * CustomerRenderer.js — Isometric 2.5D Chibi Style
 *
 * Draws customers as small isometric chibi characters.
 *
 * Coordinate transform (same perspective squish as TableRenderer):
 *   sx = customer.x
 *   sy = customer.y * 0.55 + canvasH * 0.22
 *
 * Walk-in animation (state === 'WALKING_IN'):
 *   - Vertical bounce on body: Math.sin(Date.now() * 0.008) * 3
 *   - Two small footstep ellipses below feet
 *
 * All existing features preserved:
 *   name tag, patience bar, streamer sparkles, crown/phone emoji, '!' indicator
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class CustomerRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Customer} customer
   * @param {number} [canvasW=360]
   * @param {number} [canvasH=640]
   */
  render(ctx, customer, canvasW = 360, canvasH = 640) {
    const sx = customer.x;
    const sy = customer.y * 0.55 + canvasH * 0.22;

    const { color, name, isStreamer, isSpecial, emoji, sparkleTimer, state } = customer;

    // Responsive radii
    const bodyR = Math.max(12, canvasW * 0.042);
    const headR = Math.max(9,  canvasW * 0.032);

    // Walking bounce offset
    const isWalking  = state === 'WALKING_IN';
    const walkBounce = isWalking ? Math.sin(Date.now() * 0.008) * 3 : 0;

    ctx.save();

    // ── Shadow (isometric floor shadow) ──────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + bodyR * 1.05, bodyR * 0.78, bodyR * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Footsteps (walk animation) ────────────────────────────────────────────
    if (isWalking) {
      const phase  = Date.now() * 0.006;
      const foot1A = Math.abs(Math.sin(phase));
      const foot2A = Math.abs(Math.sin(phase + Math.PI));
      ctx.fillStyle = `rgba(80,50,20,${0.25 * foot1A})`;
      ctx.beginPath();
      ctx.ellipse(sx - bodyR * 0.30, sy + bodyR * 1.10, bodyR * 0.22, bodyR * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(80,50,20,${0.25 * foot2A})`;
      ctx.beginPath();
      ctx.ellipse(sx + bodyR * 0.30, sy + bodyR * 1.10, bodyR * 0.22, bodyR * 0.10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Golden glow for streamers ─────────────────────────────────────────────
    if (isStreamer && sparkleTimer > 0) {
      this._drawSparkles(ctx, sx, sy + walkBounce, sparkleTimer, bodyR);
    }
    if (isStreamer) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 12;
    }

    // ── Legs (two short lines) ────────────────────────────────────────────────
    ctx.strokeStyle = this._darken(color);
    ctx.lineWidth   = Math.max(2, bodyR * 0.18);
    ctx.lineCap     = 'round';
    for (const dx of [-bodyR * 0.28, bodyR * 0.28]) {
      ctx.beginPath();
      ctx.moveTo(sx + dx, sy + bodyR * 0.72 + walkBounce);
      ctx.lineTo(sx + dx * 0.8, sy + bodyR + walkBounce);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // ── Body (slightly squished oval — isometric look) ────────────────────────
    ctx.fillStyle   = color;
    ctx.strokeStyle = this._darken(color);
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy + bodyR * 0.12 + walkBounce, bodyR, bodyR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ── Head ──────────────────────────────────────────────────────────────────
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#FFDBB5';
    ctx.strokeStyle = '#C49A6C';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(sx, sy - headR * 0.78 + walkBounce, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ── Face emoji ────────────────────────────────────────────────────────────
    const emojiFontSize = Math.max(10, canvasW * 0.017);
    ctx.font      = `${emojiFontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(emoji, sx, sy - headR * 0.78 + walkBounce + emojiFontSize * 0.38);

    // ── Crown for VIP / special ───────────────────────────────────────────────
    if (isSpecial && emoji === '👑') {
      ctx.font = `${emojiFontSize}px serif`;
      ctx.fillText('👑', sx, sy - headR * 0.78 - headR + walkBounce);
    }

    // ── Phone for streamers ───────────────────────────────────────────────────
    if (isStreamer) {
      ctx.font = `${emojiFontSize}px serif`;
      ctx.fillText('📱', sx + bodyR + 4, sy - headR * 0.3 + walkBounce);
    }

    // ── Name tag ──────────────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    this._drawNameTag(ctx, sx, sy + bodyR + 8 + walkBounce, customer.name, isStreamer, canvasW);

    // ── Waiting indicator ─────────────────────────────────────────────────────
    if (state === 'WAITING') {
      this._drawWaitingIndicator(ctx, sx, sy - headR * 0.78 - headR - 4 + walkBounce, customer, canvasW);
    }

    ctx.restore();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _drawNameTag(ctx, cx, cy, name, isStreamer, canvasW) {
    const padding  = 5;
    const fontSize = Math.max(9, canvasW * 0.020);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    const tw = ctx.measureText(name).width;
    const w  = tw + padding * 2;
    const h  = fontSize + 5;

    ctx.fillStyle   = isStreamer ? '#FF6B9D' : 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = isStreamer ? '#CC3D6B' : '#C8A882';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, cx - w / 2, cy, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isStreamer ? '#FFF' : '#3D1F00';
    ctx.textAlign = 'center';
    ctx.fillText(name, cx, cy + fontSize);
  }

  _drawWaitingIndicator(ctx, cx, cy, customer, canvasW) {
    const barW  = Math.max(36, canvasW * 0.065);
    const barH  = 6;
    const barX  = cx - barW / 2;
    const barY  = cy - 11;
    const ratio = Math.max(0, Math.min(1, customer.stateTimer / customer.patience));

    ctx.fillStyle = '#FFCCCC';
    _roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();

    let fillColor;
    if (ratio > 0.5)      fillColor = '#66BB6A';
    else if (ratio >= 0.3) fillColor = '#FFA726';
    else                   fillColor = '#EF5350';

    if (ratio > 0) {
      ctx.fillStyle = fillColor;
      _roundRect(ctx, barX, barY, barW * ratio, barH, 3);
      ctx.fill();
    }

    ctx.font      = "bold 15px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, barY - 1);
  }

  _drawSparkles(ctx, cx, cy, timer, bodyR) {
    const count = 8;
    const angle = (timer * 2) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.font      = '12px serif';
    for (let i = 0; i < count; i++) {
      const a = angle + (i / count) * Math.PI * 2;
      const r = bodyR + 8 + Math.sin(timer * 3 + i) * 5;
      ctx.fillText('✦', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  }

  _darken(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
    const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 50);
    const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 50);
    const b = Math.max(0, parseInt(c.slice(4, 6), 16) - 50);
    return `rgb(${r},${g},${b})`;
  }
}
