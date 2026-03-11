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
    ctx.save();
    ctx.font = "bold 13px 'Comic Sans MS', cursive";
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';

    const timeLeft = Math.ceil(this.getTimeLeft());
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    let phaseEmoji = '☀️';
    if (this.phase === 'DUSK')    phaseEmoji = '🌅';
    if (this.phase === 'CLOSING') phaseEmoji = '🌙';
    if (this.phase === 'SUMMARY') phaseEmoji = '🌙';

    ctx.fillText(`第${this.dayNumber}天 ${phaseEmoji} ${timeStr}`, 14, H - 58);
    ctx.restore();
  }
}
