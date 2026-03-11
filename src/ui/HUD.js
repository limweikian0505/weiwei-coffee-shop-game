/**
 * HUD.js
 * Renders the bottom HUD bar that always shows money, game title, and phase info.
 * Also renders the top streamer announcement banner when active.
 *
 * All sizes are adaptive so the HUD is finger-friendly on mobile screens.
 */

import { roundRect as _roundRect } from '../utils/drawUtils.js';

export class HUD {
  /**
   * @param {EconomySystem} economySystem
   */
  constructor(economySystem) {
    this.economySystem  = economySystem;
    this._bannerText    = null;  // e.g. "⭐ 抖音主播驾到！桑杰 进入直播啦！"
    this._bannerTimer   = 0;     // seconds remaining
  }

  /** Trigger the top streamer announcement banner. */
  showStreamerBanner(streamerName) {
    this._bannerText  = `⭐ 抖音主播驾到！${streamerName} 进入直播啦！`;
    this._bannerTimer = 4;
  }

  /**
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (this._bannerTimer > 0) this._bannerTimer -= dt;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  render(ctx, canvasWidth, canvasHeight) {
    // Adaptive HUD height: at least 70px but grows on larger/taller screens
    const hudH  = Math.max(70, canvasHeight * 0.10);
    const hudY  = canvasHeight - hudH;

    // Adaptive font sizes (clamped for readability on all screen sizes)
    const moneyFontSize = Math.max(18, canvasWidth * 0.045);
    const labelFontSize = Math.max(14, canvasWidth * 0.035);
    const hintFontSize  = Math.max(12, canvasWidth * 0.025);

    ctx.save();

    // ── HUD background ────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(61,31,0,0.92)';
    _roundRect(ctx, 0, hudY, canvasWidth, hudH, 0);
    ctx.fill();

    // ── Instruction line ──────────────────────────────────────────────────────
    ctx.font      = `${hintFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD180';
    ctx.textAlign = 'center';
    ctx.fillText('💡 点击等待中的客人来接单', canvasWidth / 2, hudY - 8);

    // ── Money ─────────────────────────────────────────────────────────────────
    ctx.font      = `bold ${moneyFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 $${this.economySystem.money}`, 18, hudY + hudH * 0.65);

    // ── Title ─────────────────────────────────────────────────────────────────
    ctx.font      = `bold ${labelFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('微微咖啡馆', canvasWidth / 2, hudY + hudH * 0.65);

    // ── Phase label ───────────────────────────────────────────────────────────
    ctx.font      = `${hintFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#999';
    ctx.textAlign = 'right';
    ctx.fillText('Phase 1 · MVP', canvasWidth - 14, hudY + hudH * 0.65);

    ctx.restore();

    // ── Streamer banner ───────────────────────────────────────────────────────
    if (this._bannerTimer > 0 && this._bannerText) {
      this._renderBanner(ctx, canvasWidth);
    }
  }

  _renderBanner(ctx, canvasWidth) {
    const alpha = Math.min(1, this._bannerTimer);
    ctx.save();
    ctx.globalAlpha = alpha;

    const bh = 36;
    const by = 8;

    // Background
    ctx.fillStyle = 'rgba(255,60,60,0.88)';
    _roundRect(ctx, 40, by, canvasWidth - 80, bh, 10);
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 2;
    _roundRect(ctx, 40, by, canvasWidth - 80, bh, 10);
    ctx.stroke();

    const bannerFontSize = Math.max(13, canvasWidth * 0.028);
    ctx.font      = `bold ${bannerFontSize}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(this._bannerText, canvasWidth / 2, by + 24);

    ctx.restore();
  }
}

