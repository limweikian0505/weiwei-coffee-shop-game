/**
 * AudioManager.js
 * Singleton that manages all sound effects and background music.
 * All audio generated programmatically via Web Audio API.
 */

class AudioManager {
  constructor() {
    this._ctx = null;
    this._musicGain = null;
    this._sfxVolume = 0.4;
    this._musicVolume = 0.08;
    this._musicGenerator = null;
    this._initialized = false;
  }

  /** Must be called on first user interaction to satisfy browser autoplay policy. */
  init() {
    if (this._initialized) return;
    this._initialized = true;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterSfxGain = this._ctx.createGain();
    this._masterSfxGain.gain.value = this._sfxVolume;
    this._masterSfxGain.connect(this._ctx.destination);
  }

  get ctx() { return this._ctx; }

  setMusicVolume(v) {
    this._musicVolume = v;
    if (this._musicGain) this._musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    this._sfxVolume = v;
    if (this._masterSfxGain) this._masterSfxGain.gain.value = v;
  }

  startMusic() {
    if (!this._initialized) return;
    if (this._musicGenerator) this._musicGenerator.start();
  }

  stopMusic() {
    if (this._musicGenerator) this._musicGenerator.stop();
  }

  /**
   * Play a named sound effect.
   * @param {string} soundName
   */
  play(soundName) {
    if (!this._initialized || !this._ctx) return;
    try {
      switch (soundName) {
        case 'door_chime':      this._doorChime(); break;
        case 'order_placed':    this._orderPlaced(); break;
        case 'coffee_ready':    this._coffeeReady(); break;
        case 'serve_success':   this._serveSuccess(); break;
        case 'money_received':  this._moneyReceived(); break;
        case 'customer_angry':  this._customerAngry(); break;
        case 'upgrade_buy':     this._upgradeBuy(); break;
        case 'five_stars':      this._fiveStars(); break;
        case 'new_day':         this._newDay(); break;
        case 'goal_complete':   this._goalComplete(); break;
        default: break;
      }
    } catch(e) { /* ignore audio errors */ }
  }

  // ── Private sound synthesizers ──────────────────────────────────────────────

  _makeOsc(type, freq, startT, endT, gainPeak = 0.3, gainEnd = 0) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startT);
    gain.gain.setValueAtTime(0, startT);
    gain.gain.linearRampToValueAtTime(gainPeak, startT + 0.02);
    gain.gain.linearRampToValueAtTime(gainEnd, endT);
    osc.connect(gain);
    gain.connect(this._masterSfxGain);
    osc.start(startT);
    osc.stop(endT + 0.05);
    return { osc, gain };
  }

  _doorChime() {
    const t = this._ctx.currentTime;
    this._makeOsc('sine', 1047, t,       t + 0.15, 0.25); // C6
    this._makeOsc('sine', 1319, t + 0.08, t + 0.22, 0.25); // E6
  }

  _orderPlaced() {
    const t = this._ctx.currentTime;
    this._makeOsc('sine', 523, t,        t + 0.07, 0.2); // C5
    this._makeOsc('sine', 659, t + 0.07, t + 0.14, 0.2); // E5
    this._makeOsc('sine', 784, t + 0.14, t + 0.22, 0.2); // G5
  }

  _coffeeReady() {
    const t = this._ctx.currentTime;
    this._makeOsc('sawtooth', 80, t, t + 0.3, 0.15, 0);
    this._makeOsc('sine', 440, t + 0.1, t + 0.3, 0.1, 0);
  }

  _serveSuccess() {
    const t = this._ctx.currentTime;
    this._makeOsc('sine', 784, t,        t + 0.12, 0.25); // G5
    this._makeOsc('sine', 1047, t + 0.1, t + 0.26, 0.25); // C6
  }

  _moneyReceived() {
    const t = this._ctx.currentTime;
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      this._makeOsc('sine', freq, t + i * 0.07, t + i * 0.07 + 0.1, 0.2);
    });
  }

  _customerAngry() {
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, t);      // G3
    osc.frequency.linearRampToValueAtTime(165, t + 0.3); // E3
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    osc.connect(gain);
    gain.connect(this._masterSfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  _upgradeBuy() {
    const t = this._ctx.currentTime;
    const notes = [262, 330, 392, 523]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      this._makeOsc('sine', freq, t + i * 0.1, t + i * 0.1 + 0.18, 0.25);
    });
  }

  _fiveStars() {
    const t = this._ctx.currentTime;
    const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      this._makeOsc('sine', freq, t + i * 0.1, t + i * 0.1 + 0.18, 0.3);
    });
  }

  _newDay() {
    const t = this._ctx.currentTime;
    const chord = [262, 330, 392]; // C4 E4 G4
    chord.forEach((freq) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
      gain.gain.linearRampToValueAtTime(0, t + 0.8);
      osc.connect(gain);
      gain.connect(this._masterSfxGain);
      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  _goalComplete() {
    const t = this._ctx.currentTime;
    const notes = [262, 330, 392, 523]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      this._makeOsc('sine', freq, t + i * 0.12, t + i * 0.12 + 0.2, 0.28);
    });
  }
}

export const audioManager = new AudioManager();
