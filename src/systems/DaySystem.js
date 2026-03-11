/**
 * DaySystem.js
 * Tracks the current day number and time-of-day phase.
 * Each day = 180 real seconds. Phases: DAY → DUSK → CLOSING → SUMMARY
 */
import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class DaySystem {
  constructor() {
    this.dayNumber  = 1;
    this.dayDuration = 180; // seconds
    this.dayTimer    = 0;
    this.phase       = 'DAY'; // DAY | DUSK | CLOSING | SUMMARY
    this.duskStart   = 150;   // last 30 seconds = dusk
    this.onDayEnd    = null;  // callback when phase becomes SUMMARY
    this._summaryTriggered = false;
  }

  update(dt) {
    if (this.phase === 'SUMMARY') return;

    this.dayTimer += dt;

    if (this.dayTimer >= this.dayDuration && this.phase !== 'CLOSING' && this.phase !== 'SUMMARY') {
      this.phase = 'CLOSING';
    } else if (this.dayTimer >= this.duskStart && this.phase === 'DAY') {
      this.phase = 'DUSK';
    }
  }

  /** Called by Game when all customers have left during CLOSING. */
  triggerSummary() {
    if (this.phase === 'CLOSING' && !this._summaryTriggered) {
      this._summaryTriggered = true;
      this.phase = 'SUMMARY';
      if (this.onDayEnd) this.onDayEnd();
    }
  }

  /** Can new customers spawn? */
  canSpawn() {
    return this.phase === 'DAY' || this.phase === 'DUSK';
  }

  /** Overlay tint color for dusk / closing (null = none). */
  getSkyTint() {
    if (this.phase === 'DUSK')    return 'rgba(255,140,0,0.25)';
    if (this.phase === 'CLOSING') return 'rgba(200,80,0,0.35)';
    return null;
  }

  /** Start the next day. Called after DaySummary is dismissed. */
  startNewDay() {
    this.dayNumber++;
    this.dayTimer  = 0;
    this.phase     = 'DAY';
    this._summaryTriggered = false;
  }

  /** Remaining seconds display. */
  getTimeLeft() {
    return Math.max(0, this.dayDuration - this.dayTimer);
  }

  render(ctx, W, H) {
    if (this.phase === 'SUMMARY') return;

    ctx.save();

    const isLandscape = W > H;
    const fontSize    = Math.max(11, (isLandscape ? H : W) * 0.032);
    const timeLeft    = Math.ceil(this.getTimeLeft());
    const mm  = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const ss  = String(timeLeft % 60).padStart(2, '0');

    const label = this.phase === 'CLOSING' ? '🔔 打烊中…' : `⏰ 第 ${this.dayNumber} 天  ${mm}:${ss}`;
    const color = this.phase === 'CLOSING' ? '#EF5350' : '#FFF';

    // In landscape: place timer top-center with small size
    const ty = isLandscape ? Math.max(18, H * 0.08) : 90;
    ctx.font      = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2 + 1, ty + 1);
    ctx.fillStyle = color;
    ctx.fillText(label, W / 2, ty);

    ctx.restore();
  }
}
