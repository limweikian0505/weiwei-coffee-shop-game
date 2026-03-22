/**
 * Customer.js
 * Full state-machine for a cafe customer.
 *
 * Movement model (Phase 1):
 *   When `tilePath` is non-empty the customer advances tile-by-tile along the
 *   BFS path provided by TileMap.  Each step targets the centre of the next
 *   tile; once reached, that step is consumed and movement continues.
 *
 *   When `tilePath` is empty the customer moves directly toward `targetX /
 *   targetY` (used for fine-grained seating and off-screen exit).
 *
 *   `_hasArrived()` returns true only when both the tile path is exhausted AND
 *   the customer is within 2px of `targetX / targetY`.
 */

import { getActiveMenuItems, HAPPY_QUOTES } from '../data/MenuData.js';
import { Order } from './Order.js';

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
  constructor(options = {}) {
    this.id          = `cust_${_nextId++}`;
    this.name        = options.name        ?? '客人';
    this.color       = options.color       ?? '#FFB3BA';
    this.emoji       = options.emoji       ?? '😊';
    this.isStreamer  = options.isStreamer  ?? false;
    this.isSpecial   = options.isSpecial   ?? false;
    this.tip         = options.tip         ?? 0;
    this.quotes      = options.quotes      ?? [];
    this.platform    = options.platform    ?? '';
    this.groupId     = options.groupId     ?? null;

    this.isBirthday   = options.isBirthday   ?? false;
    this.isBlogger    = options.isBlogger    ?? false;
    this.isFamily     = options.isFamily     ?? false;
    this.angryPenalty = options.angryPenalty ?? 0;
    this.requiresItem = options.requiresItem ?? null;

    this.x           = -30;
    this.y           = 300;
    this.targetX     = -30;
    this.targetY     = 300;
    this.walkSpeed   = 120;
    this.canvasWidth = options.canvasWidth ?? 1280;

    this.facing   = 'south';
    this.isMoving = false;

    // ── Tile-based movement ────────────────────────────────────────────────────
    /** Array of { tx, ty } tile steps to follow. Consumed front-to-back. */
    this.tilePath = [];
    /** TileMap instance — injected by CustomerSystem. */
    this.tileMap  = null;

    this.state       = STATE.WALKING_IN;
    this.stateTimer  = 0;

    this.assignedTable = null;
    this.assignedSeat  = -1;

    this.order    = null;
    this.patience = 60;
    this.money    = 0;

    this.chatMessage = null;
    this.chatTimer   = 0;

    this._quoteTimer  = 3;
    this.sparkleTimer = 0;
    this._angryShown  = false;

    this.earnedStars = 0;
    this.waitRatio   = 0;

    this.onSound       = null;
    this.tipMultiplier = 1.0;
  }

  say(msg, duration = 3) {
    this.chatMessage = msg;
    this.chatTimer   = duration;
  }

  randomQuote() {
    if (!this.quotes.length) return null;
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  }

  update(dt, systems) {
    this._move(dt);

    if (this.chatTimer > 0) {
      this.chatTimer -= dt;
      if (this.chatTimer <= 0) this.chatMessage = null;
    }

    if (this.sparkleTimer > 0) {
      this.sparkleTimer -= dt;
    }

    switch (this.state) {
      case STATE.WALKING_IN:
        if (this._hasArrived()) {
          this._enterState(STATE.FINDING_TABLE, 1);
        }
        break;

      case STATE.FINDING_TABLE:
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.targetX = this.assignedTable.seatX(this.assignedSeat);
            this.targetY = this.assignedTable.seatY(this.assignedSeat);
            // Navigate tile-by-tile to the seat so the customer doesn't clip
            // through the table furniture to reach the other side.
            if (this.tileMap) {
              const from = this.tileMap.nearestWalkableTile(this.x, this.y);
              const to   = this.tileMap.nearestWalkableTile(this.targetX, this.targetY);
              this.tilePath = this.tileMap.findPath(from.tx, from.ty, to.tx, to.ty);
            }
            this._enterState(STATE.SEATED, 2);
            this.say('嗯...看看菜单～', 3);
          } else {
            this._startLeaving();
          }
        }
        break;

      case STATE.SEATED:
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
          const activeItems = getActiveMenuItems();
          let item;
          if (this.requiresItem) {
            const specific = activeItems.find((m) => m.id === this.requiresItem);
            item = specific ?? activeItems[Math.floor(Math.random() * activeItems.length)];
          } else {
            item = activeItems[Math.floor(Math.random() * activeItems.length)];
          }
          this.order  = new Order(this.id, item);
          this.money  = item.price + Math.round(this.tip * this.tipMultiplier);
          this.say(`我要一杯 ${item.name}!`, 4);
          systems.orderSystem.addOrder(this.order);
          if (this.onSound) this.onSound('order_placed');
          this._enterState(STATE.WAITING, this.patience);
        }
        break;

      case STATE.WAITING:
        this.stateTimer -= dt;
        if (this.isStreamer) {
          this._quoteTimer -= dt;
          if (this._quoteTimer <= 0) {
            this._quoteTimer = 3 + Math.random() * 2;
            const q = this.randomQuote();
            if (q) this.say(q, 3);
          }
        }
        if (!this._angryShown && this.stateTimer < this.patience * 0.2) {
          this._angryShown = true;
          this.say('😤 等不及了！', 4);
        }
        if (this.stateTimer <= 0) {
          this.waitRatio   = 1.0;
          this.earnedStars = 1;
          this.money       = 0;
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.assignedTable.vacate(this.assignedSeat);
          }
          if (this.onSound) this.onSound('customer_angry');
          if (systems.reputationSystem) {
            systems.reputationSystem.onAngryLeave();
            if (this.isBlogger) {
              systems.reputationSystem.reputation = Math.max(0, systems.reputationSystem.reputation - (this.angryPenalty || 5));
            }
          }
          if (systems.goalSystem) systems.goalSystem.onAngryLeave();
          this._startLeaving('😠 服务太差了！');
        }
        break;

      case STATE.EATING: {
        this.stateTimer -= dt;
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
          systems.economySystem.addMoney(this.money, this.x, this.y);
          if (this.onSound) this.onSound('money_received');
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.assignedTable.vacate(this.assignedSeat);
          }
          if (systems.reputationSystem) {
            systems.reputationSystem.addRating(this.earnedStars);
          }
          if (systems.goalSystem) {
            systems.goalSystem.onMoneyEarned(this.money);
            systems.goalSystem.onCustomerServed(this.earnedStars, this.isStreamer);
          }
          if (this.earnedStars === 5 && this.onSound) this.onSound('five_stars');
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

  _enterState(newState, timerValue = 0) {
    this.state      = newState;
    this.stateTimer = timerValue;
  }

  // ─── Movement ─────────────────────────────────────────────────────────────────

  _move(dt) {
    // ── Tile-path movement ─────────────────────────────────────────────────────
    if (this.tileMap && this.tilePath.length > 0) {
      const { tx, ty } = this.tilePath[0];
      const wx = this.tileMap.tileCenterX(tx);
      const wy = this.tileMap.tileCenterY(ty);
      const dx = wx - this.x;
      const dy = wy - this.y;
      const dist = Math.hypot(dx, dy);

      // Update facing direction.
      this._updateFacing(dx, dy);
      this.isMoving = dist >= 1;

      if (dist < 2) {
        // Snap to tile centre and consume this step.
        this.x = wx;
        this.y = wy;
        this.tilePath.shift();
        this.isMoving = this.tilePath.length > 0;
        // Note: do NOT overwrite targetX/targetY here — the caller (_startLeaving,
        // _trySpawn) has already set them to the desired final destination.
      } else {
        const step = this.walkSpeed * dt;
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
      return;
    }

    // ── Direct targetX / targetY movement (seating & off-screen exit) ──────────
    const dx   = this.targetX - this.x;
    const dy   = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    this.isMoving = dist >= 1;
    this._updateFacing(dx, dy);

    if (dist < 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      return;
    }

    const step = this.walkSpeed * dt;
    if (step >= dist) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  /** Update `facing` based on movement delta. */
  _updateFacing(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx >= 0 ? 'east' : 'west';
    } else if (Math.abs(dy) > 0.5) {
      this.facing = dy >= 0 ? 'south' : 'north';
    }
  }

  _hasArrived() {
    if (this.tilePath.length > 0) return false;
    return Math.hypot(this.targetX - this.x, this.targetY - this.y) < 2;
  }

  _startLeaving(msg = '拜拜！👋') {
    this.say(msg, 2);

    if (this.tileMap) {
      // Alternate between exit rows 4 and 5 based on customer ID parity so
      // multiple departing customers spread across both door tiles instead of
      // queuing through a single row.  Parsing is guarded so any ID format
      // that doesn't yield a positive integer still falls back sensibly.
      const idNum  = parseInt(this.id.replace(/\D+/g, ''), 10) || 0;
      const exitTy = 4 + (idNum % 2);

      const from    = this.tileMap.nearestWalkableTile(this.x, this.y);
      const exitTx  = this.tileMap.getEntranceTile().tx; // col 1
      this.tilePath = this.tileMap.findPath(from.tx, from.ty, exitTx, exitTy);

      // After the tile path ends the customer walks directly off-screen at
      // the same row, so there is no sudden vertical snap at the door.
      const exitWorld = this.tileMap.getExitWorldPos();
      this.targetX    = exitWorld.x;
      this.targetY    = this.tileMap.tileCenterY(exitTy);
    } else {
      // Fallback: move directly off the left edge.
      this.targetX = this.canvasWidth * -0.08;
      this.targetY = this.y;
    }

    this._enterState(STATE.LEAVING, 0);
  }

  receiveOrder() {
    if (this.state !== STATE.WAITING) return;

    const timeUsed = this.patience - this.stateTimer;
    this.waitRatio = Math.max(0, Math.min(1, timeUsed / this.patience));
    if (this.waitRatio < 0.2)      this.earnedStars = 5;
    else if (this.waitRatio < 0.4) this.earnedStars = 4;
    else if (this.waitRatio < 0.6) this.earnedStars = 3;
    else                           this.earnedStars = 2;

    this.order.serve();
    const eatTime = 10 + Math.random() * 5;
    this._quoteTimer = 3;
    this._enterState(STATE.EATING, eatTime);
    this.say('谢谢！好期待！', 3);
    if (this.onSound) this.onSound('serve_success');
  }
}