/**
 * ReputationSystem.js
 * Manages reputation (0-100) which influences spawn rate and tip multipliers.
 */
import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class ReputationSystem {
  constructor() {
    this.reputation = 50;
    this.maxReputation = 100;
  }

  /** Called when a satisfied customer leaves (stars 1-5). */
  addRating(stars) {
    this.reputation = Math.min(this.maxReputation, this.reputation + stars * 0.8);
  }

  /** Called when an impatient customer leaves angrily. */
  onAngryLeave() {
    this.reputation = Math.max(0, this.reputation - 3);
  }

  /** 'low' | 'normal' | 'high' | 'famous' */
  getTier() {
    if (this.reputation < 30) return 'low';
    if (this.reputation < 70) return 'normal';
    if (this.reputation < 85) return 'high';
    return 'famous';
  }

  getSpawnRateMultiplier() {
    const map = { low: 0.7, normal: 1.0, high: 1.2, famous: 1.4 };
    return map[this.getTier()];
  }

  getTipMultiplier() {
    const map = { low: 0.8, normal: 1.0, high: 1.1, famous: 1.25 };
    return map[this.getTier()];
  }

  render(ctx, W, H) {
    const barW = 100;
    const barH = 10;
    const x = W - barW - 14;
    const y = H - 76; // just above HUD
    const ratio = this.reputation / this.maxReputation;

    ctx.save();

    // Label
    ctx.font = "bold 11px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`⭐ 声望`, x, y - 2);

    // Background track
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    _roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Fill
    const tierColors = { low: '#EF5350', normal: '#FFA726', high: '#66BB6A', famous: '#FFD700' };
    ctx.fillStyle = tierColors[this.getTier()];
    if (ratio > 0) {
      _roundRect(ctx, x, y, barW * ratio, barH, 4);
      ctx.fill();
    }

    // Value text
    ctx.font = "10px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(this.reputation)}/100`, x + barW / 2, y + barH - 1);

    ctx.restore();
  }
}
