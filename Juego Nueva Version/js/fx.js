/* ============================================================
   fx.js  —  Post-proceso cyberpunk: aberracion RGB, bloom,
   scanlines, glitch, ruido, viñeta, flash. Opera a 320x180.
   La corrupcion crece de Nivel 1 -> Nivel 6.
   ============================================================ */

const FX = {
  corruption: 0.05,
  glitch: 0,          // 0..1 intensidad temporal
  flash: null,        // { color, a }
  scanCanvas: null,
  tA: null, tB: null,
  W: CONFIG.W, H: CONFIG.H,

  init() {
    this.tA = this._mk(); this.tB = this._mk();
    this._buildScanlines();
  },
  _mk() {
    const c = document.createElement('canvas');
    c.width = this.W; c.height = this.H;
    return c;
  },
  _buildScanlines() {
    this.scanCanvas = this._mk();
    const g = this.scanCanvas.getContext('2d');
    g.clearRect(0, 0, this.W, this.H);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let y = 0; y < this.H; y += 2) g.fillRect(0, y, this.W, 1);
  },

  setCorruption(v) { this.corruption = U.clamp(v, 0, 1); },
  pulseGlitch(amount) { this.glitch = Math.min(1, this.glitch + amount); },
  doFlash(color, a) { this.flash = { color, a: a || 0.7 }; },

  _tint(src, canvas, r, g, b) {
    const c = canvas.getContext('2d');
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, this.W, this.H);
    c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = `rgb(${r},${g},${b})`;
    c.fillRect(0, 0, this.W, this.H);
    c.globalCompositeOperation = 'source-over';
    return canvas;
  },

  // src: canvas 320x180 con el mundo. out: ctx destino 320x180.
  render(src, out, dt) {
    const W = this.W, H = this.H;
    const corr = this.corruption;
    out.globalCompositeOperation = 'source-over';
    out.clearRect(0, 0, W, H);

    // --- Aberracion cromatica / RGB split ---
    const off = 0.4 + corr * 1.6 + this.glitch * 4;
    if (off > 0.6) {
      out.drawImage(src, 0, 0);
      out.globalCompositeOperation = 'screen';
      out.drawImage(this._tint(src, this.tA, 255, 0, 0), -off, 0);
      out.drawImage(this._tint(src, this.tB, 0, 255, 255), off, 0);
      out.globalCompositeOperation = 'source-over';
    } else {
      out.drawImage(src, 0, 0);
    }

    // --- Bloom ---
    if (out.canvas.getContext) {
      const tc = this.tA.getContext('2d');
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, W, H);
      tc.filter = 'blur(2px) brightness(1.35)';
      tc.drawImage(src, 0, 0);
      tc.filter = 'none';
      out.globalCompositeOperation = 'lighter';
      out.globalAlpha = 0.30;
      out.drawImage(this.tA, 0, 0);
      out.globalAlpha = 1;
      out.globalCompositeOperation = 'source-over';
    }

    // --- Glitch: bandas desplazadas ---
    if (this.glitch > 0.02) {
      const bands = 2 + Math.floor(this.glitch * 8);
      for (let i = 0; i < bands; i++) {
        const by = U.randi(0, H - 4);
        const bh = U.randi(2, 10);
        const dx = U.rand(-1, 1) * (3 + this.glitch * 14);
        out.drawImage(out.canvas, 0, by, W, bh, dx, by, W, bh);
      }
      // bloques de color
      if (Math.random() < this.glitch) {
        out.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          out.fillStyle = ['#ff00aa', '#00ffd5', '#ffe000'][U.randi(0, 2)];
          out.globalAlpha = 0.25;
          out.fillRect(U.randi(0, W), U.randi(0, H), U.randi(8, 40), U.randi(1, 4));
        }
        out.globalAlpha = 1;
        out.globalCompositeOperation = 'source-over';
      }
    }

    // --- Ruido estatico (segun corrupcion) ---
    const noiseAmt = corr * 0.5 + this.glitch * 0.5;
    if (noiseAmt > 0.03) {
      out.globalAlpha = noiseAmt * 0.12;
      for (let i = 0; i < 60 * noiseAmt; i++) {
        out.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#000000';
        out.fillRect(U.randi(0, W), U.randi(0, H), 1, 1);
      }
      out.globalAlpha = 1;
    }

    // --- Scanlines ---
    out.globalAlpha = 0.35 + corr * 0.3;
    out.drawImage(this.scanCanvas, 0, 0);
    out.globalAlpha = 1;

    // --- Viñeta ---
    const grd = out.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, `rgba(0,0,0,${0.45 + corr * 0.25})`);
    out.fillStyle = grd;
    out.fillRect(0, 0, W, H);

    // --- Flash ---
    if (this.flash) {
      out.globalAlpha = this.flash.a;
      out.fillStyle = this.flash.color;
      out.fillRect(0, 0, W, H);
      out.globalAlpha = 1;
      this.flash.a -= dt * 3.2;
      if (this.flash.a <= 0) this.flash = null;
    }

    // decae el glitch
    this.glitch = Math.max(0, this.glitch - dt * 1.6);
  },
};
