/**
 * Game.js
 * Main game class — instantiates and wires all systems together, drives the
 * update + render loop, and handles mouse/touch input.
 */

import { GameLoop }          from './GameLoop.js';
import { Table }             from '../entities/Table.js';
import { CustomerSystem }    from '../systems/CustomerSystem.js';
import { OrderSystem }       from '../systems/OrderSystem.js';
import { EconomySystem }     from '../systems/EconomySystem.js';
import { ReputationSystem }  from '../systems/ReputationSystem.js';
import { DaySystem }         from '../systems/DaySystem.js';
import { GoalSystem }        from '../systems/GoalSystem.js';
import { CafeRenderer }      from '../renderer/CafeRenderer.js';
import { TableRenderer }     from '../renderer/TableRenderer.js';
import { CustomerRenderer }  from '../renderer/CustomerRenderer.js';
import { ChatBubble }        from '../ui/ChatBubble.js';
import { HUD }               from '../ui/HUD.js';
import { OrderPanel }        from '../ui/OrderPanel.js';
import { UpgradeShop }       from '../ui/UpgradeShop.js';
import { DaySummary }        from '../ui/DaySummary.js';
import { GoalTracker }       from '../ui/GoalTracker.js';
import { StarRatingPopup }   from '../ui/StarRatingPopup.js';
import { audioManager }      from '../audio/AudioManager.js';
import { MusicGenerator }    from '../audio/MusicGenerator.js';
import { STATE }             from '../entities/Customer.js';
import { MENU_ITEMS }        from '../data/MenuData.js';
import { UPGRADES }          from '../data/UpgradeData.js';
import { roundRect as _roundRect } from '../utils/drawUtils.js';
import { setupOrientationHandler } from '../utils/orientation.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    // Logical (CSS-pixel) dimensions — set by _resize()
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this._resize();
    // Orientation/resize handled via utility (covers both orientationchange & resize)
    setupOrientationHandler(this.canvas, this);

    const W = this.W;
    const H = this.H;

    this.tables = [
      new Table(1, W * 0.28, H * 0.52, 'round2'),
      new Table(2, W * 0.52, H * 0.60, 'square4'),
    ];

    this.economySystem    = new EconomySystem();
    this.orderSystem      = new OrderSystem();
    this.reputationSystem = new ReputationSystem();
    this.daySystem        = new DaySystem();
    this.goalSystem       = new GoalSystem();
    this.customerSystem   = new CustomerSystem(this.tables, H, W);

    this.upgradeShop = new UpgradeShop();
    this.daySummary  = new DaySummary();
    this.goalTracker = new GoalTracker(this.goalSystem);
    this.starRating  = new StarRatingPopup();

    this._dayStartRep = this.reputationSystem.reputation;

    this.goalSystem._onReward = (amount) => {
      this.economySystem.addMoney(amount, W / 2, H / 2);
    };
    this.goalSystem._onGoalComplete = () => {
      audioManager.play('goal_complete');
    };

    this.daySystem.onDayEnd = () => this._showDaySummary();

    this.orderSystem.onSound = (s) => audioManager.play(s);

    this.customerSystem.onSound = (s) => audioManager.play(s);
    this.customerSystem.onStreamerSpawn = (c) => {
      this.hud.showStreamerBanner(c.name);
      audioManager.play('door_chime');
    };

    this.upgradeShop.onBuy = (upgradeId) => this._applyUpgrade(upgradeId);

    this.cafeRenderer     = new CafeRenderer(W, H);
    this.tableRenderer    = new TableRenderer();
    this.customerRenderer = new CustomerRenderer();
    this.chatBubble       = new ChatBubble();

    this.hud        = new HUD(this.economySystem);
    this.orderPanel = new OrderPanel();

    this._musicGenerator = null;
    this._isMuted        = false;
    this._btnUpgrade     = null;
    this._btnMute        = null;

    // ── Input ─────────────────────────────────────────────────────────────────
    this.canvas.addEventListener('click', (e) => this._onClick(e));

    // Track touch start position to distinguish taps from swipes
    let _touchStartX = 0;
    let _touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      _touchStartX = t.clientX;
      _touchStartY = t.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      // Only fire a click if the finger didn't move more than 10px (not a swipe)
      const dx = t.clientX - _touchStartX;
      const dy = t.clientY - _touchStartY;
      if (Math.hypot(dx, dy) < 10) {
        this._onClick({ clientX: t.clientX, clientY: t.clientY });
      }
    }, { passive: false });

    this._loop = new GameLoop(this);
  }

  start() {
    this._loop.start();
  }

  update(dt) {
    if (this.daySystem.phase === 'SUMMARY') return;

    this.daySystem.update(dt);

    this.customerSystem.spawnEnabled        = this.daySystem.canSpawn();
    this.customerSystem.spawnRateMultiplier = this.reputationSystem.getSpawnRateMultiplier();
    this.customerSystem.tipMultiplier       = this.reputationSystem.getTipMultiplier();
    this.customerSystem.patienceBonus       = this.upgradeShop.patienceBonus;

    const systems = {
      orderSystem:      this.orderSystem,
      economySystem:    this.economySystem,
      reputationSystem: this.reputationSystem,
      goalSystem:       this.goalSystem,
    };

    this.customerSystem.update(dt, systems);
    this.orderSystem.update(dt);
    this.economySystem.update(dt);
    this.hud.update(dt);
    this.starRating.update(dt);

    if (this.daySystem.phase === 'CLOSING') {
      const active = this.customerSystem.customers.filter((c) => c.state !== STATE.GONE);
      if (active.length === 0) {
        this.daySystem.triggerSummary();
      }
    }
  }

  render() {
    const { ctx } = this;
    const W = this.W;
    const H = this.H;

    ctx.clearRect(0, 0, W, H);

    this.cafeRenderer.render(ctx, this.daySystem.getSkyTint());

    for (const table of this.tables) {
      this.tableRenderer.render(ctx, table);
    }

    for (const customer of this.customerSystem.customers) {
      this.customerRenderer.render(ctx, customer, W);
      this.chatBubble.render(ctx, customer, W);
    }

    this.orderSystem.render(ctx, W, H);
    this.economySystem.render(ctx);
    this.starRating.render(ctx);
    this.reputationSystem.render(ctx, W, H);
    this.daySystem.render(ctx, W, H);
    this.goalTracker.render(ctx, W, H);
    this.hud.render(ctx, W, H);
    this._renderHUDButtons(ctx, W, H);
    this.orderPanel.render(ctx, W, H, this.orderSystem);
    this.upgradeShop.render(ctx, W, H, this.economySystem.money);
    this.daySummary.render(ctx, W, H);
    this._drawTitle(ctx, W);
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  /** Extract CSS-pixel coordinates from a mouse or synthetic touch event. */
  _getEventCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    // getBoundingClientRect() and clientX/Y are both in CSS pixels,
    // so a simple subtraction gives the correct canvas-space position.
    return {
      mx: e.clientX - rect.left,
      my: e.clientY - rect.top,
    };
  }

  _onClick(e) {
    if (!audioManager._initialized) {
      audioManager.init();
      this._musicGenerator = new MusicGenerator(audioManager.ctx);
      audioManager._musicGenerator = this._musicGenerator;
      if (!this._isMuted) audioManager.startMusic();
    }

    const { mx, my } = this._getEventCoords(e);

    if (this.daySummary.visible) {
      const action = this.daySummary.handleClick(mx, my);
      if (action === 'NEXT_DAY') this._startNewDay();
      return;
    }

    if (this.upgradeShop.visible) {
      const result = this.upgradeShop.handleClick(mx, my, this.economySystem.money);
      if (result === 'CLOSE') {
        this.upgradeShop.close();
      } else if (result && result !== 'CLOSE') {
        const upgrade = UPGRADES.find((u) => u.id === result);
        if (upgrade && this.economySystem.spendMoney(upgrade.cost)) {
          this._applyUpgrade(result);
          audioManager.play('upgrade_buy');
        }
      }
      return;
    }

    if (this._btnUpgrade && _hit(this._btnUpgrade, mx, my)) {
      this.upgradeShop.toggle();
      return;
    }
    if (this._btnMute && _hit(this._btnMute, mx, my)) {
      this._toggleMute();
      return;
    }

    if (this.orderPanel.visible) {
      const action = this.orderPanel.handleClick(mx, my);
      if (action === 'PREPARE') {
        const customer = this.orderPanel.customer;
        if (customer && customer.order) {
          this.orderSystem.prepareOrder(customer.order.id);
        }
      } else if (action === 'SERVE') {
        const customer = this.orderPanel.customer;
        if (customer && customer.order) {
          customer.receiveOrder();
          this.starRating.addRating(customer.x, customer.y, customer.earnedStars);
          this.orderSystem.completeOrder(customer.order.id);
          this.orderPanel.close();
        }
      } else if (action === 'CLOSE') {
        this.orderPanel.close();
      }
      return;
    }

    // Touch-friendly hit radius: at least 44px (iOS HIG) or ~6% of canvas width
    const touchRadius = Math.max(44, this.W * 0.06);

    for (const customer of this.customerSystem.customers) {
      if (customer.state === STATE.WAITING && customer.order) {
        const dist = Math.hypot(mx - customer.x, my - customer.y);
        if (dist < touchRadius) {
          this.orderPanel.open(customer);
          return;
        }
      }
    }
  }

  _renderHUDButtons(ctx, W, H) {
    const hudH = Math.max(70, H * 0.10);
    const hudY = H - hudH;
    const bh   = Math.max(32, hudH * 0.44);
    const by   = hudY + (hudH - bh) / 2;

    ctx.save();

    const bw = Math.max(80, W * 0.10);
    const bx = W / 2 + W * 0.08;
    this._btnUpgrade = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle   = '#FF9800';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth   = 2;
    _roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();
    const btnFontSize = Math.max(11, W * 0.025);
    ctx.font      = `bold ${btnFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 升级', bx + bw / 2, by + bh / 2 + btnFontSize * 0.38);

    const mw  = Math.max(48, W * 0.065);
    const mx2 = bx + bw + 8;
    this._btnMute = { x: mx2, y: by, w: mw, h: bh };
    ctx.fillStyle   = this._isMuted ? '#666' : '#4CAF50';
    ctx.strokeStyle = this._isMuted ? '#444' : '#2E7D32';
    _roundRect(ctx, mx2, by, mw, bh, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.fillText(this._isMuted ? '🔇' : '🔊', mx2 + mw / 2, by + bh / 2 + btnFontSize * 0.38);

    ctx.restore();
  }

  _toggleMute() {
    this._isMuted = !this._isMuted;
    if (this._isMuted) audioManager.stopMusic();
    else               audioManager.startMusic();
  }

  _applyUpgrade(upgradeId) {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    if (upgrade.maxPurchase) {
      this.upgradeShop.purchaseCounts[upgradeId] =
        (this.upgradeShop.purchaseCounts[upgradeId] ?? 0) + 1;
    } else {
      this.upgradeShop.purchasedIds.add(upgradeId);
    }

    const { effect } = upgrade;
    if (effect.prepTimeMultiplier !== undefined) {
      this.orderSystem.prepTimeMultiplier = effect.prepTimeMultiplier;
      this.upgradeShop.prepTimeMultiplier = effect.prepTimeMultiplier;
    }
    if (effect.patienceBonus !== undefined) {
      this.upgradeShop.patienceBonus += effect.patienceBonus;
    }
    if (effect.addTable) {
      this._addTable();
    }
    if (effect.unlockMenuItem) {
      const item = MENU_ITEMS.find((m) => m.id === effect.unlockMenuItem);
      if (item) item.unlocked = true;
    }
  }

  _addTable() {
    const W = this.W;
    const H = this.H;
    const n = this.tables.length;
    const positions = [
      [W * 0.35, H * 0.42],
      [W * 0.60, H * 0.45],
    ];
    const pos = positions[n - 2] ?? [W * 0.40 + n * 40, H * 0.50];
    this.tables.push(new Table(n + 1, pos[0], pos[1], 'square4'));
    this.customerSystem.tables = this.tables;
  }

  _showDaySummary() {
    const stats    = this.goalSystem.getStats();
    const repDelta = this.reputationSystem.reputation - this._dayStartRep;
    const avg      = stats.customersServed > 0
      ? (stats.totalStars / stats.customersServed).toFixed(1)
      : '0.0';

    // Finalize the 'no_angry' goal at end of day (can't be done mid-day)
    const goals = this.goalSystem.getDailyGoals();
    const noAngryGoal = goals.find((g) => g.id === 'no_angry');
    if (noAngryGoal) {
      const hasServed = stats.customersServed > 0;
      noAngryGoal.completed = hasServed && stats.angryLeaves === 0;
    }

    this.daySummary.show({
      dayNumber       : this.daySystem.dayNumber,
      moneyEarned     : stats.moneyEarned,
      customersServed : stats.customersServed,
      avgRating       : avg,
      reputationDelta : repDelta,
      goals,
    });
  }

  _startNewDay() {
    this.daySummary.hide();
    this._dayStartRep = this.reputationSystem.reputation;
    this.goalSystem.resetForNewDay();
    this.daySystem.startNewDay();
    audioManager.play('new_day');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _resize() {
    const dpr  = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    // Set canvas physical pixel size for sharp rendering on Retina screens
    this.canvas.width  = cssW * dpr;
    this.canvas.height = cssH * dpr;

    // Keep CSS display size unchanged
    this.canvas.style.width  = cssW + 'px';
    this.canvas.style.height = cssH + 'px';

    // Scale the drawing context so all coordinates remain in CSS pixels
    // Reset transform first (defensive; canvas.width assignment already resets it)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Store logical (CSS-pixel) dimensions used throughout game logic
    this.W = cssW;
    this.H = cssH;

    if (this.cafeRenderer) {
      this.cafeRenderer.w = cssW;
      this.cafeRenderer.h = cssH;
    }
    if (this.customerSystem) {
      this.customerSystem.canvasW = cssW;
      this.customerSystem.canvasH = cssH;
    }
    // Reposition tables so they follow the new layout on orientation change
    if (this.tables && this.tables.length >= 2) {
      this.tables[0].x = cssW * 0.28;
      this.tables[0].y = cssH * 0.52;
      this.tables[1].x = cssW * 0.52;
      this.tables[1].y = cssH * 0.60;
    }
  }

  _drawTitle(ctx, W) {
    ctx.save();
    const fontSize = Math.max(18, W * 0.05);
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', 'Chalkboard SE', cursive`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(90,40,0,0.4)';
    ctx.fillText('微微咖啡馆 ☕', W / 2 + 2, 52);
    const grad = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
    grad.addColorStop(0, '#8B4513');
    grad.addColorStop(0.5, '#D2691E');
    grad.addColorStop(1, '#8B4513');
    ctx.fillStyle = grad;
    ctx.fillText('微微咖啡馆 ☕', W / 2, 50);
    ctx.restore();
  }
}

function _hit(rect, mx, my) {
  return mx >= rect.x && mx <= rect.x + rect.w &&
         my >= rect.y && my <= rect.y + rect.h;
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
