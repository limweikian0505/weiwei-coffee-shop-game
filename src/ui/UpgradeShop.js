/**
 * UpgradeShop.js
 * Canvas-rendered upgrade shop panel.
 */

import { UPGRADES } from '../data/UpgradeData.js';
import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class UpgradeShop {
  constructor() {
    this.visible = false;
    this.purchasedIds = new Set();
    this.purchaseCounts = {}; // for maxPurchase items
    this.prepTimeMultiplier = 1.0;
    this.patienceBonus = 0;

    this._scrollY = 0;
    this._btnClose = null;
    this._itemRects = [];
    this._panelRect = null;

    // Callbacks set by Game
    this.onBuy = null; // (upgradeId) => void
  }

  open()  { this.visible = true; this._scrollY = 0; }
  close() { this.visible = false; }

  toggle() {
    if (this.visible) this.close();
    else this.open();
  }

  /** Returns true if the item has been purchased (or max-purchased). */
  isPurchased(upgrade) {
    if (upgrade.maxPurchase) {
      return (this.purchaseCounts[upgrade.id] ?? 0) >= upgrade.maxPurchase;
    }
    return this.purchasedIds.has(upgrade.id);
  }

  /** Can the item be purchased? */
  canBuy(upgrade, money) {
    if (this.isPurchased(upgrade)) return false;
    if (upgrade.requires && !this.purchasedIds.has(upgrade.requires)) return false;
    return money >= upgrade.cost;
  }

  /** Whether prerequisites are met (even if can't afford). */
  isUnlocked(upgrade) {
    if (!upgrade.requires) return true;
    return this.purchasedIds.has(upgrade.requires);
  }

  handleClick(mx, my, money) {
    if (!this.visible) return null;

    if (this._btnClose && _hit(this._btnClose, mx, my)) return 'CLOSE';

    for (const { rect, upgrade } of this._itemRects) {
      if (_hit(rect, mx, my)) {
        if (this.canBuy(upgrade, money)) return upgrade.id;
      }
    }
    // Click outside panel — close
    if (this._panelRect && !_hit(this._panelRect, mx, my)) return 'CLOSE';
    return null;
  }

  render(ctx, W, H, money) {
    if (!this.visible) return;

    ctx.save();

    // Backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    const pw = Math.min(500, W - 40);
    const ph = Math.min(500, H - 80);
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;
    this._panelRect = { x: px, y: py, w: pw, h: ph };

    // Panel background
    ctx.fillStyle   = '#FFF8F0';
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth   = 3;
    _roundRect(ctx, px, py, pw, ph, 16);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.font      = "bold 20px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 升级商店', px + pw / 2, py + 34);

    // Close button
    const cw = 28, ch = 28;
    const cx = px + pw - cw - 8;
    const cy = py + 8;
    this._btnClose = { x: cx, y: cy, w: cw, h: ch };
    ctx.fillStyle   = '#FF6B6B';
    ctx.strokeStyle = '#CC3333';
    ctx.lineWidth   = 2;
    _roundRect(ctx, cx, cy, cw, ch, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('✕', cx + cw / 2, cy + 18);

    // Divider
    ctx.strokeStyle = '#D4A96A';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 46);
    ctx.lineTo(px + pw - 16, py + 46);
    ctx.stroke();

    // Items list
    this._itemRects = [];
    const itemH  = 72;
    const itemPad = 8;
    const listY  = py + 54;
    const listH  = ph - 60;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 4, listY, pw - 8, listH);
    ctx.clip();

    UPGRADES.forEach((upgrade, i) => {
      const iy = listY + i * (itemH + itemPad) - this._scrollY;
      if (iy + itemH < listY || iy > listY + listH) return;

      const ix = px + 12;
      const iw = pw - 24;
      const rect = { x: ix, y: iy, w: iw, h: itemH };
      this._itemRects.push({ rect, upgrade });

      const bought = this.isPurchased(upgrade);
      const unlocked = this.isUnlocked(upgrade);
      const affordable = money >= upgrade.cost;
      const buyable = this.canBuy(upgrade, money);

      // Item background
      if (bought) {
        ctx.fillStyle = 'rgba(100,200,100,0.18)';
      } else if (!unlocked) {
        ctx.fillStyle = 'rgba(150,150,150,0.18)';
      } else if (!affordable) {
        ctx.fillStyle = 'rgba(255,100,100,0.12)';
      } else {
        ctx.fillStyle = 'rgba(255,220,160,0.35)';
      }
      ctx.strokeStyle = bought ? '#66BB6A' : (buyable ? '#D4A96A' : '#CCC');
      ctx.lineWidth   = 1.5;
      _roundRect(ctx, ix, iy, iw, itemH, 10);
      ctx.fill();
      ctx.stroke();

      // Emoji
      ctx.font      = '28px serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = unlocked ? '#000' : '#AAA';
      ctx.fillText(upgrade.emoji, ix + 12, iy + 44);

      // Name + desc
      ctx.font      = `bold 14px 'Comic Sans MS', cursive`;
      ctx.fillStyle = bought ? '#2E7D32' : (unlocked ? '#3D1F00' : '#888');
      ctx.fillText(upgrade.name, ix + 56, iy + 26);

      ctx.font      = `12px 'Comic Sans MS', cursive`;
      ctx.fillStyle = unlocked ? '#666' : '#AAA';
      ctx.fillText(upgrade.desc, ix + 56, iy + 44);

      if (upgrade.maxPurchase) {
        const count = this.purchaseCounts[upgrade.id] ?? 0;
        ctx.fillText(`(${count}/${upgrade.maxPurchase})`, ix + 56, iy + 60);
      }

      // Price / status badge
      ctx.textAlign = 'right';
      if (bought) {
        ctx.fillStyle   = '#2E7D32';
        ctx.font = "bold 13px 'Comic Sans MS', cursive";
        ctx.fillText('✅ 已购买', ix + iw - 10, iy + 36);
      } else if (!unlocked) {
        ctx.fillStyle = '#888';
        ctx.font = "12px 'Comic Sans MS', cursive";
        ctx.fillText('🔒 需要前置', ix + iw - 10, iy + 36);
      } else {
        ctx.fillStyle = affordable ? '#E65100' : '#C62828';
        ctx.font = "bold 15px 'Comic Sans MS', cursive";
        ctx.fillText(`$${upgrade.cost}`, ix + iw - 10, iy + 30);
        ctx.font = "12px 'Comic Sans MS', cursive";
        ctx.fillStyle = affordable ? '#4CAF50' : '#C62828';
        ctx.fillText(affordable ? '✅ 可购买' : '💸 钱不够', ix + iw - 10, iy + 48);
      }
    });

    ctx.restore();
    ctx.restore();
  }
}

function _hit(rect, mx, my) {
  return mx >= rect.x && mx <= rect.x + rect.w &&
         my >= rect.y && my <= rect.y + rect.h;
}
