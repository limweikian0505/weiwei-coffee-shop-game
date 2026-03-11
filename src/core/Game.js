/**
 * Game.js
 * Main game class — instantiates and wires all systems together, drives the
 * update + render loop, and handles mouse/touch input.
 *
 * Loaded as an ES module entry point from index.html.
 */

import { GameLoop }         from './GameLoop.js';
import { Table }            from '../entities/Table.js';
import { CustomerSystem }   from '../systems/CustomerSystem.js';
import { OrderSystem }      from '../systems/OrderSystem.js';
import { EconomySystem }    from '../systems/EconomySystem.js';
import { CafeRenderer }     from '../renderer/CafeRenderer.js';
import { TableRenderer }    from '../renderer/TableRenderer.js';
import { CustomerRenderer } from '../renderer/CustomerRenderer.js';
import { ChatBubble }       from '../ui/ChatBubble.js';
import { HUD }              from '../ui/HUD.js';
import { OrderPanel }       from '../ui/OrderPanel.js';
import { STATE }            from '../entities/Customer.js';

class Game {
  constructor() {
    // ── Canvas setup ───────────────────────────────────────────────────────────
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());

    const W = this.canvas.width;
    const H = this.canvas.height;

    // ── Tables ─────────────────────────────────────────────────────────────────
    this.tables = [
      new Table(1, W * 0.28, H * 0.52, 'round2'),
      new Table(2, W * 0.52, H * 0.60, 'square4'),
    ];

    // ── Systems ────────────────────────────────────────────────────────────────
    this.economySystem  = new EconomySystem();
    this.orderSystem    = new OrderSystem();
    this.customerSystem = new CustomerSystem(this.tables, H, W);

    // Wire streamer banner callback
    this.customerSystem.onStreamerSpawn = (c) => this.hud.showStreamerBanner(c.name);

    // ── Renderers ──────────────────────────────────────────────────────────────
    this.cafeRenderer     = new CafeRenderer(W, H);
    this.tableRenderer    = new TableRenderer();
    this.customerRenderer = new CustomerRenderer();
    this.chatBubble       = new ChatBubble();

    // ── UI ─────────────────────────────────────────────────────────────────────
    this.hud        = new HUD(this.economySystem);
    this.orderPanel = new OrderPanel();

    // ── Input ──────────────────────────────────────────────────────────────────
    this.canvas.addEventListener('click',      (e) => this._onClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._onClick({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });

    // ── Game loop ──────────────────────────────────────────────────────────────
    this._loop = new GameLoop(this);
  }

  /** Start the game loop. Called after DOMContentLoaded. */
  start() {
    this._loop.start();
  }

  // ─── Loop callbacks ─────────────────────────────────────────────────────────

  update(dt) {
    const systems = {
      orderSystem:   this.orderSystem,
      economySystem: this.economySystem,
    };

    this.customerSystem.update(dt, systems);
    this.orderSystem.update(dt);
    this.economySystem.update(dt);
    this.hud.update(dt);
  }

  render() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background cafe scene
    this.cafeRenderer.render(ctx);

    // Tables
    for (const table of this.tables) {
      this.tableRenderer.render(ctx, table);
    }

    // Customers + chat bubbles
    for (const customer of this.customerSystem.customers) {
      this.customerRenderer.render(ctx, customer);
      this.chatBubble.render(ctx, customer);
    }

    // Order prep progress bar
    this.orderSystem.render(ctx, W, H);

    // Floating money text
    this.economySystem.render(ctx);

    // HUD (bottom bar + streamer banner)
    this.hud.render(ctx, W, H);

    // Order panel popup
    this.orderPanel.render(ctx, W, H, this.orderSystem);

    // Game title at top
    this._drawTitle(ctx, W);
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  _onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    // If order panel is open, handle its clicks first
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
          this.orderSystem.completeOrder(customer.order.id);
          this.orderPanel.close();
        }
      } else if (action === 'CLOSE') {
        this.orderPanel.close();
      }
      return; // consume click
    }

    // Check if a WAITING customer was clicked
    for (const customer of this.customerSystem.customers) {
      if (customer.state === STATE.WAITING && customer.order) {
        const dist = Math.hypot(mx - customer.x, my - customer.y);
        if (dist < 30) {
          this.orderPanel.open(customer);
          return;
        }
      }
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Update renderer dimensions
    if (this.cafeRenderer) {
      this.cafeRenderer.w = this.canvas.width;
      this.cafeRenderer.h = this.canvas.height;
    }
    // Update customer system canvas width so exit targets stay off-screen
    if (this.customerSystem) {
      this.customerSystem.canvasW = this.canvas.width;
    }
  }

  _drawTitle(ctx, W) {
    ctx.save();
    ctx.font      = "bold 26px 'Comic Sans MS', 'Chalkboard SE', cursive";
    ctx.textAlign = 'center';
    // Shadow
    ctx.fillStyle = 'rgba(90,40,0,0.4)';
    ctx.fillText('微微咖啡馆 ☕', W / 2 + 2, 52);
    // Gradient text
    const grad = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
    grad.addColorStop(0, '#8B4513');
    grad.addColorStop(0.5, '#D2691E');
    grad.addColorStop(1, '#8B4513');
    ctx.fillStyle = grad;
    ctx.fillText('微微咖啡馆 ☕', W / 2, 50);
    ctx.restore();
  }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
