/**
 * Customer.js
 * Full state-machine for a cafe customer.
 *
 * States (in order):
 *   WALKING_IN → FINDING_TABLE → SEATED → ORDERING →
 *   WAITING → EATING → PAYING → LEAVING → GONE
 *
 * The Game / CustomerSystem drives state transitions by calling update(dt).
 */

import { MENU_ITEMS, HAPPY_QUOTES } from '../data/MenuData.js';
import { Order } from './Order.js';

// ─── State constants ──────────────────────────────────────────────────────────
export const STATE = {
  WALKING_IN:    'WALKING_IN',
  FINDING_TABLE: 'FINDING_TABLE',
  SEATED:        'SEATED',
  ORDERING:      'ORDERING',
  WAITING:       'WAITING',
  EATING:        'EATING',
  PAYING:        'PAYING',
  LEAVING:       'LEAVING',
  GONE:          'GONE',
};

let _nextId = 1;

export class Customer {
  /**
   * @param {Object} options
   * @param {string}  options.name
   * @param {string}  options.color       - Body fill color
   * @param {string}  [options.emoji]     - Face emoji
   * @param {boolean} [options.isStreamer]
   * @param {boolean} [options.isSpecial]
   * @param {number}  [options.tip]       - Extra tip on top of order price
   * @param {string[]} [options.quotes]   - Chat quotes pool
   * @param {string}  [options.platform]  - Streaming platform name
   */
  constructor(options = {}) {
    this.id          = `cust_${_nextId++}`;
    this.name        = options.name        ?? '客人';
    this.color       = options.color       ?? '#FFB3BA';
    this.emoji       = options.emoji       ?? '😊';
    this.isStreamer  = options.isStreamer   ?? false;
    this.isSpecial   = options.isSpecial   ?? false;
    this.tip         = options.tip         ?? 0;
    this.quotes      = options.quotes      ?? [];
    this.platform    = options.platform    ?? '';

    // Position / movement
    this.x           = -30;
    this.y           = 300;
    this.targetX     = -30;
    this.targetY     = 300;
    this.walkSpeed   = 120; // pixels per second

    /** Canvas width — used to calculate the off-screen exit point. Set by CustomerSystem. */
    this.canvasWidth = options.canvasWidth ?? 1280;

    // State machine
    this.state       = STATE.WALKING_IN;
    this.stateTimer  = 0; // counts DOWN in seconds

    // Table assignment
    this.assignedTable = null;  // Table instance
    this.assignedSeat  = -1;    // seat index

    // Order
    this.order = null;

    // Patience — customer leaves if still WAITING after this many seconds
    this.patience = 60;

    // Money to pay (set when order is placed)
    this.money = 0;

    // Chat bubble
    this.chatMessage = null;
    this.chatTimer   = 0;

    // Streamer quote timer
    this._quoteTimer = 3;

    // Sparkle timer for streamers
    this.sparkleTimer = 0;

    // Group ID — customers with the same groupId came together
    this.groupId = options.groupId ?? null;

    // Angry indicator — set to true once the "almost out of patience" message fires
    this._angryShown = false;
  }

  // ─── Convenience ────────────────────────────────────────────────────────────

  /** Show a chat bubble message for `duration` seconds (default 3). */
  say(msg, duration = 3) {
    this.chatMessage = msg;
    this.chatTimer   = duration;
  }

  /** Pick a random quote from the customer's quote pool. */
  randomQuote() {
    if (!this.quotes.length) return null;
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  }

  // ─── State transitions ───────────────────────────────────────────────────────

  /**
   * Main update — called each frame by CustomerSystem.
   * @param {number} dt - delta time in seconds
   * @param {Object} systems - { orderSystem, economySystem }
   */
  update(dt, systems) {
    // Move towards target
    this._move(dt);

    // Chat bubble timer
    if (this.chatTimer > 0) {
      this.chatTimer -= dt;
      if (this.chatTimer <= 0) this.chatMessage = null;
    }

    // Sparkle timer (for streamers)
    if (this.sparkleTimer > 0) this.sparkleTimer -= dt;

    // Per-state logic
    switch (this.state) {

      case STATE.WALKING_IN:
        // Transition once we've arrived at the table entry point
        if (this._hasArrived()) {
          this._enterState(STATE.FINDING_TABLE, 1);
        }
        break;

      case STATE.FINDING_TABLE:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Should already have a seat assigned; just sit down
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.targetX = this.assignedTable.seatX(this.assignedSeat);
            this.targetY = this.assignedTable.seatY(this.assignedSeat);
            this._enterState(STATE.SEATED, 2);
            this.say('嗯...看看菜单～', 3);
          } else {
            // No table found — start leaving
            this._startLeaving();
          }
        }
        break;

