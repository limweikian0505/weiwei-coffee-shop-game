/**
 * CustomerRenderer.js
 * Renders customers using GIF animations on the top-down cafe map.
 *
 * Coordinates are used directly (no isometric Y-squash).
 * Animation selection is driven by customer.isMoving and customer.facing.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

const ASSET_PATHS = {
  idle:  'Customer/Animation/idle.gif',
  east:  'Customer/Animation/walking_east.gif',
  west:  'Customer/Animation/walking_west.gif',
  north: 'Customer/Animation/walking_north.gif',
  south: 'Customer/Animation/walking_south.gif',
};

export class CustomerRenderer {
  constructor() {
    this.images  = {};
    this._loaded = false;
    this._loadAssets();
  }

  _loadAssets() {
    for (const [key, path] of Object.entries(ASSET_PATHS)) {
      const img = new Image();
      img.src   = path;
      this.images[key] = img;
    }
    this._loaded = true;
  }

  render(ctx, customer, canvasW = 360, canvasH = 640) {
    // Top-down: use world coordinates directly, no isometric Y projection.
    const sx = customer.x;
    const sy = customer.y;

    const {
      name, isStreamer, isSpecial, emoji, sparkleTimer, state,
      facing, isMoving,
    } = customer;

    // Sprite size: larger than before since the floor is no longer vertically
    // compressed — customers need to fill roughly one tile.
    const bodyW = Math.max(40, Math.min(canvasW * 0.11, canvasH * 0.08));
    const bodyH = bodyW;

    ctx.save();

    // ── Drop shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + bodyH * 0.42, bodyW * 0.32, bodyH * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Sparkle effect for streamers ──────────────────────────────────────────
    if (isStreamer && sparkleTimer > 0) {
      this._drawSparkles(ctx, sx, sy, sparkleTimer, bodyW * 0.4);
    }

    // ── Sprite ────────────────────────────────────────────────────────────────
    const key = isMoving ? (facing || 'south') : 'idle';
    const img = this.images[key];

    if (img && img.complete && img.naturalWidth > 0) {
      const drawX = sx - bodyW / 2;
      const drawY = sy - bodyH * 0.85;
      ctx.drawImage(img, drawX, drawY, bodyW, bodyH);
    } else {
      // Fallback: simple coloured circle until GIFs load.
      ctx.fillStyle = customer.color ?? '#FFB3BA';
      ctx.beginPath();
      ctx.arc(sx, sy - bodyH * 0.35, bodyW * 0.30, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Special icons ─────────────────────────────────────────────────────────
    const iconFont = Math.max(12, canvasW * 0.022);
    ctx.font      = `${iconFont}px serif`;
    ctx.textAlign = 'center';

    if (isSpecial && emoji === '👑') {
      ctx.fillText('👑', sx, sy - bodyH * 0.82);
    }
    if (isStreamer) {
      ctx.fillText('📱', sx + bodyW * 0.44, sy - bodyH * 0.22);
    }

    // ── Name tag ──────────────────────────────────────────────────────────────
    this._drawNameTag(ctx, sx, sy + bodyH * 0.30, name, isStreamer, canvasW);

    // ── Patience bar (shown while WAITING) ────────────────────────────────────
    if (state === 'WAITING') {
      this._drawWaitingIndicator(ctx, sx, sy - bodyH * 0.82, customer, canvasW);
    }

    ctx.restore();
  }

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
    if (ratio > 0.5)       fillColor = '#66BB6A';
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

  _drawSparkles(ctx, cx, cy, timer, radius) {
    const count = 8;
    const angle = (timer * 2) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.font      = '12px serif';
    for (let i = 0; i < count; i++) {
      const a = angle + (i / count) * Math.PI * 2;
      const r = radius + 8 + Math.sin(timer * 3 + i) * 5;
      ctx.fillText('✦', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  }
}