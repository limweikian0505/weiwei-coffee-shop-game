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
    this._toastText     = null;  // short toast message
    this._toastTimer    = 0;     // seconds remaining
  }

  /** Trigger the top streamer announcement banner. */
  showStreamerBanner(streamerName) {
    this._bannerText  = `⭐ 抖音主播驾到！${streamerName} 进入直播啦！`;
    this._bannerTimer = 4;
  }

  /**
   * Show a brief toast notification at the top of the canvas.
   * @param {string} text    - Toast text (should be in Chinese)
   * @param {number} [duration=2] - Display duration in seconds
   */
  showToast(text, duration = 2) {
    this._toastText  = text;
    this._toastTimer = duration;
  }

  /**
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (this._bannerTimer > 0) this._bannerTimer -= dt;
    if (this._toastTimer  > 0) this._toastTimer  -= dt;
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
    if (this._toastTimer > 0 && this._toastText) {
      this._renderToast(ctx, canvasWidth, canvasHeight);
    }
  }

  /**
   * Renders a brief semi-transparent pill notification at the top-centre.
   */
  _renderToast(ctx, canvasWidth, canvasHeight) {
    const alpha = Math.min(1, this._toastTimer);
    ctx.save();
    ctx.globalAlpha = alpha;

    const fontSize = Math.max(12, canvasWidth * 0.038);
    ctx.font = `bold ${fontSize}px 'Comic Sans MS', cursive`;
    const tw = ctx.measureText(this._toastText).width;
    const ph = fontSize + 14;
    const pw = tw + 28;
    const px = (canvasWidth - pw) / 2;
    const py = Math.max(50, canvasHeight * 0.08);

    // Dark pill background
    ctx.fillStyle = 'rgba(20,10,5,0.80)';
    _roundRect(ctx, px, py, pw, ph, ph / 2);
    ctx.fill();

    // Toast text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(this._toastText, canvasWidth / 2, py + ph * 0.68);

    ctx.restore();
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

