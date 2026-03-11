/**
 * GoalTracker.js
 * Top-right semi-transparent panel showing daily goals.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class GoalTracker {
  constructor(goalSystem) {
    this.goalSystem = goalSystem;
  }

  render(ctx, W, H) {
    const goals = this.goalSystem.getDailyGoals();
    const stats = this.goalSystem.getStats();
    if (!goals.length) return;

    // Landscape: smaller, top-left, compact
    const pw    = Math.min(180, W * 0.22);
    const lineH = 18;
    const ph    = 28 + goals.length * lineH + 6;
    const px    = 10;
    const py    = 8;

    ctx.save();

    ctx.fillStyle   = 'rgba(61,31,0,0.82)';
    ctx.strokeStyle = '#D4A96A';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, px, py, pw, ph, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font      = `bold ${Math.max(10, W * 0.013)}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 今日目标', px + pw / 2, py + 14);

    ctx.textAlign = 'left';
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const gy   = py + 24 + i * lineH;
      const done = goal.completed || goal.check(stats);

      ctx.font      = `${Math.max(9, W * 0.011)}px 'Comic Sans MS', cursive`;
      ctx.fillStyle = done ? '#66BB6A' : '#FFF';
      const icon    = done ? '✅' : '🔲';

      let progressStr = '';
      if (!done && goal.id !== 'no_angry') {
        progressStr = ` (${goal.getProgress(stats)}/${goal.target})`;
      } else if (goal.id === 'no_angry') {
        progressStr = done ? '' : ` (${stats.angryLeaves}次)`;
      }
      ctx.fillText(`${icon} ${goal.desc}${progressStr}`, px + 6, gy);
    }

    ctx.restore();
  }
}
