/**
 * TableRenderer.js — Isometric 2.5D Style
 *
 * Draws tables as isometric 3D objects.
 *
 * Coordinate transform (perspective squish):
 *   sx = table.x            (keep X as-is — game coords are already screen pixels)
 *   sy = table.y * 0.55 + H * 0.22  (squish Y upward to simulate depth)
 *
 * Supported types:
 *   'round2'  — isometric round table with 2 chair cushions
 *   'square4' — isometric square table (parallelogram top) with 4 chairs
 *   'long6'   — elongated locked table (Phase 2)
 */

export class TableRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Table}  table
   * @param {number} [canvasH=640]
   */
  render(ctx, table, canvasH = 640) {
    const sx = table.x;
    const sy = table.y * 0.55 + canvasH * 0.22;

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

  // ─── round2 ──────────────────────────────────────────────────────────────────

  _drawRound2(ctx, table, sx, sy, canvasH) {
    const r    = Math.max(22, canvasH * 0.038);    // table top radius
    const legH = r * 0.55;                          // leg height
    const sideH = r * 0.28;                         // cylinder side depth

    ctx.save();

    // ── Chairs (draw before table so table is on top) ──────────────────────────
    for (const seat of table.seats) {
      const cx = sx + seat.ox * 0.82;
      const cy = sy + seat.oy * 0.42;
      this._drawChairCushion(ctx, cx, cy, seat.occupied, r * 0.48, sideH * 0.7);
    }

    // ── Table legs ────────────────────────────────────────────────────────────
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = Math.max(2, r * 0.12);
    for (const dx of [-r * 0.45, r * 0.45]) {
      ctx.beginPath();
      ctx.moveTo(sx + dx, sy + sideH);
      ctx.lineTo(sx + dx, sy + sideH + legH);
      ctx.stroke();
    }

    // ── Table cylinder side ───────────────────────────────────────────────────
    ctx.fillStyle   = '#6B4F1A';
    ctx.strokeStyle = '#3D2B08';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy + sideH, r, r * 0.38, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ── Table top (ellipse) ────────────────────────────────────────────────────
    ctx.fillStyle   = '#8B6914';
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wood grain
    ctx.strokeStyle = 'rgba(255,220,120,0.28)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx - r * 0.18, sy - r * 0.06, r * 0.52, r * 0.22, -0.3, 0.1, 1.2);
    ctx.stroke();

    ctx.restore();
  }

  _drawChairCushion(ctx, cx, cy, occupied, rW, rH) {
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + rH + 3, rW * 0.75, rH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cushion side
    ctx.fillStyle   = occupied ? '#C8A860' : '#E8D08A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + rH, rW, rH, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cushion top
    ctx.fillStyle   = occupied ? '#D4B46A' : '#F0DC9A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rW, rH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ─── square4 ─────────────────────────────────────────────────────────────────

  _drawSquare4(ctx, table, sx, sy, canvasH) {
    const hw   = Math.max(26, canvasH * 0.042);  // half width
    const hd   = hw * 0.42;                       // half depth (isometric squish)
    const legH = hw * 0.50;
    const topH = hd * 0.35;                       // thickness of table top

    ctx.save();

    // ── Chairs at N/S/E/W ─────────────────────────────────────────────────────
    const chairDefs = [
      { ox: 0,    oy: -hw * 1.45 },  // North
      { ox: 0,    oy:  hw * 1.45 },  // South
      { ox: -hw * 1.45, oy: 0   },  // West
      { ox:  hw * 1.45, oy: 0   },  // East
    ];
    for (let i = 0; i < chairDefs.length; i++) {
      const occ = i < table.seats.length && table.seats[i].occupied;
      const cx  = sx + chairDefs[i].ox * 0.82;
      const cy  = sy + chairDefs[i].oy * 0.42;
      this._drawIsoChair(ctx, cx, cy, occ, hw * 0.42, hd * 0.5);
    }

    // ── Legs ──────────────────────────────────────────────────────────────────
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = Math.max(2, hw * 0.12);
    for (const [dx, dy] of [[-hw * 0.75, -hd * 0.5], [hw * 0.75, -hd * 0.5],
                             [-hw * 0.75,  hd * 0.5], [hw * 0.75,  hd * 0.5]]) {
      ctx.beginPath();
      ctx.moveTo(sx + dx, sy + dy + topH);
      ctx.lineTo(sx + dx, sy + dy + topH + legH);
      ctx.stroke();
    }

    // ── Table front face ──────────────────────────────────────────────────────
    ctx.fillStyle   = '#6B4F1A';
    ctx.strokeStyle = '#3D2B08';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(sx - hw, sy + hd);
    ctx.lineTo(sx + hw, sy + hd);
    ctx.lineTo(sx + hw, sy + hd + topH);
    ctx.lineTo(sx - hw, sy + hd + topH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ── Table right face ──────────────────────────────────────────────────────
    ctx.fillStyle = '#5A3F10';
    ctx.beginPath();
    ctx.moveTo(sx + hw, sy);
    ctx.lineTo(sx + hw, sy + hd);
    ctx.lineTo(sx + hw, sy + hd + topH);
    ctx.lineTo(sx + hw, sy + topH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ── Table top (parallelogram) ─────────────────────────────────────────────
    ctx.fillStyle   = '#8B6914';
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx,      sy - hd);   // back center
    ctx.lineTo(sx + hw, sy);        // right
    ctx.lineTo(sx,      sy + hd);   // front center
    ctx.lineTo(sx - hw, sy);        // left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(255,220,120,0.28)';
    ctx.lineWidth   = 1.2;
    for (const t of [0.3, 0.5, 0.7]) {
      ctx.beginPath();
      ctx.moveTo(sx - hw * (1 - t * 0.5), sy - hd * (1 - t));
      ctx.lineTo(sx + hw * (1 - t * 0.5), sy - hd * (1 - t));
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawIsoChair(ctx, cx, cy, occupied, hw, hd) {
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + hd + 2, hw * 0.7, hd * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chair front
    ctx.fillStyle   = occupied ? '#C8A860' : '#E8C97A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy + hd * 0.5);
    ctx.lineTo(cx + hw, cy + hd * 0.5);
    ctx.lineTo(cx + hw, cy + hd);
    ctx.lineTo(cx - hw, cy + hd);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chair top (parallelogram)
    ctx.fillStyle   = occupied ? '#D4B46A' : '#F0DC9A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx,      cy - hd * 0.5);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx,      cy + hd * 0.5);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ─── long6 (locked — Phase 2) ─────────────────────────────────────────────

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
