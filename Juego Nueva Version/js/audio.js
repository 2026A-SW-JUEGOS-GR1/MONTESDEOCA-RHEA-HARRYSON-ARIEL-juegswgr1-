/* ============================================================
   audio.js  —  Motor synthwave / industrial procedural (WebAudio).
   Dos estados de animo: 'M' (intenso, pesado) y 'Q' (atmosferico).
   Mas SFX procedurales. Sin archivos externos.
   ============================================================ */

const Audio2 = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  muted: false,
  mood: null,
  _seqTimer: null,
  _step: 0,
  critPlaying: false,
  _critTimer: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.45;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.master);
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  },

  // ---------- SFX helpers ----------
  _osc(type, freq, t0, dur, gain, dest) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  },
  _noise(t0, dur, gain, filterFreq) {
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = filterFreq || 1200; f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t0); src.stop(t0 + dur);
  },

  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump':   this._osc('square', 320, t, 0.18, 0.18); this._osc('square', 540, t + 0.05, 0.12, 0.12); break;
      case 'djump':  this._osc('sawtooth', 460, t, 0.16, 0.16); this._osc('square', 760, t + 0.04, 0.12, 0.1); break;
      case 'dash':   this._noise(t, 0.22, 0.35, 2600); this._osc('sawtooth', 880, t, 0.14, 0.16); break;
      case 'shoot':  this._osc('square', 900, t, 0.08, 0.16); this._osc('sawtooth', 500, t + 0.01, 0.1, 0.12); break;
      case 'heavy':  this._osc('sawtooth', 140, t, 0.3, 0.3); this._noise(t, 0.3, 0.25, 800); break;
      case 'hit':    this._noise(t, 0.18, 0.4, 600); this._osc('square', 120, t, 0.18, 0.25); break;
      case 'explo':  this._noise(t, 0.7, 0.5, 400); this._osc('sawtooth', 90, t, 0.6, 0.3); break;
      case 'ult':    this._osc('sawtooth', 60, t, 1.2, 0.4); this._noise(t, 1.2, 0.5, 500);
                     for (let i = 0; i < 8; i++) this._osc('square', 200 + i * 120, t + i * 0.05, 0.3, 0.08); break;
      case 'pickup': this._osc('square', 880, t, 0.04, 0.22); this._osc('triangle', 1200, t + 0.04, 0.08, 0.16); this._noise(t, 0.06, 0.12, 3500); break;
      case 'scan':   this._osc('sine', 500, t, 0.5, 0.12); this._osc('sine', 760, t + 0.1, 0.4, 0.1); break;
      case 'liquid': this._osc('sine', 300, t, 0.4, 0.18); this._noise(t, 0.4, 0.18, 1800); break;
      case 'rewind': for (let i = 0; i < 10; i++) this._osc('triangle', 900 - i * 70, t + i * 0.03, 0.12, 0.1); break;
      case 'hurt':   this._osc('sawtooth', 220, t, 0.25, 0.25); this._osc('square', 110, t + 0.04, 0.2, 0.2); break;
      case 'death':  this._osc('sawtooth', 200, t, 0.9, 0.3); this._osc('sawtooth', 90, t + 0.1, 0.9, 0.3); this._noise(t, 0.9, 0.3, 500); break;
      case 'select': this._osc('square', 600, t, 0.06, 0.16); break;
      case 'glitch': this._noise(t, 0.12, 0.3, 3000); break;
      case 'crit':   this._noise(t, 0.12, 0.18, 900); this._osc('sine', 55, t, 0.18, 0.12); break;
    }
  },

  /** Latido de estatica en loop (vida critica). */
  startCrit() {
    if (this.critPlaying || !this.ctx) return;
    this.critPlaying = true;
    this._critTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      this.sfx('crit');
    }, 480);
  },
  stopCrit() {
    this.critPlaying = false;
    if (this._critTimer) { clearInterval(this._critTimer); this._critTimer = null; }
  },

  // ---------- Musica secuenciada ----------
  // Persiste entre reinicios de escena si el mood no cambia (no cortar BGM al morir/respawnear).
  startMusic(mood) {
    if (!this.ctx) return;
    if (this.mood === mood && this._seqTimer) return; // ya suena: no reiniciar
    this.stopMusic();
    this.mood = mood;
    this._step = 0;
    const bpm = mood === 'M' ? 140 : 84;
    const stepDur = 60 / bpm / 2;
    this._seqTimer = setInterval(() => this._tick(mood), stepDur * 1000);
  },
  stopMusic() {
    if (this._seqTimer) { clearInterval(this._seqTimer); this._seqTimer = null; }
    this.mood = null;
  },

  _tick(mood) {
    if (!this.ctx || this.muted) { this._step++; return; }
    const t = this.ctx.currentTime + 0.02;
    const s = this._step % 16;

    if (mood === 'M') {
      const bass = [55, 55, 82.4, 55, 73.4, 55, 49, 65.4];
      const bf = bass[s % bass.length];
      this._osc('sawtooth', bf, t, 0.14, 0.22, this.musicGain);
      this._osc('sawtooth', bf * 1.005, t, 0.14, 0.16, this.musicGain);
      if (s % 4 === 0) this._noise(t, 0.12, 0.18, 180);
      if (s % 4 === 2) this._noise(t, 0.06, 0.14, 4000);
      if (s % 8 === 4) this._noise(t, 0.18, 0.16, 1200);
      const arp = [440, 523, 659, 880, 659, 523, 587, 440];
      this._osc('square', arp[s % arp.length], t, 0.1, 0.06, this.musicGain);
    } else {
      const pad = [196, 220, 261.6, 174.6];
      const pf = pad[Math.floor(this._step / 8) % pad.length];
      if (s % 8 === 0) {
        this._osc('sine', pf, t, 1.6, 0.12, this.musicGain);
        this._osc('sine', pf * 1.5, t, 1.6, 0.07, this.musicGain);
        this._osc('triangle', pf * 2, t, 1.6, 0.05, this.musicGain);
      }
      const mel = [523, 0, 587, 0, 659, 0, 494, 0, 440, 0, 392, 0, 0, 0, 0, 0];
      const mf = mel[s];
      if (mf) this._osc('triangle', mf, t, 0.6, 0.08, this.musicGain);
      if (s % 8 === 0) this._noise(t, 0.1, 0.06, 220);
    }
    this._step++;
  },
};
