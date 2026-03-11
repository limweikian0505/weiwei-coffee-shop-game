/**
 * OrderPanel.js
 * A centred popup panel shown when the player clicks on a WAITING customer.
 *
 * Buttons:
 *   "Prepare ☕" — starts prep (only if machine is free and order is PENDING)
 *   "Serve 🍽️"  — serves the order (only if order is READY)
 *   "Close ✕"   — dismiss the panel
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class OrderPanel {
  constructor() {
    this.visible  = false;
    this.customer = null;  // currently selected Customer

    // Button hit-boxes (set in render, used in handleClick)
    this._btnPrepare = null;
    this._btnServe   = null;
    this._btnClose   = null;
  }

  /** Open the panel for the given customer. */
  open(customer) {
    this.customer = customer;
    this.visible  = true;
  }

  /** Close / hide the panel. */
  close() {
    this.visible  = false;
    this.customer = null;
  }

  /**
   * Handle a click.  Returns an action string or null.
   *   'PREPARE' | 'SERVE' | 'CLOSE' | null
   * @param {number} mx - mouse X
   * @param {number} my - mouse Y
   * @returns {string|null}
   */
  handleClick(mx, my) {
    if (!this.visible) return null;

    if (this._btnClose   && _hit(this._btnClose,   mx, my)) return 'CLOSE';
    if (this._btnPrepare && _hit(this._btnPrepare, mx, my)) return 'PREPARE';
    if (this._btnServe   && _hit(this._btnServe,   mx, my)) return 'SERVE';

    // Click outside panel area — close
    if (this._panelRect && !_hit(this._panelRect, mx, my)) return 'CLOSE';

    return null;
  }

  /**
   * Draw the popup.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @param {OrderSystem} orderSystem - to check machine state
   */
  render(ctx, canvasWidth, canvasHeight, orderSystem) {
    if (!this.visible || !this.customer) return;

    const { customer } = this;
    const order = customer.order;
    if (!order) return;

    const pw = 300;
    const ph = 220;
    const px = (canvasWidth  - pw) / 2;
    const py = (canvasHeight - ph) / 2 - 30;

    this._panelRect = { x: px, y: py, w: pw, h: ph };

    ctx.save();

    // ── Backdrop ──────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ── Panel background ──────────────────────────────────────────────────────
    ctx.fillStyle   = '#FFF8F0';
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth   = 3;
    _roundRect(ctx, px, py, pw, ph, 16);
    ctx.fill();
    ctx.stroke();

    // ── Close button ─────────────────────────────────────────────────────────
    const closeSize = 26;
    const closeX    = px + pw - closeSize - 8;
    const closeY    = py + 8;
    this._btnClose  = { x: closeX, y: closeY, w: closeSize, h: closeSize };

    ctx.fillStyle   = '#FF6B6B';
    ctx.strokeStyle = '#CC3333';
    ctx.lineWidth   = 2;
    _roundRect(ctx, closeX, closeY, closeSize, closeSize, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('✕', closeX + closeSize / 2, closeY + 18);

    // ── Customer name + emoji ─────────────────────────────────────────────────
    ctx.font      = "bold 18px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#3D1F00';
    ctx.textAlign = 'center';
    ctx.fillText(`${customer.emoji} ${customer.name}`, px + pw / 2, py + 38);

    // Streamer badge
    if (customer.isStreamer) {
      ctx.font      = "bold 11px 'Comic Sans MS', cursive";
      ctx.fillStyle = '#FFF';
      const badgeW = 80;
      const badgeX = px + pw / 2 - badgeW / 2;
      ctx.fillStyle   = '#FF6B9D';
      ctx.strokeStyle = '#CC3D6B';
      ctx.lineWidth   = 1.5;
      _roundRect(ctx, badgeX, py + 46, badgeW, 18, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.fillText(`📱 ${customer.platform}`, px + pw / 2, py + 58);
    }

    // ── Order item ────────────────────────────────────────────────────────────
    const itemY = customer.isStreamer ? py + 84 : py + 68;
    ctx.font      = "22px serif";
    ctx.textAlign = 'center';
    ctx.fillText(order.item.emoji, px + pw / 2, itemY);

    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#3D1F00';
    ctx.fillText(order.item.name, px + pw / 2, itemY + 22);

    ctx.font      = "12px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#888';
    ctx.fillText(`价格: $${order.item.price}  小费: $${customer.tip}`, px + pw / 2, itemY + 42);

    // ── Status text ───────────────────────────────────────────────────────────
    const statusY = itemY + 64;
    ctx.font      = "12px 'Comic Sans MS', cursive";
    ctx.fillStyle = order.status === 'READY' ? '#4CAF50' : '#888';
    const statusLabel = { PENDING: '等待制作…', PREPARING: '制作中…', READY: '✅ 已完成！', SERVED: '已上菜' };
    ctx.fillText(statusLabel[order.status] ?? '', px + pw / 2, statusY);

    // ── Buttons ───────────────────────────────────────────────────────────────
    const btnY  = py + ph - 44;
    const btnH  = 34;
    const btnW  = 110;
    const gap   = 16;
    const totalW = btnW * 2 + gap;
    const btnStartX = px + (pw - totalW) / 2;

    // Prepare button — shown only if machine free and order is PENDING
    const canPrepare = orderSystem.isMachineFree && order.status === 'PENDING';
    this._btnPrepare = { x: btnStartX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle   = canPrepare ? '#FF9800' : '#CCC';
    ctx.strokeStyle = canPrepare ? '#E65100' : '#999';
    ctx.lineWidth   = 2;
    _roundRect(ctx, btnStartX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font      = "bold 13px 'Comic Sans MS', cursive";
    ctx.fillStyle = canPrepare ? '#FFF' : '#888';
    ctx.fillText('Prepare ☕', btnStartX + btnW / 2, btnY + 22);

    // Serve button — shown only if order is READY
    const canServe   = order.status === 'READY';
    const serveBtnX  = btnStartX + btnW + gap;
    this._btnServe   = { x: serveBtnX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle   = canServe ? '#4CAF50' : '#CCC';
    ctx.strokeStyle = canServe ? '#2E7D32' : '#999';
    ctx.lineWidth   = 2;
    _roundRect(ctx, serveBtnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = canServe ? '#FFF' : '#888';
    ctx.fillText('Serve 🍽️', serveBtnX + btnW / 2, btnY + 22);

    ctx.restore();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _hit(rect, mx, my) {
  return mx >= rect.x && mx <= rect.x + rect.w &&
         my >= rect.y && my <= rect.y + rect.h;
}

