/**
 * CustomerRenderer.js
 * Draws customers as cute cartoon characters on the canvas.
 *
 * Each customer is composed of:
 *   - Body circle (filled with customer.color)
 *   - Head circle (skin tone)
 *   - Eyes + smile
 *   - Name tag below
 *   - Optional: crown for VIP, phone for streamers, gold sparkles
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class CustomerRenderer {
  /**
   * Draw a single customer.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Customer} customer
   */
  render(ctx, customer) {
    const { x, y, color, name, isStreamer, isSpecial, emoji, sparkleTimer, state } = customer;

    ctx.save();

    // Golden glow for streamers
    if (isStreamer && sparkleTimer > 0) {
      this._drawSparkles(ctx, x, y, sparkleTimer);
    }

    // Glow outline for streamers
    if (isStreamer) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 12;
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    ctx.fillStyle   = color;
    ctx.strokeStyle = this._darken(color);
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(x, y + 6, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ── Head ──────────────────────────────────────────────────────────────────
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#FFDBB5'; // skin tone
    ctx.strokeStyle = '#C49A6C';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(x, y - 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ── Face: emoji ───────────────────────────────────────────────────────────
    ctx.font      = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, x, y - 7);

    // ── Crown for VIP / special ───────────────────────────────────────────────
    if (isSpecial && emoji === '👑') {
      ctx.font = '14px serif';
      ctx.fillText('👑', x, y - 28);
    }

    // ── Phone icon for streamers ───────────────────────────────────────────────
    if (isStreamer) {
      ctx.font = '14px serif';
      ctx.fillText('📱', x + 20, y - 8);
    }

    // ── Name tag ──────────────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    this._drawNameTag(ctx, x, y + 28, name, isStreamer);

    // ── Waiting indicator ─────────────────────────────────────────────────────
    if (state === 'WAITING') {
      this._drawWaitingIndicator(ctx, x, y - 30);
    }

    ctx.restore();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _drawNameTag(ctx, cx, cy, name, isStreamer) {
    const padding = 6;
    ctx.font      = "bold 10px 'Comic Sans MS', cursive";
    const tw      = ctx.measureText(name).width;
    const w       = tw + padding * 2;
    const h       = 16;

    ctx.fillStyle   = isStreamer ? '#FF6B9D' : 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = isStreamer ? '#CC3D6B' : '#C8A882';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, cx - w / 2, cy, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isStreamer ? '#FFF' : '#3D1F00';
    ctx.textAlign = 'center';
    ctx.fillText(name, cx, cy + 11);
  }

  _drawWaitingIndicator(ctx, cx, cy) {
    // Pulsing "!" mark to indicate the customer is waiting for service
    ctx.font      = "bold 16px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, cy);
  }

  _drawSparkles(ctx, cx, cy, timer) {
    const count = 8;
    const angle = (timer * 2) % (Math.PI * 2); // rotate over time
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.font      = '14px serif';
    for (let i = 0; i < count; i++) {
      const a = angle + (i / count) * Math.PI * 2;
      const r = 28 + Math.sin(timer * 3 + i) * 6;
      ctx.fillText('✦', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  }

  /** Darken a hex color string by mixing with black. */
  _darken(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
    const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 50);
    const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 50);
    const b = Math.max(0, parseInt(c.slice(4, 6), 16) - 50);
    return `rgb(${r},${g},${b})`;
  }
}

