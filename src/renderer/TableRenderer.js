/**
 * TableRenderer.js — True Top-Down Style
 *
 * Draws tables as flat, bird's-eye shapes aligned with the top-down tile grid.
 * Coordinates are used directly without any isometric projection or Y-squish.
 *
 * Table and chair sizes are derived from the tile dimensions passed by Game.js
 * so they scale consistently across different screen sizes.
 *
 * Chair positions follow table.seats offsets exactly, ensuring visual and
 * logical positions match (customers always walk to where the chair is drawn).
 *
 * Phase 4 additions:
 *   - Attention ring + coffee-cup icon when any customer is WAITING for service.
 *   - Subtle "eating" tint on the table surface when customers are being served.
 *   - Occupied chairs rendered in a warmer, more distinct tone.
 *
 * Supported types:
 *   'round2'  — circular table with 2 chair circles (left & right)
 *   'square4' — rectangular table with 4 chair squares (N, S, W, E)
 *   'long6'   — elongated locked table (placeholder outline)
 */

export class TableRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Table}  table
   * @param {number} [tileW=64]  - tile width in CSS pixels
   * @param {number} [tileH=64]  - tile height in CSS pixels
   * @param {number} [now=0]     - current timestamp in ms (for pulsed animations)
   */
  render(ctx, table, tileW = 64, tileH = 64, now = 0) {
    // Use world coordinates directly — no isometric projection.
    const sx = table.x;
    const sy = table.y;

    switch (table.type) {
      case 'round2':
        this._drawRound2(ctx, table, sx, sy, tileW, tileH, now);
        break;
      case 'square4':
        this._drawSquare4(ctx, table, sx, sy, tileW, tileH, now);
        break;
      case 'long6':
        this._drawLong6(ctx, table, sx, sy, tileW, tileH);
        break;
      default:
        this._drawRound2(ctx, table, sx, sy, tileW, tileH, now);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Derive the service state of a table from its seated customers.
   * Returns: 'empty' | 'occupied' | 'waiting' | 'eating'
   */
  _tableServiceState(table) {
    const hasSeat = (state) => table.seats.some((s) => s.customer && s.customer.state === state);
    if (hasSeat('WAITING'))                         return 'waiting';
    if (hasSeat('EATING') || hasSeat('PAYING'))     return 'eating';
    if (table.seats.some((s) => s.occupied))        return 'occupied';
    return 'empty';
  }

  // ─── round2 ─────────────────────────────────────────────────────────────────

  _drawRound2(ctx, table, sx, sy, tileW, tileH, now) {
    const tileMin = Math.min(tileW, tileH);
    const r       = tileMin * 0.36; // table radius ~36% of tile
    const chairR  = tileMin * 0.20; // chair radius ~20% of tile
    const svcState = this._tableServiceState(table);

    ctx.save();

    // ── Pre-table attention ring (WAITING state) ───────────────────────────────
    if (svcState === 'waiting') {
      this._drawAttentionRing(ctx, sx, sy, r, now);
    }

    // ── Chairs (drawn before table so table top is on top) ─────────────────────
    for (const seat of table.seats) {
      const cx = sx + seat.ox;
      const cy = sy + seat.oy;
      this._drawChair(ctx, cx, cy, seat.occupied, chairR);
    }

    // ── Drop shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy + 3, r, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Table surface ──────────────────────────────────────────────────────────
    // Tint occupied tables slightly warmer so empty vs occupied is instantly legible.
    const baseColor = svcState === 'empty' ? '#A0722A' : '#B07E36';
    ctx.fillStyle   = baseColor;
    ctx.strokeStyle = '#5C3A10';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wood grain ring
    ctx.strokeStyle = 'rgba(255,220,120,0.30)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.60, 0, Math.PI * 2);
    ctx.stroke();

    // Centre highlight dot
    ctx.fillStyle = 'rgba(255,240,180,0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // ── Post-table overlay icons ───────────────────────────────────────────────
    if (svcState === 'waiting') {
      this._drawOrderReadyIcon(ctx, sx, sy - r * 0.20, r, now);
    } else if (svcState === 'eating') {
      this._drawEatingIcon(ctx, sx, sy, r);
    }

    ctx.restore();
  }

  /** Top-down circular chair cushion. */
  _drawChair(ctx, cx, cy, occupied, r) {
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Cushion — occupied chairs are a warmer, more saturated amber so the
    // player can immediately see at a glance that a seat is taken.
    ctx.fillStyle   = occupied ? '#D4902A' : '#F0DC9A';
    ctx.strokeStyle = occupied ? '#7A4A10' : '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Seat detail ring (only on empty chairs so occupied ones read as flat/solid)
    if (!occupied) {
      ctx.strokeStyle = 'rgba(180,140,60,0.35)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ─── square4 ────────────────────────────────────────────────────────────────

  _drawSquare4(ctx, table, sx, sy, tileW, tileH, now) {
    const tileMin  = Math.min(tileW, tileH);
    const hw       = tileMin * 0.33; // half-width of table surface
    const chairR   = tileMin * 0.20;
    const svcState = this._tableServiceState(table);

    ctx.save();

    // ── Pre-table attention ring ───────────────────────────────────────────────
    if (svcState === 'waiting') {
      this._drawAttentionRing(ctx, sx, sy, hw * 1.1, now);
    }

    // ── Chairs at seat positions ───────────────────────────────────────────────
    for (const seat of table.seats) {
      this._drawChair(ctx, sx + seat.ox, sy + seat.oy, seat.occupied, chairR);
    }

    // ── Drop shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(sx - hw + 3, sy - hw + 3, hw * 2, hw * 2);

    // ── Table surface ──────────────────────────────────────────────────────────
    const baseColor = svcState === 'empty' ? '#A0722A' : '#B07E36';
    ctx.fillStyle   = baseColor;
    ctx.strokeStyle = '#5C3A10';
    ctx.lineWidth   = 2.5;
    ctx.fillRect(sx - hw, sy - hw, hw * 2, hw * 2);
    ctx.strokeRect(sx - hw, sy - hw, hw * 2, hw * 2);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(255,220,120,0.28)';
    ctx.lineWidth   = 1.2;
    for (const t of [0.35, 0.65]) {
      ctx.beginPath();
      ctx.moveTo(sx - hw, sy - hw + hw * 2 * t);
      ctx.lineTo(sx + hw, sy - hw + hw * 2 * t);
      ctx.stroke();
    }

    // ── Post-table overlay icons ───────────────────────────────────────────────
    if (svcState === 'waiting') {
      this._drawOrderReadyIcon(ctx, sx, sy, hw, now);
    } else if (svcState === 'eating') {
      this._drawEatingIcon(ctx, sx, sy, hw * 0.9);
    }

    ctx.restore();
  }

  // ─── long6 (locked — placeholder) ───────────────────────────────────────────

  _drawLong6(ctx, table, sx, sy, tileW, tileH, now = 0) {
    const lw = tileW * 1.9;
    const lh = tileH * 0.65;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 3;
    ctx.strokeRect(sx - lw / 2, sy - lh / 2, lw, lh);
    ctx.restore();

    ctx.fillStyle = 'rgba(150,150,150,0.15)';
    ctx.fillRect(sx - lw / 2, sy - lh / 2, lw, lh);

    ctx.font      = "bold 13px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 解锁', sx, sy + 6);
  }

  // ─── State overlay helpers ───────────────────────────────────────────────────

  /**
   * Pulsing orange/red ring drawn beneath the table to signal that a
   * customer is waiting for service.  Pulse speed: ~1 Hz.
   */
  _drawAttentionRing(ctx, cx, cy, radius, now) {
    // Pulse: oscillates between 0.4 and 1.0 opacity at ~1 Hz.
    const pulse  = 0.4 + 0.6 * (Math.sin(now * 0.006) * 0.5 + 0.5);
    const expand = 1.0 + 0.12 * (Math.sin(now * 0.006) * 0.5 + 0.5);

    ctx.save();
    ctx.strokeStyle = `rgba(255,100,30,${(pulse * 0.75).toFixed(2)})`;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * expand * 1.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Small coffee-cup icon drawn on top of the table surface when a customer
   * is in the WAITING state, reinforcing that their order still needs to be
   * served.
   */
  _drawOrderReadyIcon(ctx, cx, cy, tableRadius, now) {
    const pulse    = 0.7 + 0.3 * (Math.sin(now * 0.007) * 0.5 + 0.5);
    const iconSize = Math.max(10, tableRadius * 0.55);

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font        = `${iconSize}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☕', cx, cy);
    ctx.restore();
  }

  /**
   * Small happy-food icon on the table surface while customers are eating,
   * confirming to the player that this table has been served.
   */
  _drawEatingIcon(ctx, cx, cy, tableRadius) {
    const iconSize = Math.max(8, tableRadius * 0.45);
    ctx.save();
    ctx.globalAlpha = 0.80;
    ctx.font        = `${iconSize}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍰', cx, cy);
    ctx.restore();
  }
}

