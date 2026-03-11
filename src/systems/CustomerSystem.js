/**
 * CustomerSystem.js
 * Spawns and manages all customers in the cafe.
 *
 * Spawn rules:
 *  - New customer every 8–12 seconds (random), scaled by spawnRateMultiplier
 *  - 75% single, 20% 2-person group, 5% 3-person group
 *  - 10% chance of a TikTok streamer (always single)
 *  - 5% chance of a special customer
 *  - Groups share a groupId and sit at the same table
 *  - Max 8 customers on screen at once
 *  - If no table has enough room for the group, no one enters
 *  - spawnEnabled = false prevents new spawns (e.g. CLOSING phase)
 */

import { Customer, STATE } from '../entities/Customer.js';
import {
  STREAMERS, SPECIAL_CUSTOMERS,
  NORMAL_NAMES, PASTEL_COLORS,
  MENU_ITEMS, getActiveMenuItems,
} from '../data/MenuData.js';

export class CustomerSystem {
  /**
   * @param {Table[]}  tables  - Array of Table instances
   * @param {number}   canvasH - Canvas height (for spawn Y range)
   * @param {number}   canvasW - Canvas width (for exit target calculation)
   */
  constructor(tables, canvasH, canvasW = 1280) {
    this.tables       = tables;
    this.canvasH      = canvasH;
    this.canvasW      = canvasW;
    this.customers    = [];
    this._spawnTimer  = 4; // first customer arrives after 4 s
    this._spawnDelay  = 8 + Math.random() * 4;
    this._groupSeq    = 0; // counter for unique group IDs

    /** Set false to block new spawns (e.g. CLOSING / SUMMARY phase). */
    this.spawnEnabled = true;

    /** Bonus seconds added to every new customer's patience (from upgrades). */
    this.patienceBonus = 0;

    /** Multiplier applied to spawn rate from reputation system. */
    this.spawnRateMultiplier = 1.0;

    /** Tip multiplier from reputation system. */
    this.tipMultiplier = 1.0;

    /** Current reputation value (read from reputationSystem each frame). */
    this.currentReputation = 50;

    /** Sound effect callback set by Game. */
    this.onSound = null;

    /** Callback fired when a streamer spawns — used by Game for the banner. */
    this.onStreamerSpawn = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Find a customer by ID. */
  getById(id) {
    return this.customers.find((c) => c.id === id) ?? null;
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  /**
   * @param {number} dt      - delta time in seconds
   * @param {Object} systems - { orderSystem, economySystem, reputationSystem, goalSystem }
   */
  update(dt, systems) {
    // Sync reputation for spawn condition checks
    if (systems.reputationSystem) {
      this.currentReputation = systems.reputationSystem.reputation;
    }

    // Update each existing customer
    for (const c of this.customers) {
      c.update(dt, systems);
    }

    // Remove customers that have fully left
    this.customers = this.customers.filter((c) => c.state !== STATE.GONE);

    // Spawn timer — only counts down when spawning is enabled
    if (this.spawnEnabled) {
      this._spawnTimer -= dt;
      if (this._spawnTimer <= 0) {
        this._spawnTimer = this._spawnDelay;
        // Scale spawn delay by reputation rate multiplier (higher rep = shorter delay)
        this._spawnDelay = (8 + Math.random() * 4) / Math.max(0.1, this.spawnRateMultiplier);
        this._trySpawn();
      }
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Decide group size: 75% single, 20% pair, 5% triple.
   */
  _rollGroupSize() {
    const r = Math.random();
    if (r < 0.75) return 1;
    if (r < 0.95) return 2;
    return 3;
  }

  _trySpawn() {
    if (this.customers.length >= 8) return;

    // Decide if this is a streamer or special customer (always single)
    const typeRoll = Math.random();
    const isStreamer = typeRoll < 0.10;
    const isSpecial  = !isStreamer && typeRoll < 0.15;

    // Determine group size (streamers and special customers always come alone)
    const groupSize = (isStreamer || isSpecial) ? 1 : this._rollGroupSize();

    // Don't overflow screen
    if (this.customers.length + groupSize > 8) return;

    const groupId = `group_${++this._groupSeq}`;

    // Find a table with enough free seats for the whole group
    const table = this.tables.find((t) => t.isAvailableForGroup(groupId, groupSize));
    if (!table) return; // no room

    // Build group members
    const newCustomers = [];

    for (let i = 0; i < groupSize; i++) {
      const seatIdx = table.getSeat();
      if (seatIdx < 0) break; // shouldn't happen but guard

      let customer;
      if (isStreamer) {
        const data = STREAMERS[Math.floor(Math.random() * STREAMERS.length)];
        customer = this._makeCustomer({
          name       : data.name,
          color      : data.color,
          emoji      : '📱',
          isStreamer : true,
          tip        : data.tip,
          quotes     : [...data.quotes],
          platform   : data.platform,
          groupId,
        });
        customer.sparkleTimer = 5;
        if (this.onStreamerSpawn) this.onStreamerSpawn(customer);

      } else if (isSpecial) {
        const eligible = this._getEligibleSpecials();
        if (!eligible.length) {
          // Fall back to normal customer
          const name  = NORMAL_NAMES[Math.floor(Math.random() * NORMAL_NAMES.length)];
          const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
          customer = this._makeCustomer({ name, color, emoji: '😊', groupId });
        } else {
          const data  = eligible[Math.floor(Math.random() * eligible.length)];
          const emoji = data.id === 'vip'      ? '👑'
                      : data.id === 'birthday' ? '🎂'
                      : data.id === 'blogger'  ? '📸'
                      : data.id === 'family'   ? '👨‍👧'
                      : '🧐';
          customer = this._makeCustomer({
            name         : data.name,
            color        : data.color,
            emoji,
            isSpecial    : true,
            tip          : data.tip ?? 0,
            quotes       : data.quotes ? [...data.quotes] : [],
            isBirthday   : data.isBirthday   ?? false,
            isBlogger    : data.isBlogger    ?? false,
            isFamily     : data.isFamily     ?? false,
            angryPenalty : data.angryPenalty ?? 0,
            requiresItem : data.requiresItem ?? null,
            groupId,
          });
        }
      } else {
        // Normal customer
        const name  = NORMAL_NAMES[Math.floor(Math.random() * NORMAL_NAMES.length)];
        const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
        customer = this._makeCustomer({ name, color, emoji: '😊', groupId });
      }

      // Spawn position: off the left edge on the street, stagger Y slightly for group members
      customer.x       = this.canvasW * -0.05;
      customer.y       = this.canvasH * 0.50 + i * 28;
      customer.targetX  = table.x - 80;
      customer.targetY  = table.y;

      table.occupy(seatIdx, customer);
      customer.assignedTable = table;
      customer.assignedSeat  = seatIdx;

      newCustomers.push(customer);
    }

    // Play door chime once for the group
    if (newCustomers.length > 0 && this.onSound) {
      this.onSound('door_chime');
    }

    this.customers.push(...newCustomers);
  }

  /**
   * Returns special customer types that are eligible to spawn given current conditions.
   */
  _getEligibleSpecials() {
    const rep = this.currentReputation;
    const cakeUnlocked = MENU_ITEMS.find((m) => m.id === 'cake')?.unlocked ?? false;

    return SPECIAL_CUSTOMERS.filter((data) => {
      if (data.isBirthday && !cakeUnlocked) return false;
      if (data.isBlogger  && rep <= 60)     return false;
      if (data.isFamily   && rep <= 50)     return false;
      return true;
    });
  }

  /** Build a Customer with system-level defaults applied. */
  _makeCustomer(options) {
    const c = new Customer({ ...options, canvasWidth: this.canvasW });
    c.patience      += this.patienceBonus;
    c.tipMultiplier  = this.tipMultiplier;
    c.onSound        = this.onSound;
    return c;
  }
}