      case STATE.SEATED:
        // Move to seat
        if (this._hasArrived()) {
          this.stateTimer -= dt;
          if (this.stateTimer <= 0) {
            this._enterState(STATE.ORDERING, 3);
          }
        }
        break;

      case STATE.ORDERING:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Auto-pick a random menu item
          const item    = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
          this.order    = new Order(this.id, item);
          this.money    = item.price + this.tip;
          this.say(`我要一杯 ${item.name}!`, 4);
          systems.orderSystem.addOrder(this.order);
          this._enterState(STATE.WAITING, this.patience);
        }
        break;

      case STATE.WAITING:
        this.stateTimer -= dt;
        // Streamer says quotes periodically
        if (this.isStreamer) {
          this._quoteTimer -= dt;
          if (this._quoteTimer <= 0) {
            this._quoteTimer = 3 + Math.random() * 2;
            const q = this.randomQuote();
            if (q) this.say(q, 3);
          }
        }
        // Trigger angry message once when patience drops below 20%
        // (Progress bar turns red at 30% — these are intentionally different thresholds.)
        if (!this._angryShown && this.stateTimer < this.patience * 0.2) {
          this._angryShown = true;
          this.say('😤 等不及了！', 4);
        }
        if (this.stateTimer <= 0) {
          // Ran out of patience — leave without paying
          this.money = 0;
          // Free the seat so others can use the table
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.assignedTable.vacate(this.assignedSeat);
          }
          this._startLeaving('😠 服务太差了！');
        }
        break;

      case STATE.EATING: {
        this.stateTimer -= dt;
        // Occasionally say a happy quote
        this._quoteTimer -= dt;
        if (this._quoteTimer <= 0) {
          this._quoteTimer = 3 + Math.random() * 2;
          const q = HAPPY_QUOTES[Math.floor(Math.random() * HAPPY_QUOTES.length)];
          this.say(q, 3);
        }
        if (this.stateTimer <= 0) {
          this._enterState(STATE.PAYING, 2);
          this.say('好吃！谢谢老板！', 3);
        }
        break;
      }

      case STATE.PAYING:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Pay the cafe
          systems.economySystem.addMoney(this.money, this.x, this.y);
          // Free the seat
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.assignedTable.vacate(this.assignedSeat);
          }
          this._startLeaving();
        }
        break;

      case STATE.LEAVING:
        if (this._hasArrived()) {
          this.state = STATE.GONE;
        }
        break;

      default:
        break;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _enterState(newState, timerValue = 0) {
    this.state      = newState;
    this.stateTimer = timerValue;
  }

  /** Move smoothly towards (targetX, targetY). */
  _move(dt) {
    const dx   = this.targetX - this.x;
    const dy   = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      return;
    }
    const step = this.walkSpeed * dt;
    if (step >= dist) {
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  /** Returns true when the customer is within 2px of their target. */
  _hasArrived() {
    return Math.hypot(this.targetX - this.x, this.targetY - this.y) < 2;
  }

  /** Set target to the right exit edge so the customer walks out. */
  _startLeaving(msg = '拜拜！👋') {
    this.targetX = this.canvasWidth + 40;
    this.targetY = this.y;
    this._enterState(STATE.LEAVING, 0);
    this.say(msg, 2);
  }

  /** Called by OrderSystem when the player serves this customer's order. */
  receiveOrder() {
    if (this.state !== STATE.WAITING) return;
    this.order.serve();
    const eatTime = 10 + Math.random() * 5; // 10–15 seconds
    this._quoteTimer = 3;
    this._enterState(STATE.EATING, eatTime);
    this.say('谢谢！好期待！', 3);
  }
}
