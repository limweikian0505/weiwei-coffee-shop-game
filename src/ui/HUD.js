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
    // Landscape: shorter HUD bar — use ~8% of height but cap lower
    const hudH = Math.max(50, canvasHeight * 0.10);
    const hudY = canvasHeight - hudH;

    ctx.save();

    ctx.fillStyle = 'rgba(61,31,0,0.92)';
    _roundRect(ctx, 0, hudY, canvasWidth, hudH, 0);
    ctx.fill();

    // Instruction line — smaller in landscape
    const instrFont = Math.max(9, canvasWidth * 0.018);
    ctx.font      = `${instrFont}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD180';
    ctx.textAlign = 'center';
    ctx.fillText('💡 点击等待中的客人来接单', canvasWidth / 2, hudY - 5);

    // Money — left side
    const moneyFont = Math.max(14, canvasHeight * 0.065);
    ctx.font      = `bold ${moneyFont}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 $${this.economySystem.money}`, 14, hudY + hudH * 0.68);

    // Title — center
    const titleFont = Math.max(12, canvasHeight * 0.05);
    ctx.font      = `bold ${titleFont}px 'Comic Sans MS', cursive`;
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('微微咖啡馆', canvasWidth / 2, hudY + hudH * 0.68);

    ctx.restore();

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

