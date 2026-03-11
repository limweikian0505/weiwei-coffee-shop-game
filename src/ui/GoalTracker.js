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

    const pw   = 210;
    const lineH = 22;
    const ph   = 36 + goals.length * lineH + 8;
    const px   = W - pw - 10;
    const py   = 60;

    ctx.save();

    // Panel
    ctx.fillStyle   = 'rgba(61,31,0,0.82)';
    ctx.strokeStyle = '#D4A96A';
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, px, py, pw, ph, 10);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.font      = "bold 12px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 今日目标', px + pw / 2, py + 18);

    // Goals
    ctx.textAlign = 'left';
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      const gy   = py + 32 + i * lineH;
      const done = goal.completed || goal.check(stats);

      ctx.font      = "11px 'Comic Sans MS', cursive";
      ctx.fillStyle = done ? '#66BB6A' : '#FFF';
      const icon    = done ? '✅' : '🔲';

      let progressStr = '';
      if (!done && goal.id !== 'no_angry') {
        progressStr = ` (${goal.getProgress(stats)}/${goal.target})`;
      } else if (goal.id === 'no_angry') {
        progressStr = done ? '' : ` (${stats.angryLeaves}次)`;
      }
      ctx.fillText(`${icon} ${goal.desc}${progressStr}`, px + 8, gy);
    }

    ctx.restore();
  }
}
