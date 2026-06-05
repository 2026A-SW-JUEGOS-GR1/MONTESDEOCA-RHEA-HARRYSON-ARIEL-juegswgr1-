/* ====================================================================
   AudioManager.js  -  Audio 100% procedural (Web Audio API)
   Genera musica de fondo en loop + efectos de sonido sin archivos.
   ==================================================================== */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.droneNodes = [];
    this.musicStep = 0;
    this.muted = false;
  }

  _ac() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /* Tono basico con envolvente */
  _blip(freq, dur, type = 'square', vol = 0.2, when = 0) {
    if (this.muted) return;
    const ctx = this._ac();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  /* ---------------- Efectos de sonido ---------------- */
  playClick() {
    this._blip(430, 0.07, 'square', 0.16);
    this._blip(640, 0.06, 'square', 0.12, 0.04);
  }

  playPickup() {
    this._blip(660, 0.08, 'square', 0.18);
    this._blip(880, 0.09, 'square', 0.18, 0.07);
    this._blip(1175, 0.12, 'square', 0.16, 0.14);
  }

  playDamage() {
    if (this.muted) return;
    const ctx = this._ac();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.3);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.34);
  }

  playUnlock() {
    [523, 659, 784, 1047].forEach((f, i) => this._blip(f, 0.18, 'triangle', 0.2, i * 0.09));
  }

  playWin() {
    const seq = [523, 659, 784, 1047, 1319];
    seq.forEach((f, i) => this._blip(f, 0.22, 'square', 0.2, i * 0.13));
    this._blip(1568, 0.5, 'triangle', 0.18, seq.length * 0.13);
  }

  playLose() {
    const seq = [392, 330, 262, 196];
    seq.forEach((f, i) => this._blip(f, 0.3, 'sawtooth', 0.18, i * 0.18));
  }

  /* ---------------- Musica de fondo (loop) ---------------- */
  startMusic() {
    if (this.musicTimer || this.muted) return;
    const ctx = this._ac();
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.5);
    this.musicGain.connect(ctx.destination);

    // Drone grave continuo (ambiente de laboratorio)
    [55, 82.41].forEach((f) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      g.gain.value = 0.05;
      o.connect(g).connect(this.musicGain);
      o.start();
      this.droneNodes.push(o);
    });

    // Arpegio lento en bucle
    const scale = [220, 261.63, 329.63, 392, 329.63, 261.63];
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      const f = scale[this.musicStep % scale.length];
      this._pad(f);
      if (this.musicStep % 6 === 0) this._pad(f / 2, 0.9);
      this.musicStep++;
    }, 620);
  }

  _pad(freq, mult = 1) {
    if (!this.musicGain) return;
    const ctx = this._ac();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05 * mult, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.66);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.droneNodes.forEach((o) => { try { o.stop(); } catch (e) {} });
    this.droneNodes = [];
    if (this.musicGain && this.ctx) {
      try { this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4); } catch (e) {}
      this.musicGain = null;
    }
  }
}

/* Instancia global compartida por todas las escenas */
const audioManager = new AudioManager();
window.audioManager = audioManager;
