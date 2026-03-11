/**
 * OrderSystem.js
 * Manages the order queue and preparation progress.
 *
 * Flow:
 *   1. Customers add orders via addOrder() when they finish ORDERING.
 *   2. Player clicks a WAITING customer → Game opens OrderPanel.
 *   3. Player clicks "Prepare ☕" → prepareOrder(orderId) starts the timer.
 *   4. Timer completes → order.status becomes 'READY'.
 *   5. Player clicks "Serve 🍽️" → serveOrder(customer) called by Game.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class OrderSystem {
  constructor() {
    /** All pending/in-progress orders */
    this.pendingOrders = [];

    /** The single order currently being prepared (or null). */
    this.currentOrder = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Enqueue a new order placed by a customer.
   * @param {Order} order
   */
  addOrder(order) {
    this.pendingOrders.push(order);
  }

  /**
   * Start preparing a specific order (only one at a time).
   * @param {string} orderId
   * @returns {boolean} true if prep started successfully
   */
  prepareOrder(orderId) {
    if (this.currentOrder && this.currentOrder.status === 'PREPARING') {
      return false; // machine busy
    }
    const order = this.pendingOrders.find((o) => o.id === orderId);
    if (!order || order.status !== 'PENDING') return false;

    order.startPrep();
    this.currentOrder = order;
    return true;
  }

  /**
   * Check whether a specific order is READY to serve.
   * @param {string} orderId
   * @returns {boolean}
   */
  isReady(orderId) {
    const order = this.pendingOrders.find((o) => o.id === orderId);
    return order ? order.status === 'READY' : false;
  }

  /**
   * Serve the order and remove it from the queue.
   * The customer's receiveOrder() is called by Game directly.
   * @param {string} orderId
   */
  completeOrder(orderId) {
    this.pendingOrders = this.pendingOrders.filter((o) => o.id !== orderId);
    if (this.currentOrder && this.currentOrder.id === orderId) {
      this.currentOrder = null;
    }
  }

  /** Returns true when the machine is idle (not currently preparing). */
  get isMachineFree() {
    return !this.currentOrder || this.currentOrder.status !== 'PREPARING';
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  /**
   * Advance the current prep timer.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (this.currentOrder && this.currentOrder.status === 'PREPARING') {
      this.currentOrder.update(dt);
      // If it just became READY, currentOrder stays set so we can display it
    }
  }

  // ─── Render (progress bar near counter) ──────────────────────────────────────

  /**
   * Draw the prep progress bar near the counter on the right side of the screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!this.currentOrder) return;

    const order  = this.currentOrder;
    const barW   = 140;
    const barH   = 18;
    const barX   = canvasWidth - barW - 20;
    const barY   = canvasHeight * 0.38;

    ctx.save();

    // Background track
    ctx.fillStyle   = '#5C3317';
    ctx.strokeStyle = '#3D1F00';
    ctx.lineWidth   = 2;
    _roundRect(ctx, barX, barY, barW, barH, 9);
    ctx.fill();
    ctx.stroke();

    if (order.status === 'PREPARING' || order.status === 'READY') {
      const filled = order.prepProgress * barW;
      const color  = order.status === 'READY' ? '#66BB6A' : '#FF9800';
      ctx.fillStyle = color;
      _roundRect(ctx, barX, barY, filled, barH, 9);
      ctx.fill();
    }

    // Label
    ctx.font      = "bold 11px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    const label   = order.status === 'READY'
      ? '✅ Ready!'
      : `☕ ${order.item.name} …`;
    ctx.fillText(label, barX + barW / 2, barY + barH - 4);

    ctx.restore();
  }
}

