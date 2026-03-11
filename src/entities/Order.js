/**
 * Order.js
 * Represents a single customer order — the menu item, status, and prep state.
 * Orders are created when a customer finishes looking at the menu (ORDERING state).
 */

export class Order {
  /**
   * @param {string} customerId - ID of the customer who placed the order
   * @param {Object} menuItem   - Menu item data from MenuData.js
   */
  constructor(customerId, menuItem) {
    this.id         = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.customerId = customerId;
    this.item       = menuItem;          // full menu item object {id, name, price, prepTime, emoji, color}
    this.status     = 'PENDING';         // PENDING | PREPARING | READY | SERVED
    this.prepTimer  = 0;                 // counts up while preparing
    this._effectivePrepTime = menuItem.prepTime; // may be scaled by upgrade multiplier
  }

  /**
   * Begin preparation — resets the prep timer.
   * @param {number} prepTimeMultiplier - scale factor from coffee machine upgrades
   */
  startPrep(prepTimeMultiplier = 1.0) {
    this.status             = 'PREPARING';
    this.prepTimer          = 0;
    this._effectivePrepTime = this.item.prepTime * prepTimeMultiplier;
  }

  /**
   * Advance the prep timer. Returns true when fully prepared.
   * @param {number} dt - delta time in seconds
   * @returns {boolean}
   */
  update(dt) {
    if (this.status !== 'PREPARING') return false;
    this.prepTimer += dt;
    if (this.prepTimer >= this._effectivePrepTime) {
      this.status = 'READY';
      return true; // just became ready
    }
    return false;
  }

  /** Fraction [0–1] of how far along preparation is. */
  get prepProgress() {
    if (this._effectivePrepTime === 0) return 1;
    return Math.min(this.prepTimer / this._effectivePrepTime, 1);
  }

  /** Mark as served to the customer. */
  serve() {
    this.status = 'SERVED';
  }
}
