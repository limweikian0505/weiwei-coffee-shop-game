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
 * Supported types:
 *   'round2'  — circular table with 2 chair circles (left & right)
 *   'square4' — rectangular table with 4 chair squares (N, S, W, E)
 *   'long6'   — elongated locked table (placeholder outline)
 */

export class TableRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Table}  table
   * @param {number} [tileW=64] - tile width in CSS pixels
   * @param {number} [tileH=64] - tile height in CSS pixels
   */
  render(ctx, table, tileW = 64, tileH = 64) {
    // Use world coordinates directly — no isometric projection.
    const sx = table.x;
    const sy = table.y;

    switch (table.type) {
      case 'round2':
        this._drawRound2(ctx, table, sx, sy, tileW, tileH);
        break;
      case 'square4':
        this._drawSquare4(ctx, table, sx, sy, tileW, tileH);
        break;
      case 'long6':
        this._drawLong6(ctx, table, sx, sy, tileW, tileH);
        break;
      default:
        this._drawRound2(ctx, table, sx, sy, tileW, tileH);
    }
  }

  // ─── round2 ─────────────────────────────────────────────────────────────────

  _drawRound2(ctx, table, sx, sy, tileW, tileH) {
    const tileMin = Math.min(tileW, tileH);
    const r       = tileMin * 0.36; // table radius ~36% of tile
    const chairR  = tileMin * 0.20; // chair radius ~20% of tile

    ctx.save();

    // ── Chairs (drawn before table so table top is on top) ─────────────────────
    // Chair positions come directly from table.seats to ensure visual positions
    // match where customers actually stand.
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
    ctx.arc(sx, sy, r * 0.60, 0, Math.PI * 2);
    ctx.stroke();

    // Centre highlight dot
    ctx.fillStyle = 'rgba(255,240,180,0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

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

    // Cushion
    ctx.fillStyle   = occupied ? '#C8A860' : '#F0DC9A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Seat detail line
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

  _drawSquare4(ctx, table, sx, sy, tileW, tileH) {
    const tileMin = Math.min(tileW, tileH);
    const hw      = tileMin * 0.33; // half-width of table surface
    const chairR  = tileMin * 0.20;

    ctx.save();

    // ── Chairs at seat positions ───────────────────────────────────────────────
    // Use table.seats offsets so drawn chairs match customer destination exactly.
    for (const seat of table.seats) {
      this._drawChair(ctx, sx + seat.ox, sy + seat.oy, seat.occupied, chairR);
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

  _drawLong6(ctx, table, sx, sy, tileW, tileH) {
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
}

