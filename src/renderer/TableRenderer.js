/**
 * TableRenderer.js
 * Draws tables and chairs in a cute cartoon style.
 *
 * Supported types:
 *   'round2'  — circle table, 2 chairs
 *   'square4' — rounded-rect table, 4 chairs
 *   'long6'   — locked long table (Phase 2)
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class TableRenderer {
  /**
   * Draw a single table.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Table} table
   */
  render(ctx, table) {
    switch (table.type) {
      case 'round2':
        this._drawRound2(ctx, table);
        break;
      case 'square4':
        this._drawSquare4(ctx, table);
        break;
      case 'long6':
        this._drawLong6(ctx, table);
        break;
      default:
        this._drawRound2(ctx, table);
    }
  }

  // ─── round2 ──────────────────────────────────────────────────────────────────

  _drawRound2(ctx, table) {
    const { x, y } = table;

    // Draw 2 chairs first (so table renders on top)
    for (const seat of table.seats) {
      this._drawChairSemi(ctx, x + seat.ox, y + seat.oy, seat.ox < 0 ? 'left' : 'right', seat.occupied);
    }

    // Table circle
    ctx.fillStyle   = '#8B6914';
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = 4;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wood grain highlight
    ctx.strokeStyle = 'rgba(255,220,120,0.25)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 18, 0.2, 1.2);
    ctx.stroke();
  }

  _drawChairSemi(ctx, cx, cy, side, occupied) {
    const startA = side === 'left' ? Math.PI * 0.5  : Math.PI * 1.5;
    const endA   = side === 'left' ? Math.PI * 1.5  : Math.PI * 0.5;

    ctx.fillStyle   = occupied ? '#C8A860' : '#E8C97A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, startA, endA);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ─── square4 ─────────────────────────────────────────────────────────────────

  _drawSquare4(ctx, table) {
    const { x, y } = table;

    // Chairs at North / South / East / West of the table
    const chairDefs = [
      { ox: 0,  oy: -44 }, // North
      { ox: 0,  oy:  44 }, // South
      { ox: -44, oy: 0  }, // West
      { ox:  44, oy: 0  }, // East
    ];

    for (let i = 0; i < chairDefs.length; i++) {
      const occupied = i < table.seats.length && table.seats[i].occupied;
      this._drawChairSquare(ctx, x + chairDefs[i].ox, y + chairDefs[i].oy, occupied);
    }

    // Table rounded rectangle 60×60
    ctx.fillStyle   = '#8B6914';
    ctx.strokeStyle = '#5C4A1E';
    ctx.lineWidth   = 4;
    _roundRect(ctx, x - 30, y - 30, 60, 60, 10);
    ctx.fill();
    ctx.stroke();

    // Grain
    ctx.strokeStyle = 'rgba(255,220,120,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 20);
    ctx.lineTo(x + 14, y - 20);
    ctx.moveTo(x - 18, y - 6);
    ctx.lineTo(x + 18, y - 6);
    ctx.moveTo(x - 18, y + 6);
    ctx.lineTo(x + 18, y + 6);
    ctx.stroke();
  }

  _drawChairSquare(ctx, cx, cy, occupied) {
    ctx.fillStyle   = occupied ? '#C8A860' : '#E8C97A';
    ctx.strokeStyle = '#B8943A';
    ctx.lineWidth   = 3;
    _roundRect(ctx, cx - 12, cy - 10, 24, 20, 5);
    ctx.fill();
    ctx.stroke();
  }

  // ─── long6 (locked — Phase 2) ─────────────────────────────────────────────

  _drawLong6(ctx, table) {
    const { x, y } = table;

    // Dashed outline
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 3;
    _roundRect(ctx, x - 60, y - 25, 120, 50, 8);
    ctx.stroke();
    ctx.restore();

    // Semi-transparent fill
    ctx.fillStyle = 'rgba(150,150,150,0.15)';
    _roundRect(ctx, x - 60, y - 25, 120, 50, 8);
    ctx.fill();

    // Lock label
    ctx.font      = "bold 13px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 解锁', x, y + 6);
  }
}

