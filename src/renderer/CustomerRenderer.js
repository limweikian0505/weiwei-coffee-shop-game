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

  render(ctx, customer, canvasW = 360, canvasH = 640, tileW = 64, tileH = 64, now = 0) {
    // Top-down: use world coordinates directly, no isometric Y projection.
    const sx = customer.x;
    const sy = customer.y;

    const {
      name, isStreamer, isSpecial, emoji, sparkleTimer, state,
      facing, isMoving,
    } = customer;

    // Scale sprite so it fits neatly inside one tile (88 % of the smaller
    // tile dimension).  This keeps characters correctly proportioned across
    // all screen sizes without exceeding their tile footprint.
    const tileMin = Math.min(tileW, tileH);
    const bodyW = Math.max(32, tileMin * 0.88);
    const bodyH = bodyW;

    // Sprite is drawn centred on the world position (top-down convention: the
    // entity position is its centre, not its feet).
    const drawX = sx - bodyW / 2;
    const drawY = sy - bodyH / 2;

    ctx.save();

    // ── Drop shadow (at feet — slightly below centre) ─────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + bodyH * 0.44, bodyW * 0.30, bodyH * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Sparkle effect for streamers ──────────────────────────────────────────
    if (isStreamer && sparkleTimer > 0) {
      this._drawSparkles(ctx, sx, sy, sparkleTimer, bodyW * 0.4);
    }

    // ── Sprite ────────────────────────────────────────────────────────────────
    const key = isMoving ? (facing || 'south') : 'idle';
    const img = this.images[key];

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, drawX, drawY, bodyW, bodyH);
    } else {
      // Fallback: simple coloured circle until GIFs load.
      ctx.fillStyle = customer.color ?? '#FFB3BA';
      ctx.beginPath();
      ctx.arc(sx, sy, bodyW * 0.30, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Special icons ─────────────────────────────────────────────────────────
    const iconFont = Math.max(12, canvasW * 0.022);
    ctx.font      = `${iconFont}px serif`;
    ctx.textAlign = 'center';

    if (isSpecial && emoji === '👑') {
      ctx.fillText('👑', sx, drawY - 2);
    }
    if (isStreamer) {
      ctx.fillText('📱', sx + bodyW * 0.44, sy);
    }

    // ── Name tag (below sprite) ───────────────────────────────────────────────
    this._drawNameTag(ctx, sx, drawY + bodyH + 2, name, isStreamer, canvasW);

    // ── Patience bar (shown while WAITING) ────────────────────────────────────
    if (state === 'WAITING') {
      this._drawWaitingIndicator(ctx, sx, drawY - 12, customer, canvasW, now);
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

  _drawWaitingIndicator(ctx, cx, cy, customer, canvasW, now = 0) {
    const barW  = Math.max(38, canvasW * 0.068);
    const barH  = 7;
    const barX  = cx - barW / 2;
    const barY  = cy - 10;
    const ratio = Math.max(0, Math.min(1, customer.stateTimer / customer.patience));

    // Track (background)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    _roundRect(ctx, barX - 1, barY - 1, barW + 2, barH + 2, 4);
    ctx.fill();

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

    // Attention icon — pulsed red '!' above the bar
    const pulse = (Math.sin(now * 0.008) * 0.5 + 0.5); // 0–1 oscillation
    ctx.font      = `bold ${Math.round(14 + pulse * 3)}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = `rgba(255,${Math.round(40 + pulse * 40)},40,${0.85 + pulse * 0.15})`;
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, barY - 2);
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