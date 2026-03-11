/**
 * DaySummary.js
 * Full-screen day-end summary overlay.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class DaySummary {
  constructor() {
    this.visible = false;
    this._btnNext = null;
    this._data = null;
  }

  show(data) {
    this.visible = true;
    this._data = data;
    // data = { dayNumber, moneyEarned, customersServed, avgRating, reputationDelta, goals }
  }

  hide() {
    this.visible = false;
    this._data = null;
  }

  handleClick(mx, my) {
    if (!this.visible) return null;
    if (this._btnNext && _hit(this._btnNext, mx, my)) return 'NEXT_DAY';
    return null;
  }

  render(ctx, W, H) {
    if (!this.visible || !this._data) return;

    const d = this._data;
    ctx.save();

    // Full overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    const pw = Math.min(460, W - 40);
    const ph = Math.min(520, H - 60);
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    // Panel
    ctx.fillStyle   = '#FFF8F0';
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth   = 3;
    _roundRect(ctx, px, py, pw, ph, 18);
    ctx.fill();
    ctx.stroke();

    let ty = py + 46;

    // Title
    ctx.font      = "bold 22px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#3D1F00';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${d.dayNumber} 天结束 🌙`, px + pw / 2, ty); ty += 32;

    // Divider
    ctx.strokeStyle = '#D4A96A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, ty); ctx.lineTo(px + pw - 20, ty);
    ctx.stroke(); ty += 20;

    ctx.font      = "16px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#5C3317';
    ctx.textAlign = 'left';
    const lx = px + 28;
    const rw = pw - 56;

    const lines = [
      [`💰 当天收入`, `$${d.moneyEarned}`],
      [`👥 服务顾客`, `${d.customersServed} 位`],
      [`⭐ 平均评分`, `${d.avgRating} 星`],
      [`📣 声望变化`, d.reputationDelta >= 0 ? `+${d.reputationDelta.toFixed(1)}` : `${d.reputationDelta.toFixed(1)}`],
    ];

    for (const [label, value] of lines) {
      ctx.fillStyle = '#5C3317';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx, ty);
      ctx.textAlign = 'right';
      ctx.fillText(value, lx + rw, ty);
      ty += 26;
    }

    // Goals
    ty += 6;
    ctx.strokeStyle = '#D4A96A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, ty); ctx.lineTo(px + pw - 20, ty);
    ctx.stroke(); ty += 18;

    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#3D1F00';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 每日目标', px + pw / 2, ty); ty += 22;

    ctx.font = "13px 'Comic Sans MS', cursive";
    let totalBonus = 0;
    for (const goal of (d.goals ?? [])) {
      const done = goal.completed;
      ctx.fillStyle = done ? '#2E7D32' : '#C62828';
      ctx.textAlign = 'left';
      ctx.fillText(`${done ? '✅' : '❌'} ${goal.desc}`, lx, ty);
      ctx.textAlign = 'right';
      ctx.fillStyle = done ? '#2E7D32' : '#888';
      ctx.fillText(done ? `+$${goal.reward}` : '$0', lx + rw, ty);
      if (done) totalBonus += goal.reward;
      ty += 22;
    }

    ty += 4;
    ctx.font      = "bold 14px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#E65100';
    ctx.textAlign = 'right';
    ctx.fillText(`目标总奖励: $${totalBonus}`, lx + rw, ty); ty += 28;

    // Next day button
    const btnW = 200;
    const btnH = 42;
    const btnX = px + (pw - btnW) / 2;
    const btnY = py + ph - btnH - 20;
    this._btnNext = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.fillStyle   = '#4CAF50';
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth   = 2;
    _roundRect(ctx, btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font      = "bold 16px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('开始新的一天 ☀️', btnX + btnW / 2, btnY + 27);

    ctx.restore();
  }
}

function _hit(rect, mx, my) {
  return mx >= rect.x && mx <= rect.x + rect.w &&
         my >= rect.y && my <= rect.y + rect.h;
}
