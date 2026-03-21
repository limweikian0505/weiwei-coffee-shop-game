/**
 * TableRenderer.js — True Top-Down Style
 *
 * Draws tables as flat, bird's-eye shapes aligned with the top-down tile grid.
 * Coordinates are used directly without any isometric projection or Y-squish.
 *
 * Supported types:
 *   'round2'  — circular table with 2 chair circles (left & right)
 *   'square4' — rectangular table with 4 chair squares (N, S, E, W)
 *   'long6'   — elongated locked table (placeholder outline)
 */

export class TableRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Table}  table
   * @param {number} [canvasH=640]
   */
  render(ctx, table, canvasH = 640) {
    // Use world coordinates directly — no isometric projection.
    const sx = table.x;
    const sy = table.y;

    switch (table.type) {
      case 'round2':
        this._drawRound2(ctx, table, sx, sy, canvasH);
        break;
      case 'square4':
        this._drawSquare4(ctx, table, sx, sy, canvasH);
        break;
      case 'long6':
        this._drawLong6(ctx, table, sx, sy);
        break;
      default:
        this._drawRound2(ctx, table, sx, sy, canvasH);
    }
  }

  // ─── round2 ─────────────────────────────────────────────────────────────────

  _drawRound2(ctx, table, sx, sy, canvasH) {
    const r  = Math.max(18, canvasH * 0.030); // table radius

    ctx.save();

    // ── Chairs (drawn before table so table top is on top) ─────────────────────
    for (const seat of table.seats) {
      // In the top-down layout the seat offsets are direct pixel deltas.
      const cx = sx + seat.ox;
      const cy = sy + seat.oy;
      this._drawChair(ctx, cx, cy, seat.occupied, r * 0.45);
    }

    // ── Drop shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy + 3, r, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Table surface ──────────────────────────────────────────────────────────
    ctx.fillStyle   = '#A0722A';
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
    ctx.arc(sx, sy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /** Top-down circular chair. */
  _drawChair(ctx, cx, cy, occupied, r) {
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Cushion
    ctx.fillStyle   = occupied ? '#C8A860' : '#F0DC9A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ─── square4 ────────────────────────────────────────────────────────────────

  _drawSquare4(ctx, table, sx, sy, canvasH) {
    const hw = Math.max(20, canvasH * 0.034); // half-width of table

    ctx.save();

    // ── Chairs at N / S / E / W ───────────────────────────────────────────────
    // Position chairs outside the table boundary, scaled to canvasH.
    const chairR   = hw * 0.45;
    const chairGap = hw * 1.55; // distance from table centre to chair centre
    const chairDefs = [
      { ox: 0,        oy: -chairGap }, // North
      { ox: 0,        oy:  chairGap }, // South
      { ox: -chairGap, oy: 0        }, // West
      { ox:  chairGap, oy: 0        }, // East
    ];
    for (let i = 0; i < chairDefs.length; i++) {
      const occ = i < table.seats.length && table.seats[i].occupied;
      this._drawChair(ctx, sx + chairDefs[i].ox, sy + chairDefs[i].oy, occ, chairR);
    }

    // ── Drop shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(sx - hw + 3, sy - hw + 3, hw * 2, hw * 2);

    // ── Table surface ──────────────────────────────────────────────────────────
    ctx.fillStyle   = '#A0722A';
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

    ctx.restore();
  }

  // ─── long6 (locked — placeholder) ───────────────────────────────────────────

  _drawLong6(ctx, table, sx, sy) {
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 3;
    ctx.strokeRect(sx - 62, sy - 22, 124, 44);
    ctx.restore();

    ctx.fillStyle = 'rgba(150,150,150,0.15)';
    ctx.fillRect(sx - 62, sy - 22, 124, 44);

    ctx.font      = "bold 13px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 解锁', sx, sy + 6);
  }
}
