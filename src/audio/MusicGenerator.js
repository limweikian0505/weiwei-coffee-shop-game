/**
 * MusicGenerator.js
 * Generates looping cafe jazz background music using Web Audio API.
 * Chord progression: Cmaj7 → Am7 → Fmaj7 → G7 (C major, BPM=120)
 */

export class MusicGenerator {
  constructor(audioCtx) {
    this._ctx = audioCtx;
    this._isPlaying = false;
    this._gainNode = null;
    this._nextNoteTime = 0;
    this._scheduleAheadTime = 0.2;
    this._lookahead = 25; // ms
    this._timerID = null;
    this._beatTime = 0.5; // 120 BPM = 0.5s per beat
    this._currentBeat = 0;

    // Chord progression: [Cmaj7, Am7, Fmaj7, G7]
    // Each chord = 4 beats
    this._chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7: C4 E4 G4 B4
      [220.00, 261.63, 329.63, 392.00], // Am7: A3 C4 E4 G4
      [174.61, 220.00, 261.63, 329.63], // Fmaj7: F3 A3 C4 E4
      [196.00, 246.94, 293.66, 349.23], // G7: G3 B3 D4 F4
    ];
    this._totalBeats = this._chords.length * 4; // 16 beats total
  }

  start() {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this._gainNode = this._ctx.createGain();
    this._gainNode.gain.value = 0.06;

    // Light delay/reverb effect
    const delay = this._ctx.createDelay(0.5);
    delay.delayTime.value = 0.15;
    const delayGain = this._ctx.createGain();
    delayGain.gain.value = 0.2;
    this._gainNode.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this._gainNode);
    this._gainNode.connect(this._ctx.destination);

    this._nextNoteTime = this._ctx.currentTime + 0.1;
    this._currentBeat = 0;
    this._timerID = setInterval(() => this._scheduler(), this._lookahead);
  }

  stop() {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    if (this._timerID) {
      clearInterval(this._timerID);
      this._timerID = null;
    }
    if (this._gainNode) {
      this._gainNode.gain.linearRampToValueAtTime(0, this._ctx.currentTime + 0.5);
    }
  }

  _scheduler() {
    while (this._nextNoteTime < this._ctx.currentTime + this._scheduleAheadTime) {
      this._scheduleNote(this._nextNoteTime);
      this._nextNoteTime += this._beatTime;
      this._currentBeat = (this._currentBeat + 1) % this._totalBeats;
    }
  }

  _scheduleNote(time) {
    // Which chord are we on? (every 4 beats)
    const chordIndex = Math.floor(this._currentBeat / 4) % this._chords.length;
    const chord = this._chords[chordIndex];
    const beatInChord = this._currentBeat % 4;

    // On beat 0 of each chord: play whole chord (arpeggiated slightly)
    if (beatInChord === 0) {
      chord.forEach((freq, i) => {
        this._playNote(freq, time + i * 0.04, 0.35, 0.05);
      });
    }
    // On beat 2: play bass note
    if (beatInChord === 2) {
      this._playNote(chord[0] / 2, time, 0.45, 0.04);
    }
  }

  _playNote(freq, time, duration, gain = 0.05) {
    const osc = this._ctx.createOscillator();
    const gainNode = this._ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gain, time + 0.03);
    gainNode.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(gainNode);
    gainNode.connect(this._gainNode);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}
