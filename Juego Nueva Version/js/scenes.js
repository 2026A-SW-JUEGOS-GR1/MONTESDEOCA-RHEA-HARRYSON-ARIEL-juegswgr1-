/* ============================================================
   scenes.js  —  MenuScene, CutsceneScene, GameScene (+ HUD).
   ============================================================ */

/* Fuente de UI: pila con buen render a tamaño pequeño */
const UI_FONT = '"Consolas", "Courier New", monospace';

/* Todo el texto se dibuja en la capa de UI (resolucion completa, sin post-proceso)
   usando coordenadas base 320x180. Incluye contorno oscuro para legibilidad. */
function drawTextGlow(_ctx, text, x, y, size, color, align = 'center', glow = 6) {
  const ctx = (typeof Game !== 'undefined' && Game.uctx) ? Game.uctx : _ctx;
  ctx.font = `bold ${size}px ${UI_FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';

  // contorno oscuro (mejora contraste sobre fondos brillantes)
  ctx.shadowBlur = 0;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, size * 0.22);
  ctx.strokeStyle = 'rgba(2,4,12,0.92)';
  ctx.strokeText(text, x, y);

  // glow + relleno
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

/* ============================ MENU ============================ */
class MenuScene {
  constructor(game) { this.game = game; this.t = 0; this.sel = 0; }
  enter() { Audio2.startMusic('Q'); this.t = 0; Backdrop.init(); FX.setCorruption(0.15); }
  update(dt) {
    this.t += dt;
    if (Input.justDown('start')) { Audio2.sfx('select'); this.game.beginRun(); }
  }
  draw(ctx) {
    Backdrop.draw(ctx, LEVELS_META[3], this.t * 6, this.t);
    const W = CONFIG.W, H = CONFIG.H;

    // retratos
    const im = this.game.img.M, iq = this.game.img.Q;
    if (im && im.complete) { ctx.globalAlpha = 0.85; ctx.drawImage(im, 6, 44, 80, 60); ctx.globalAlpha = 1; }
    if (iq && iq.complete) { ctx.globalAlpha = 0.85; ctx.drawImage(iq, W - 92, 40, 86, 70); ctx.globalAlpha = 1; }

    // titulo
    const ttl = 'LORD-M // LORD-Q';
    drawTextGlow(ctx, ttl, W / 2 + 1, 26 + 1, 18, '#08111f', 'center', 0);
    drawTextGlow(ctx, ttl, W / 2, 26, 18, C.cyan, 'center', 10);
    drawTextGlow(ctx, 'FRACTURA DEL SISTEMA', W / 2, 42, 8, C.magenta, 'center', 6);

    if (Math.floor(this.t * 2) % 2 === 0)
      drawTextGlow(ctx, 'PULSA ENTER / SPACE', W / 2, H - 30, 9, C.white, 'center', 6);
    drawTextGlow(ctx, 'NEON GRID  ·  2D PIXEL CYBERPUNK', W / 2, H - 13, 7, C.cyan, 'center', 3);
  }
}

/* ========================== CUTSCENE ========================== */
class CutsceneScene {
  constructor(game, pages, onDone) { this.game = game; this.pages = pages; this.onDone = onDone; }
  enter() {
    this.i = 0; this.char = 0; this.t = 0; this.done = false; this.leaving = false;
    this._loadPage();
  }
  _loadPage() {
    const p = this.pages[this.i];
    this.full = (p.t + '\n' + p.s);
    this.char = 0; this.t = 0;
    FX.setCorruption(0.1 + (p.glitch || 0) * 0.7);
    if (p.glitch) { FX.pulseGlitch(p.glitch); Audio2.sfx('glitch'); }
  }
  update(dt) {
    this.t += dt;
    const p = this.pages[this.i];
    if (!p || this.leaving) return;
    const speed = 38;
    if (this.char < p.t.length + p.s.length) {
      this.char = Math.min(p.t.length + p.s.length, this.char + dt * speed);
      if (Math.random() < 0.3) Audio2.sfx('select');
    }
    if (p.glitch) FX.pulseGlitch(0.02 * p.glitch);
    if (Input.justDown('start')) {
      if (this.char < p.t.length + p.s.length) { this.char = p.t.length + p.s.length; }
      else if (this.i + 1 >= this.pages.length) {
        // No incrementar i (evita pages[i] undefined en draw) — salir con fade
        this.leaving = true;
        this.onDone();
      } else {
        this.i++;
        this._loadPage();
      }
    }
  }
  draw(ctx) {
    const W = CONFIG.W, H = CONFIG.H;
    ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, W, H);
    const p = this.pages[this.i];
    if (!p) return;

    // Pantalla de creditos: LORD-Q (izq) ♥ LORD-M (der)
    if (p.credits) {
      drawTextGlow(ctx, 'CREDITOS', W / 2, 16, 12, C.magenta, 'center', 8);
      const iq = this.game.img.Q3d, im = this.game.img.M3d;
      const pw = 88, ph = 100;
      const y = 28;
      if (iq && iq.complete) {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(iq, 28, y, pw, ph);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.green; ctx.lineWidth = 1;
        ctx.strokeRect(28, y, pw, ph);
      }
      if (im && im.complete) {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(im, W - 28 - pw, y, pw, ph);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 1;
        ctx.strokeRect(W - 28 - pw, y, pw, ph);
      }
      // corazon central
      const pulse = 1 + Math.sin(this.t * 4) * 0.08;
      drawTextGlow(ctx, '♥', W / 2, y + ph / 2, Math.floor(22 * pulse), C.magenta, 'center', 12);
      drawTextGlow(ctx, 'LORD-Q', 28 + pw / 2, y + ph + 10, 8, C.green, 'center', 4);
      drawTextGlow(ctx, 'LORD-M', W - 28 - pw / 2, y + ph + 10, 8, C.cyan, 'center', 4);
      drawTextGlow(ctx, p.s || 'Pulsa ENTER para volver al menu.', W / 2, H - 14, 8, C.white, 'center', 3);
      if (Math.floor(this.t * 2) % 2 === 0)
        drawTextGlow(ctx, '▶ ENTER', W - 30, H - 10, 7, C.steel2, 'center', 0);
      return;
    }

    // retrato
    if (p.portrait) {
      const im = p.portrait === 'M' ? this.game.img.M : this.game.img.Q;
      if (im && im.complete) {
        ctx.globalAlpha = 0.9;
        const w = 96, h = 76;
        ctx.drawImage(im, W / 2 - w / 2, 18, w, h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.portrait === 'M' ? C.cyan : C.green;
        ctx.lineWidth = 1; ctx.strokeRect(W / 2 - w / 2, 18, w, h);
      }
    }

    const tShown = Math.min(p.t.length, Math.floor(this.char));
    const sShown = Math.max(0, Math.floor(this.char) - p.t.length);
    drawTextGlow(ctx, p.t.slice(0, tShown), W / 2, p.portrait ? 108 : 70, 12,
      p.portrait === 'M' ? C.cyan : p.portrait === 'Q' ? C.green : C.magenta, 'center', 8);

    // subtitulo con ajuste de linea (en la capa de UI nitida)
    const u = Game.uctx;
    const sub = p.s.slice(0, sShown);
    u.font = `bold 9px ${UI_FONT}`; u.textAlign = 'center';
    const words = sub.split(' '); let line = ''; let yy = p.portrait ? 124 : 92; const maxW = W - 36;
    const emit = (txt) => {
      u.lineJoin = 'round'; u.lineWidth = 2; u.strokeStyle = 'rgba(2,4,12,0.92)';
      u.strokeText(txt, W / 2, yy);
      u.fillStyle = C.white; u.fillText(txt, W / 2, yy);
    };
    for (const wd of words) {
      const test = line + wd + ' ';
      if (u.measureText(test).width > maxW) { emit(line); line = wd + ' '; yy += 12; }
      else line = test;
    }
    emit(line);

    if (Math.floor(this.t * 2) % 2 === 0)
      drawTextGlow(ctx, '▶ ENTER', W - 30, H - 10, 7, C.steel2, 'center', 0);
  }
}

/* ============================ GAME ============================ */
class GameScene {
  constructor(game, levelKey) { this.game = game; this.levelKey = levelKey; }
  enter() {
    const data = LEVELS[this.levelKey]();
    this.data = data;
    this.charKey = data.char;
    this.grid = data.grid;
    this.cols = data.cols; this.rows = data.rows;
    this.meta = LEVELS_META[data.metaIndex];
    this.revealed = {};
    this.particles = new Particles();
    this.projectiles = [];
    this.enemies = [];
    this.memories = [];
    this.markers = [];
    this.shake = 0; this.camX = 0; this.camY = 0;
    this.t = 0; this.complete = false; this.completeT = 0;
    this._fadeStarted = false;
    this.toast = null; this.toastT = 0;
    this.bannerT = 4;
    this.exit = null;

    let sx = 2, sy = 2;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (this.grid[r][c] === 'S') { sx = c; sy = r; this.grid[r][c] = '.'; }
      if (this.grid[r][c] === 'D') { this.exit = { x: c * CONFIG.TILE, y: r * CONFIG.TILE }; }
    }
    this.player = new Player(this, sx * CONFIG.TILE, sy * CONFIG.TILE - 10, this.charKey);

    for (const e of data.enemies)
      this.enemies.push(new Enemy(this, e.type, e.col * CONFIG.TILE, e.row * CONFIG.TILE, e.opts || {}));
    for (const m of data.memories)
      this.memories.push(new Memory(m.col * CONFIG.TILE, m.row * CONFIG.TILE, m.text.slice(0, 9), m.text));
    for (const mk of (data.markers || []))
      this.markers.push(new HoloMarker(mk.col * CONFIG.TILE + 8, mk.row * CONFIG.TILE));

    Backdrop.init();
    FX.setCorruption(this.meta.corruption);
    // BGM: solo cambia si el mood es distinto (persiste al reiniciar/respawn)
    Audio2.startMusic(this.charKey);
  }

  /* ---- API de tiles ---- */
  tile(c, r) { if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return r >= this.rows ? '.' : '#'; return this.grid[r][c]; }
  setTile(c, r, ch) { if (this.grid[r] && this.grid[r][c] !== undefined) this.grid[r][c] = ch; }
  isSolidTile(c, r, liquid) {
    const ch = this.tile(c, r);
    if (ch === '#' || ch === 'B') return true;
    if (ch === '=') return !liquid;
    if (ch === '?') return !!this.revealed[c + ',' + r];
    return false;
  }
  isSolidPx(x, y, ignoreData) {
    const c = Math.floor(x / CONFIG.TILE), r = Math.floor(y / CONFIG.TILE);
    const ch = this.tile(c, r);
    if (ch === '#' || ch === 'B') return true;
    if (ch === '=') return !ignoreData;
    if (ch === '?') return !!this.revealed[c + ',' + r];
    return false;
  }

  addShake(n) { this.shake = Math.min(12, this.shake + n); }
  triggerScreenShake(intensity) { this.addShake(intensity); }

  meleeHit(x, y, w, h, dmg, kx) {
    const rr = { x, y, w, h };
    for (const e of this.enemies) if (!e.dead && U.rectsOverlap(rr, e.rect())) e.hurt(dmg, kx);
  }

  stackOverflow(x, y) {
    Audio2.sfx('ult'); this.triggerScreenShake(12); FX.doFlash('#ffffff', 0.85); FX.pulseGlitch(1);
    FX.setCorruption(Math.min(1, this.meta.corruption + 0.4));
    this.particles.burst(x, y, 60, { color: C.cyan, spMax: 5, life: 1, glow: true, size: 2, grav: 0.02 });
    this.particles.burst(x, y, 40, { color: C.magenta, spMax: 6, life: 1.1, glow: true, size: 2 });
    for (const e of this.enemies) if (!e.dead) e.hurt(10, U.sign(e.x - x) * 6);
  }

  doScan(x, y) {
    const R = 70;
    FX.pulseGlitch(0.05);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (this.grid[r][c] === '?') {
        const tx = c * CONFIG.TILE + 8, ty = r * CONFIG.TILE + 8;
        if (Math.hypot(tx - x, ty - y) < R + 30) {
          this.revealed[c + ',' + r] = true;
          this.particles.spawn({ x: tx, y: ty, vx: 0, vy: -0.4, life: 0.6, max: 0.6, color: C.cyan, size: 2, glow: true });
        }
      }
    }
    // registros de LORD-M (eco narrativo)
    this.particles.burst(x, y, 8, { color: C.cyan, spMax: 1, life: 0.5, glow: true, size: 1 });
  }

  onEnemyKilled(e) {
    if (this.charKey === 'M' && this.player) this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 14);
    if (e.type === 'purger') {
      this.toast = '!! NUCLEO DESPROTEGIDO — alcanza la salida'; this.toastT = 3.5;
      FX.doFlash(C.magenta, 0.4);
    }
  }

  _collectMemory(m) {
    if (m.collecting || m.taken) return;
    m.startCollect();
    Audio2.sfx('pickup');
    this.game.memories++;
    this.toast = m.text; this.toastT = 5;
    this.particles.burst(m.x + 5, m.y + 5, 18, { color: C.yellow, spMax: 2.5, life: 0.6, glow: true, size: 1 });
    FX.doFlash(C.yellow, 0.25);
  }

  _isCritical() {
    const p = this.player;
    return !p.dead && (p.hp <= 1 || p.hp / p.maxHp <= 0.25);
  }

  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 24);
    this.bannerT = Math.max(0, this.bannerT - dt);
    if (this.toastT > 0) this.toastT -= dt;

    if (this.complete) {
      this.completeT += dt;
      this.particles.update(dt);
      for (const m of this.memories) m.update(dt);
      for (const mk of this.markers) mk.update(dt);
      // tras mensaje breve: fade a negro y cambio de escena
      if (!this._fadeStarted && this.completeT > 0.5) {
        this._fadeStarted = true;
        this.game.fadeOut(() => this.game.levelDone());
      }
      return;
    }

    this.player.update(dt);

    // alarma vida critica
    if (this._isCritical()) Audio2.startCrit();
    else Audio2.stopCrit();

    // respawn por muerte (misma escena: BGM no se reinicia)
    if (this.player.dead && this.player.deathT > 1.5) {
      Audio2.stopCrit();
      this.player.hp = this.player.maxHp; this.player.dead = false; this.player.deathT = 0;
      this.player.x = this.player.spawnX; this.player.y = this.player.spawnY;
      this.player.vx = 0; this.player.vy = 0; this.player.invuln = 1.2;
      FX.doFlash(C.cyan, 0.3);
    }

    for (const e of this.enemies) if (!e.dead) e.update(dt);
    this.enemies = this.enemies.filter(e => !e.dead || e.type === 'never');

    for (const pr of this.projectiles) {
      pr.update(dt);
      if (pr.from === 'player') {
        for (const e of this.enemies) if (!e.dead && U.rectsOverlap(pr.rect(), e.rect())) { e.hurt(pr.dmg, pr.vx); pr.dead = true; }
      } else {
        if (!this.player.dead && U.rectsOverlap(pr.rect(), this.player.rect())) { this.player.hurt(pr.dmg, pr.x); pr.dead = true; }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);

    for (const m of this.memories) {
      m.update(dt);
      if (!m.taken && !m.collecting && U.rectsOverlap(m.rect(), this.player.rect())) this._collectMemory(m);
    }
    for (const mk of this.markers) mk.update(dt);

    const pr = this.player.rect();
    const c0 = Math.floor(pr.x / CONFIG.TILE), c1 = Math.floor((pr.x + pr.w) / CONFIG.TILE);
    const rr = Math.floor((pr.y + pr.h - 2) / CONFIG.TILE);
    for (let c = c0; c <= c1; c++) if (this.tile(c, rr) === '^') this.player.hurt(1, pr.x + pr.w / 2);

    if (this.exit && !this.complete) {
      const er = { x: this.exit.x - 4, y: this.exit.y - 8, w: 20, h: 28 };
      if (U.rectsOverlap(er, this.player.rect())) {
        this.complete = true; this.completeT = 0;
        Audio2.stopCrit();
        Audio2.sfx('pickup'); FX.doFlash(this.meta.accent, 0.5);
      }
    }

    this.particles.update(dt);

    const tx = this.player.x + this.player.w / 2 - CONFIG.W / 2;
    const ty = this.player.y + this.player.h / 2 - CONFIG.H / 2;
    this.camX = U.clamp(U.lerp(this.camX, tx, 0.12), 0, this.cols * CONFIG.TILE - CONFIG.W);
    this.camY = U.clamp(U.lerp(this.camY, ty, 0.12), 0, this.rows * CONFIG.TILE - CONFIG.H);
  }

  draw(ctx) {
    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    const camX = this.camX + sx, camY = this.camY + sy;

    Backdrop.draw(ctx, this.meta, camX, this.t);

    // tiles visibles
    const T = CONFIG.TILE;
    const c0 = Math.max(0, Math.floor(camX / T)), c1 = Math.min(this.cols - 1, Math.ceil((camX + CONFIG.W) / T));
    const r0 = Math.max(0, Math.floor(camY / T)), r1 = Math.min(this.rows - 1, Math.ceil((camY + CONFIG.H) / T));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const ch = this.grid[r][c];
      const x = c * T - camX, y = r * T - camY;
      if (ch === '#') Sprites.drawTile(ctx, x, y, T, this.meta.accent, FX.corruption);
      else if (ch === 'B') { Sprites.drawTile(ctx, x, y, T, C.amber, FX.corruption); px(ctx, x + 2, y + 2, T - 4, T - 4, '#3a2a10'); px(ctx, x + 5, y + 4, 6, T - 8, C.amber); }
      else if (ch === '=') { ctx.globalAlpha = 0.7 + Math.sin(this.t * 4 + c) * 0.15; px(ctx, x, y, T, T, '#0a2e3a'); px(ctx, x + 1, y, 1, T, C.cyan); px(ctx, x + T - 2, y, 1, T, C.cyan); for (let k = 0; k < 3; k++) px(ctx, x + 3 + k * 4, y + ((this.t * 20 + k * 5) % T), 1, 2, C.cyan); ctx.globalAlpha = 1; }
      else if (ch === '?') {
        if (this.revealed[c + ',' + r]) { px(ctx, x, y, T, 4, C.cyan); px(ctx, x, y, T, 1, '#fff'); ctx.globalAlpha = 0.3; px(ctx, x, y + 4, T, T - 4, '#0a2e3a'); ctx.globalAlpha = 1; }
        else { ctx.globalAlpha = 0.18 + Math.sin(this.t * 3 + c) * 0.06; ctx.strokeStyle = C.cyan; ctx.setLineDash([2, 2]); ctx.strokeRect(x + 1, y + 1, T - 2, T - 2); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      }
      else if (ch === '^') Sprites.drawHazard(ctx, x, y, T, this.t);
      else if (ch === 'T') { px(ctx, x + 3, y + 2, T - 6, T - 2, '#10204a'); px(ctx, x + 4, y + 3, T - 8, 5, this.meta.accent); ctx.globalAlpha = 0.6 + Math.sin(this.t * 5 + c) * 0.4; px(ctx, x + 5, y + 4, 2, 1, '#fff'); ctx.globalAlpha = 1; }
    }

    // salida
    if (this.exit) {
      const x = this.exit.x - camX, y = this.exit.y - camY;
      ctx.globalAlpha = 0.8 + Math.sin(this.t * 4) * 0.2;
      ctx.shadowColor = this.meta.accent; ctx.shadowBlur = 10;
      px(ctx, x, y - T, T, T * 2, '#06121f');
      px(ctx, x + 1, y - T + 1, T - 2, T * 2 - 2, this.meta.accent);
      px(ctx, x + 3, y - T + 3, T - 6, T * 2 - 6, '#06121f');
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      drawTextGlow(ctx, 'EXIT', x + T / 2, y - T - 4, 7, this.meta.accent, 'center', 4);
    }

    for (const m of this.memories) m.draw(ctx, camX, camY);
    for (const mk of this.markers) mk.draw(ctx, camX, camY);
    for (const e of this.enemies) if (!e.dead) e.draw(ctx, camX, camY);
    for (const pr of this.projectiles) pr.draw(ctx, camX, camY);
    this.player.draw(ctx, camX, camY);
    this.particles.draw(ctx, camX, camY);

    // overlay vida critica (pulso 0–30%)
    if (this._isCritical()) {
      const a = (Math.sin(this.t * 6) * 0.5 + 0.5) * 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = C.magenta;
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
      ctx.globalAlpha = 1;
    }

    this._drawHUD(ctx);

    if (this.complete) {
      ctx.globalAlpha = U.clamp(this.completeT * 1.2, 0, 0.7); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CONFIG.W, CONFIG.H); ctx.globalAlpha = 1;
      drawTextGlow(ctx, 'SECTOR COMPLETADO', CONFIG.W / 2, CONFIG.H / 2, 12, this.meta.accent, 'center', 10);
    }
  }

  _drawHUD(ctx) {
    const p = this.player;
    // vida (segmentos)
    for (let i = 0; i < p.maxHp; i++) {
      const on = i < p.hp;
      px(ctx, 6 + i * 7, 6, 5, 5, on ? (this.charKey === 'M' ? C.red : C.green) : '#2a2030');
      if (on) { px(ctx, 6 + i * 7, 6, 5, 1, '#fff'); }
    }
    // energia / ultimate (M) o cooldowns (Q)
    if (this.charKey === 'M') {
      px(ctx, 6, 14, 70, 4, '#10142a');
      px(ctx, 6, 14, 70 * (p.energy / p.maxEnergy), 4, p.energy >= p.maxEnergy ? C.magenta : C.cyan);
      if (p.energy >= p.maxEnergy && Math.floor(this.t * 4) % 2 === 0)
        drawTextGlow(ctx, 'ULT LISTO', 82, 16, 7, C.magenta, 'left', 4);
      // Controles LORD-M (mismo estilo de teclas que Q)
      const mKeys = [
        { key: 'J', ready: p.shootCD <= 0, color: C.cyan },      // disparo
        { key: 'U', ready: p.heavyTime <= 0, color: C.yellow },   // pesado
        { key: 'I', ready: p.energy >= p.maxEnergy, color: C.magenta }, // ultimate
        { key: 'L', ready: p.dashCD <= 0, color: C.cyan },        // dash
      ];
      mKeys.forEach((b, i) => {
        const x = 6 + i * 18;
        px(ctx, x, 21, 15, 5, '#10142a');
        px(ctx, x, 21, 15, 5, b.ready ? b.color : '#1a1a28');
        drawTextGlow(ctx, b.key, x + 7, 29, 6, C.white, 'center', 0);
      });
    } else {
      // Barras de cooldown tipo terminal: F fase liquida (cian), R escaner, E rebobinado (magenta)
      const bars = [
        { key: 'F', cd: p.liquidCD, max: CONFIG.LIQUID_CD_MAX, color: C.cyan },
        { key: 'R', cd: p.scanCD, max: CONFIG.SCAN_CD_MAX, color: C.neon },
        { key: 'E', cd: p.rewindCD, max: CONFIG.REWIND_CD_MAX, color: C.magenta },
      ];
      bars.forEach((b, i) => {
        const x = 6 + i * 24;
        const fill = b.cd <= 0 ? 1 : U.clamp(1 - b.cd / b.max, 0, 1);
        px(ctx, x, 14, 20, 5, '#10142a');
        px(ctx, x, 14, 20 * fill, 5, b.color);
        drawTextGlow(ctx, b.key, x + 10, 22, 6, fill >= 1 ? b.color : '#555', 'center', 0);
      });
    }

    // memorias
    drawTextGlow(ctx, 'MEM ' + this.game.memories + '/' + CONFIG.TOTAL_MEMORIES, CONFIG.W - 6, 8, 8, C.yellow, 'right', 4);
    // nombre nivel
    drawTextGlow(ctx, this.meta.name, CONFIG.W - 6, 18, 7, this.meta.accent, 'right', 3);

    // banner objetivo
    if (this.bannerT > 0) {
      const a = U.clamp(this.bannerT, 0, 1);
      ctx.globalAlpha = a;
      px(ctx, 0, CONFIG.H / 2 - 17, CONFIG.W, 34, 'rgba(4,6,16,0.78)');
      ctx.globalAlpha = 1;
      Game.uctx.globalAlpha = a;
      drawTextGlow(ctx, this.meta.name, CONFIG.W / 2, CONFIG.H / 2 - 6, 12, this.meta.accent, 'center', 8);
      drawTextGlow(ctx, this.data.objective, CONFIG.W / 2, CONFIG.H / 2 + 8, 8, C.white, 'center', 2);
      Game.uctx.globalAlpha = 1;
    }

    // toast (memoria / aviso): caja en el mundo, texto en capa de UI nitida
    if (this.toastT > 0) {
      const u = Game.uctx;
      const alpha = U.clamp(this.toastT, 0, 1);
      u.font = `bold 8px ${UI_FONT}`; u.textAlign = 'center';
      const words = this.toast.split(' '); let line = ''; let lines = []; const maxW = CONFIG.W - 28;
      for (const wd of words) { const test = line + wd + ' '; if (u.measureText(test).width > maxW) { lines.push(line); line = wd + ' '; } else line = test; }
      lines.push(line);
      const lineH = 10;
      const boxH = lines.length * lineH + 8;
      const top = CONFIG.H - boxH - 6;
      ctx.globalAlpha = alpha;
      px(ctx, 10, top, CONFIG.W - 20, boxH, 'rgba(4,8,20,0.9)');
      px(ctx, 10, top, 2, boxH, C.yellow);
      ctx.globalAlpha = 1;
      u.globalAlpha = alpha;
      lines.forEach((l, i) => {
        const yy = top + 8 + i * lineH;
        u.lineJoin = 'round'; u.lineWidth = 2; u.strokeStyle = 'rgba(2,4,12,0.92)';
        u.strokeText(l.trim(), CONFIG.W / 2, yy);
        u.fillStyle = C.white; u.fillText(l.trim(), CONFIG.W / 2, yy);
      });
      u.globalAlpha = 1;
    }

    // hint controles abajo (primeros segundos)
    if (this.t < 8) {
      Game.uctx.globalAlpha = U.clamp(8 - this.t, 0, 1) * 0.9;
      drawTextGlow(ctx, this.data.hint, CONFIG.W / 2, CONFIG.H - 5, 7, C.cyan, 'center', 3);
      Game.uctx.globalAlpha = 1;
    }
  }
}
