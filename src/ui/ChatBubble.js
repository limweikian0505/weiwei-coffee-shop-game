/**
 * ChatBubble.js
 * Renders speech bubbles above customers.
 *
 * Normal customers: white rounded rectangle + black text + triangle pointer.
 * Streamers:        pink background + "📱直播中" badge.
 *
 * The bubble fades out as chatTimer approaches 0.
 * Font size scales with canvasW for readability on small screens.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class ChatBubble {
  /**
   * Draw a chat bubble for a single customer if they have an active message.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Customer} customer
   * @param {number} [canvasW=360] - logical canvas width for responsive sizing
   */
  render(ctx, customer, canvasW = 360) {
    if (!customer.chatMessage || customer.chatTimer <= 0) return;

    const { x, y, chatMessage, chatTimer, isStreamer } = customer;

    // Fade out in the last second
    const alpha = Math.min(1, chatTimer);

    ctx.save();
    ctx.globalAlpha = alpha;

    const padding  = 10;
    const lineH    = 18;
    const fontSize = Math.max(11, canvasW * 0.022);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;

    // Measure text; handle multi-line via '\n' if needed
    const lines  = chatMessage.split('\n');
    const maxW   = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bw     = maxW + padding * 2;
    const bh     = lines.length * lineH + padding * 1.5;

    // Bubble top-left corner (centred above the customer's head)
    const bx = x - bw / 2;
    const by = y - 40 - bh;

    // ── Background ─────────────────────────────────────────────────────────────
    ctx.fillStyle   = isStreamer ? '#FF6B9D' : '#FFFDF0';
    ctx.strokeStyle = isStreamer ? '#CC3D6B' : '#C8A882';
    ctx.lineWidth   = 2;
    _roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    // ── Triangle pointer ───────────────────────────────────────────────────────
    ctx.fillStyle = isStreamer ? '#FF6B9D' : '#FFFDF0';
    ctx.beginPath();
    ctx.moveTo(x - 7, by + bh);
    ctx.lineTo(x + 7, by + bh);
    ctx.lineTo(x,     by + bh + 9);
    ctx.closePath();
    ctx.fill();

    // Re-draw the stroke for the pointer edges (skip the top edge)
    ctx.strokeStyle = isStreamer ? '#CC3D6B' : '#C8A882';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(x - 7, by + bh);
    ctx.lineTo(x,     by + bh + 9);
    ctx.lineTo(x + 7, by + bh);
    ctx.stroke();

    // ── Streamer badge ─────────────────────────────────────────────────────────
    let textOffsetY = 0;
    if (isStreamer) {
      ctx.font      = `bold ${Math.max(10, fontSize - 2)}px 'Comic Sans MS', cursive`;
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'left';
      ctx.fillText('📱直播中', bx + padding, by + padding + 10);
      textOffsetY = lineH;
    }

    // ── Text ──────────────────────────────────────────────────────────────────
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = isStreamer ? '#FFF' : '#3D1F00';
    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      ctx.fillText(line, x, by + padding + textOffsetY + lineH * i + 12);
    });

    ctx.restore();
  }
}

