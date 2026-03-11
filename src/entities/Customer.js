/**
 * Customer.js
 * Full state-machine for a cafe customer.
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
    this.isStreamer  = options.isStreamer   ?? false;
    this.isSpecial   = options.isSpecial   ?? false;
    this.tip         = options.tip         ?? 0;
    this.quotes      = options.quotes      ?? [];
    this.platform    = options.platform    ?? '';
    this.groupId     = options.groupId     ?? null;

    // Special type flags
    this.isBirthday  = options.isBirthday  ?? false;
    this.isBlogger   = options.isBlogger   ?? false;
    this.isFamily    = options.isFamily    ?? false;
    this.angryPenalty = options.angryPenalty ?? 0;
    this.requiresItem = options.requiresItem ?? null;

    // Position / movement
    this.x           = -30;
    this.y           = 300;
    this.targetX     = -30;
    this.targetY     = 300;
    this.walkSpeed   = 120;
    this.canvasWidth = options.canvasWidth ?? 1280;

    // State machine
    this.state       = STATE.WALKING_IN;
    this.stateTimer  = 0;

    // Table assignment
    this.assignedTable = null;
    this.assignedSeat  = -1;

    // Order
    this.order = null;

    // Patience
    this.patience = 60;

    // Money
    this.money = 0;

    // Chat bubble
    this.chatMessage = null;
    this.chatTimer   = 0;

    this._quoteTimer = 3;
    this.sparkleTimer = 0;
    this._angryShown = false;

    // Star rating tracking
    this.earnedStars = 0;
    this.waitRatio   = 0;

    // Sound effect hook — set by CustomerSystem
    this.onSound = null;

    // Reputation tip multiplier — set by CustomerSystem
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

    if (this.sparkleTimer > 0) this.sparkleTimer -= dt;

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
          // Angry leave
          this.waitRatio  = 1.0;
          this.earnedStars = 1;
          this.money = 0;
          if (this.assignedTable && this.assignedSeat >= 0) {
            this.assignedTable.vacate(this.assignedSeat);
          }
          if (this.onSound) this.onSound('customer_angry');
          if (systems.reputationSystem) {
            systems.reputationSystem.onAngryLeave();
            if (this.isBlogger) {
              systems.reputationSystem.reputation = Math.max(0,
                systems.reputationSystem.reputation - (this.angryPenalty || 5));
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
          // Notify systems
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

  _hasArrived() {
    return Math.hypot(this.targetX - this.x, this.targetY - this.y) < 2;
  }

  _startLeaving(msg = '拜拜！👋') {
    this.targetX = this.canvasWidth + 40;
    this.targetY = this.y;
    this._enterState(STATE.LEAVING, 0);
    this.say(msg, 2);
  }

  receiveOrder() {
    if (this.state !== STATE.WAITING) return;
    // Calculate star rating based on wait ratio
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
