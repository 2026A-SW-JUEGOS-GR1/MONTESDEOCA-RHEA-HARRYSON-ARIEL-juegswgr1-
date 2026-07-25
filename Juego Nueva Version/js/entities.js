/* ============================================================
   entities.js  —  Player (LORD-M / LORD-Q), Projectiles,
   Enemies, Boss, Particles, Memory pickups.
   ============================================================ */

/* -------------------- Particulas -------------------- */
class Particles {
  constructor() { this.list = []; }
  spawn(o) {
    this.list.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, life: 0.5, max: 0.5,
      size: 1, color: '#fff', grav: 0, glow: false, fade: true,
    }, o));
  }
  burst(x, y, n, opts) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = U.rand(opts.spMin || 0.5, opts.spMax || 2.5);
      this.spawn(Object.assign({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: U.rand(0.25, opts.life || 0.6),
      }, opts, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }));
    }
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.grav;
      p.life -= dt;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  }
  draw(ctx, camX, camY) {
    for (const p of this.list) {
      const a = p.fade ? U.clamp(p.life / p.max, 0, 1) : 1;
      ctx.globalAlpha = a;
      if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 6; }
      px(ctx, p.x - camX, p.y - camY, p.size, p.size, p.color);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
}

/* -------------------- Proyectiles -------------------- */
class Projectile {
  constructor(scene, x, y, dir, opts) {
    this.scene = scene; this.x = x; this.y = y;
    this.w = opts.w || 5; this.h = opts.h || 3;
    this.vx = dir * (opts.speed || 5); this.vy = opts.vy || 0;
    this.dmg = opts.dmg || 1; this.from = opts.from || 'player';
    this.color = opts.color || C.cyan; this.life = opts.life || 2.2;
    this.dead = false; this.t = 0;
  }
  update(dt) {
    this.t += dt;
    this.x += this.vx * CONFIG.PROJ_SPEED; this.y += this.vy * CONFIG.PROJ_SPEED;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    // colision con tiles solidos
    if (this.scene.isSolidPx(this.x + this.w / 2, this.y + this.h / 2, true)) {
      this.dead = true;
      this.scene.particles.burst(this.x, this.y, 6, { color: this.color, spMax: 1.8, life: 0.3, glow: true, size: 1 });
    }
    // estela binaria
    if (Math.random() < 0.6)
      this.scene.particles.spawn({ x: this.x, y: this.y, vx: -this.vx * 0.1, vy: U.rand(-0.3, 0.3), life: 0.2, max: 0.2, color: this.color, size: 1 });
  }
  draw(ctx, camX, camY) {
    ctx.shadowColor = this.color; ctx.shadowBlur = 6;
    px(ctx, this.x - camX, this.y - camY, this.w, this.h, this.color);
    px(ctx, this.x - camX + 1, this.y - camY + 1, this.w - 2, this.h - 2, '#fff');
    ctx.shadowBlur = 0;
  }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

/* -------------------- Player -------------------- */
class Player {
  constructor(scene, x, y, char) {
    this.scene = scene;
    this.char = char; // 'M' | 'Q'
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.prevGround = false;
    this.maxHp = 6; this.hp = 6;
    this.energy = 0; this.maxEnergy = 100;
    this.coyote = 0; this.jumpBuf = 0; this.jumps = 0; this.maxJumps = 2;
    this.animT = 0; this.state = 'idle';
    this.invuln = 0; this.flash = 0;
    // M
    this.dashTime = 0; this.dashCD = 0; this.shootCD = 0; this.heavyTime = 0; this.recoil = 0;
    this.muzzle = 0;
    // Q
    this.slideTime = 0; this.liquid = 0; this.liquidCD = 0;
    this.scanTime = 0; this.scanCD = 0;
    this.rewinding = 0; this.rewindCD = 0; this.history = [];
    this.dead = false; this.deathT = 0;
    this.spawnX = x; this.spawnY = y;
    this.setPlayerStats(char);
  }

  /** Perfiles de peso / friccion: LORD-M pesado, LORD-Q agil y preciso. */
  setPlayerStats(characterType) {
    const type = (characterType === 'LORD-M' || characterType === 'M') ? 'M' : 'Q';
    this.char = type;
    if (type === 'M') {
      this.w = 10; this.h = 26;
      this.accel = 0.72;       // arranque pesado (alta aceleracion)
      this.maxSpd = 2.45;
      this.fric = 0.28;        // frena lento = inercia
      this.airAccel = 0.22;    // poco control aereo
      this.gravMul = 1.0;
      this.jumpForce = -8.6;
      this.djumpForce = -7.2;
    } else {
      this.w = 9; this.h = 20;
      this.accel = 0.58;
      this.maxSpd = 2.6;
      this.fric = 0.68;        // frena rapido = preciso
      this.airAccel = 0.52;    // control aereo alto
      this.gravMul = 0.88;     // gravedad ligeramente menor
      this.jumpForce = -7.8;
      this.djumpForce = -7.0;
    }
  }

  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  center() { return { x: this.x + this.w / 2, y: this.y + this.h / 2 }; }

  solidAt(col, row) { return this.scene.isSolidTile(col, row, this.liquid > 0); }

  resolveX(dx) {
    this.x += dx * CONFIG.SPEED;
    const T = CONFIG.TILE;
    const r = this.rect();
    const c0 = Math.floor(r.x / T), c1 = Math.floor((r.x + r.w - 0.1) / T);
    const rw0 = Math.floor(r.y / T), rw1 = Math.floor((r.y + r.h - 0.1) / T);
    for (let row = rw0; row <= rw1; row++) {
      for (let col = c0; col <= c1; col++) {
        if (this.solidAt(col, row)) {
          if (dx > 0) this.x = col * T - this.w - 0.01;
          else if (dx < 0) this.x = (col + 1) * T + 0.01;
          this.vx = 0;
        }
      }
    }
  }
  resolveY(dy) {
    const impactVy = this.vy;
    this.y += dy * CONFIG.SPEED;
    const T = CONFIG.TILE;
    const r = this.rect();
    const c0 = Math.floor(r.x / T), c1 = Math.floor((r.x + r.w - 0.1) / T);
    const rw0 = Math.floor(r.y / T), rw1 = Math.floor((r.y + r.h - 0.1) / T);
    let landed = false;
    for (let row = rw0; row <= rw1; row++) {
      for (let col = c0; col <= c1; col++) {
        if (this.solidAt(col, row)) {
          if (dy > 0) { this.y = row * T - this.h - 0.01; this.vy = 0; landed = true; }
          else if (dy < 0) { this.y = (row + 1) * T + 0.01; this.vy = 0; }
        }
      }
    }
    if (landed) {
      this.onGround = true; this.jumps = 0; this.coyote = CONFIG.COYOTE_TIME;
      if (impactVy > CONFIG.HARD_LAND_VY) {
        this.scene.triggerScreenShake(Math.min(8, 2 + (impactVy - CONFIG.HARD_LAND_VY) * 0.8));
      }
    }
  }

  hurt(dmg, fromX) {
    if (this.invuln > 0 || this.liquid > 0 || this.dashTime > 0 || this.dead) return;
    this.hp -= dmg;
    this.invuln = CONFIG.INVULN_TIME; this.flash = 0.3;
    this.vx = U.sign(this.x + this.w / 2 - fromX) * 3;
    this.vy = -3;
    Audio2.sfx('hurt');
    this.scene.triggerScreenShake(5);
    FX.pulseGlitch(0.3);
    this.scene.particles.burst(this.center().x, this.center().y, 10, { color: C.magenta, spMax: 2.5, life: 0.5, glow: true, size: 1 });
    if (this.hp <= 0) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true; this.deathT = 0;
    Audio2.stopCrit();
    Audio2.sfx('death');
    FX.doFlash('#ff2b3e', 0.5); FX.pulseGlitch(0.8); this.scene.triggerScreenShake(10);
    this.scene.particles.burst(this.center().x, this.center().y, 30, { color: this.char === 'M' ? C.cyan : C.green, spMax: 3.5, life: 0.9, glow: true, size: 2, grav: 0.05 });
  }

  update(dt) {
    this.animT += dt * CONFIG.SPEED;
    if (this.dead) { this.deathT += dt; this.vy = U.clamp(this.vy + CONFIG.GRAVITY * this.gravMul, -9, 9); this.resolveY(this.vy); return; }
    if (this.scene.game && this.scene.game.inputLocked) return;

    this.invuln = Math.max(0, this.invuln - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.muzzle = Math.max(0, this.muzzle - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.dashCD = Math.max(0, this.dashCD - dt);
    this.shootCD = Math.max(0, this.shootCD - dt);
    this.liquidCD = Math.max(0, this.liquidCD - dt);
    this.scanCD = Math.max(0, this.scanCD - dt);
    this.rewindCD = Math.max(0, this.rewindCD - dt);
    this.recoil = U.approach(this.recoil, 0, dt * 30);

    // historial para rebobinado (Q)
    if (this.char === 'Q') {
      this.history.push({ x: this.x, y: this.y, vy: this.vy, facing: this.facing, hp: this.hp });
      if (this.history.length > 300) this.history.shift();
    }

    if (this.rewinding > 0) { this._rewindStep(dt); return; }

    this.prevGround = this.onGround;
    this.onGround = false;
    if (this.char === 'M') this._updateM(dt);
    else this._updateQ(dt);

    // limites del mundo
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > this.scene.cols * CONFIG.TILE) { this.x = this.scene.cols * CONFIG.TILE - this.w; this.vx = 0; }
    if (this.y > this.scene.rows * CONFIG.TILE + 80) this.die();
  }

  _tryJump(force) {
    // Compensa el escalado de SPEED para conservar la ALTURA del salto
    this.vy = force / Math.sqrt(CONFIG.SPEED);
    this.jumps++;
    this.onGround = false;
    const cx = this.x + this.w / 2, fy = this.y + this.h;
    if (this.jumps === 1) {
      Audio2.sfx('jump');
      // chispas cian hacia abajo (impulso)
      for (let i = 0; i < 8; i++) {
        this.scene.particles.spawn({
          x: cx + U.rand(-3, 3), y: fy,
          vx: U.rand(-0.9, 0.9), vy: U.rand(0.6, 2.4),
          life: 0.28, max: 0.28, color: C.cyan, size: 1, glow: true,
        });
      }
    } else {
      Audio2.sfx('djump');
      for (let i = 0; i < 10; i++) {
        this.scene.particles.spawn({
          x: cx + U.rand(-4, 4), y: fy,
          vx: U.rand(-1.2, 1.2), vy: U.rand(0.4, 2.2),
          life: 0.35, max: 0.35, color: this.char === 'M' ? C.cyan : C.green, size: 1, glow: true,
        });
      }
    }
  }

  _horizontal() {
    let dir = 0;
    if (Input.down('left')) dir = -1;
    if (Input.down('right')) dir = 1;
    const accel = this.prevGround ? this.accel : this.airAccel;
    const fric = this.prevGround ? this.fric : this.airAccel * 0.45;
    if (dir !== 0) { this.vx = U.approach(this.vx, dir * this.maxSpd, accel); this.facing = dir; }
    else this.vx = U.approach(this.vx, 0, fric);
  }

  _emitRunTrail() {
    if (!this.onGround || Math.abs(this.vx) < CONFIG.RUN_TRAIL_SPEED) return;
    if (Math.random() > 0.4) return;
    this.scene.particles.spawn({
      x: this.x + this.w / 2 - this.facing * 2,
      y: this.y + this.h - 1,
      vx: -this.facing * U.rand(0.1, 0.45),
      vy: U.rand(-0.25, 0.05),
      life: 0.22, max: 0.22, color: C.cyan, size: 1, glow: false,
    });
  }

  // ---------------- LORD-M ----------------
  _updateM(dt) {
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.vx = this.facing * 7.5;
      this.vy = 0;
      this.invuln = Math.max(this.invuln, 0.05);
      if (Math.random() < 0.9)
        this.scene.particles.spawn({ x: this.x + this.w / 2 - this.facing * 4, y: U.rand(this.y + 4, this.y + this.h - 4), vx: -this.facing * U.rand(0.5, 1.5), vy: U.rand(-0.5, 0.5), life: 0.3, max: 0.3, color: U.rand(0, 1) < 0.5 ? C.cyan : '#fff', size: 1, glow: true });
      this._breakAhead();
      this.resolveX(this.vx);
      this.state = 'dash';
      if (this.dashTime <= 0) this.vx *= 0.5;
      return;
    }

    this._horizontal();

    if (Input.justDown('jump')) this.jumpBuf = CONFIG.JUMP_BUFFER;
    const canGroundJump = this.prevGround || this.coyote > 0;
    if (this.jumpBuf > 0 && canGroundJump && this.jumps === 0) {
      this._tryJump(this.jumpForce);
      this.jumpBuf = 0;
    } else if (Input.justDown('jump') && !canGroundJump && this.jumps < this.maxJumps) {
      this._tryJump(this.djumpForce);
      this.jumpBuf = 0;
    }
    if (Input.justUp('jump') && this.vy < -3) this.vy = -3;

    if (Input.justDown('dash') && this.dashCD <= 0) {
      this.dashTime = 0.16; this.dashCD = 0.5;
      Audio2.sfx('dash'); FX.pulseGlitch(0.15); this.scene.triggerScreenShake(2);
      this.energy = Math.min(this.maxEnergy, this.energy + 6);
    }

    if (Input.justDown('shoot') && this.shootCD <= 0) {
      this.shootCD = 0.22; this.muzzle = 0.06;
      const px0 = this.x + (this.facing > 0 ? this.w + 1 : -6);
      const py0 = this.y + 8;
      this.scene.projectiles.push(new Projectile(this.scene, px0, py0, this.facing, { speed: 6, dmg: 2, color: C.cyan, from: 'player', w: 6, h: 3 }));
      this.vx -= this.facing * 1.6;
      Audio2.sfx('shoot'); this.scene.triggerScreenShake(1);
      this.energy = Math.min(this.maxEnergy, this.energy + 3);
    }

    if (Input.justDown('special') && this.heavyTime <= 0 && this.shootCD <= 0) {
      this.heavyTime = 0.28; this.shootCD = 0.4;
      Audio2.sfx('heavy'); this.scene.triggerScreenShake(4); FX.pulseGlitch(0.1);
      this.scene.meleeHit(this.x + (this.facing > 0 ? this.w : -16), this.y, 18, this.h, 4, this.facing * 5);
      this.scene.particles.burst(this.x + this.w / 2 + this.facing * 10, this.y + this.h / 2, 14, { color: C.yellow, spMax: 3, life: 0.4, glow: true, size: 1 });
      this.energy = Math.min(this.maxEnergy, this.energy + 8);
    }
    if (this.heavyTime > 0) this.heavyTime -= dt;

    if (Input.justDown('ultimate') && this.energy >= this.maxEnergy) {
      this.energy = 0;
      this.scene.stackOverflow(this.center().x, this.center().y);
    }

    this.vy = U.clamp(this.vy + CONFIG.GRAVITY * this.gravMul, -20, CONFIG.MAX_FALL);
    this.resolveX(this.vx);
    this.resolveY(this.vy);
    this._emitRunTrail();
    this._setState();
  }

  _breakAhead() {
    const T = CONFIG.TILE;
    const cx = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
    const col = Math.floor(cx / T);
    for (let row = Math.floor(this.y / T); row <= Math.floor((this.y + this.h - 1) / T); row++) {
      if (this.scene.tile(col, row) === 'B') {
        this.scene.setTile(col, row, '.');
        Audio2.sfx('hit'); this.scene.triggerScreenShake(3); FX.pulseGlitch(0.2);
        this.scene.particles.burst(col * T + 8, row * T + 8, 16, { color: C.amber, spMax: 3, life: 0.6, glow: true, size: 2, grav: 0.1 });
      }
    }
  }

  // ---------------- LORD-Q ----------------
  _updateQ(dt) {
    if (this.liquid > 0) {
      this.liquid -= dt;
      this.invuln = Math.max(this.invuln, 0.05);
      if (Math.random() < 0.8)
        this.scene.particles.spawn({ x: U.rand(this.x, this.x + this.w), y: U.rand(this.y, this.y + this.h), vx: U.rand(-0.3, 0.3), vy: U.rand(-0.6, -0.1), life: 0.4, max: 0.4, color: C.cyan, size: 1, glow: true });
    }

    if (this.slideTime > 0) {
      this.slideTime -= dt;
      this.vx = U.approach(this.vx, this.facing * 4.2, 0.3);
      this.vy = U.clamp(this.vy + CONFIG.GRAVITY * this.gravMul, -20, CONFIG.MAX_FALL);
      this.resolveX(this.vx); this.resolveY(this.vy);
      if (Math.random() < 0.4) this.scene.particles.spawn({ x: this.x + this.w / 2, y: this.y + this.h - 1, vx: -this.facing, vy: -0.3, life: 0.25, max: 0.25, color: '#9fd6ff', size: 1 });
      this.state = 'slide';
      if (this.slideTime <= 0) this.vx *= 0.4;
      return;
    }

    this._horizontal();

    if (Input.justDown('jump')) this.jumpBuf = CONFIG.JUMP_BUFFER;
    const canGroundJump = this.prevGround || this.coyote > 0;
    if (this.jumpBuf > 0 && canGroundJump && this.jumps === 0) {
      this._tryJump(this.jumpForce);
      this.jumpBuf = 0;
    } else if (Input.justDown('jump') && !canGroundJump && this.jumps < this.maxJumps) {
      this._tryJump(this.djumpForce);
      this.jumpBuf = 0;
    }
    if (Input.justUp('jump') && this.vy < -3) this.vy = -3;

    if (Input.justDown('dash') && this.prevGround && this.slideTime <= 0) {
      this.slideTime = 0.34; Audio2.sfx('dash');
    }

    if (Input.justDown('liquid') && this.liquid <= 0 && this.liquidCD <= 0) {
      this.liquid = CONFIG.LIQUID_DUR; this.liquidCD = CONFIG.LIQUID_CD_MAX;
      Audio2.sfx('liquid'); FX.pulseGlitch(0.12);
      this.scene.particles.burst(this.center().x, this.center().y, 14, { color: C.cyan, spMax: 2, life: 0.5, glow: true, size: 1 });
    }

    if (Input.justDown('scan') && this.scanCD <= 0) {
      this.scanTime = 0.5; this.scanCD = CONFIG.SCAN_CD_MAX;
      Audio2.sfx('scan');
      this.scene.doScan(this.center().x, this.center().y);
    }
    if (this.scanTime > 0) this.scanTime -= dt;

    if (Input.justDown('rewind') && this.rewindCD <= 0 && this.history.length > 30) {
      this.rewinding = 0.7; this.rewindCD = CONFIG.REWIND_CD_MAX;
      Audio2.sfx('rewind'); FX.pulseGlitch(0.2);
    }

    this.vy = U.clamp(this.vy + CONFIG.GRAVITY * this.gravMul, -20, CONFIG.MAX_FALL);
    this.resolveX(this.vx);
    this.resolveY(this.vy);
    this._emitRunTrail();
    this._setState();
  }

  _rewindStep(dt) {
    this.rewinding -= dt;
    // consume ~5s de historial rapido
    const steps = 8;
    for (let i = 0; i < steps && this.history.length > 1; i++) this.history.pop();
    const h = this.history[this.history.length - 1];
    if (h) {
      // eco fantasma
      this.scene.particles.spawn({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: 0, vy: 0, life: 0.4, max: 0.4, color: C.cyan, size: 2, glow: true });
      this.x = h.x; this.y = h.y; this.vy = 0; this.facing = h.facing;
      this.hp = Math.max(this.hp, h.hp);
    }
    if (this.rewinding <= 0 || this.history.length <= 1) { this.rewinding = 0; this.invuln = 0.4; }
  }

  _setState() {
    if (!this.onGround) this.state = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 0.5) this.state = 'run';
    else this.state = 'idle';
  }

  draw(ctx, camX, camY) {
    const cx = this.x + this.w / 2 - camX;
    const feetY = this.y + this.h - camY;
    let phase = this.animT * (this.state === 'run' ? 14 : 4);
    const blink = this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0;
    let alpha = blink ? 0.35 : 1;
    if (this.liquid > 0) alpha = 0.55 + Math.sin(this.animT * 20) * 0.15;
    if (this.dead) alpha = U.clamp(1 - this.deathT * 1.2, 0, 1);

    const anim = {
      state: this.dead ? 'hurt' : this.state, phase, alpha,
      flashWhite: this.flash > 0,
      flashMagenta: this.invuln > 0 && Math.floor(this.invuln * 14) % 2 === 0,
      weapon: null,
      muzzle: this.muzzle > 0,
    };
    if (this.char === 'M') {
      anim.weapon = (this.muzzle > 0 || this.shootCD > 0.1) ? 'gun' : null;
      Sprites.drawLordM(ctx, cx, feetY, this.facing, anim);
    } else {
      if (this.liquid > 0) { ctx.shadowColor = C.cyan; ctx.shadowBlur = 8; }
      Sprites.drawLordQ(ctx, cx, feetY, this.facing, anim);
      ctx.shadowBlur = 0;
      if (this.scanTime > 0) {
        const r = (0.5 - this.scanTime) * 120 + 8;
        ctx.strokeStyle = C.cyan; ctx.globalAlpha = U.clamp(this.scanTime * 2, 0, 1) * 0.8;
        ctx.lineWidth = 1; ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2 - camY, r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

/* -------------------- Enemigos -------------------- */
class Enemy {
  constructor(scene, type, x, y, opts = {}) {
    this.scene = scene; this.type = type;
    this.x = x; this.y = y;
    this.w = type === 'purger' ? 18 : type === 'virus' ? 12 : 16;
    this.h = type === 'purger' ? 20 : type === 'virus' ? 12 : 12;
    this.vx = 0; this.vy = 0;
    this.hp = opts.hp || (type === 'purger' ? 24 : type === 'virus' ? 3 : 6);
    this.maxHp = this.hp;
    this.facing = -1; this.seed = Math.random() * 10;
    this.t = 0; this.alert = false; this.fireCD = U.rand(1, 2.5);
    this.dead = false; this.patrol = opts.patrol || 40;
    this.ox = x; this.dmg = opts.dmg || 1;
    this.flash = 0;
  }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  hurt(dmg, kx) {
    this.hp -= dmg; this.flash = 0.12;
    this.x += kx * 0.5;
    this.scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 5, { color: '#fff', spMax: 2, life: 0.25, size: 1, glow: true });
    if (this.hp <= 0) this.die();
    else Audio2.sfx('hit');
  }
  die() {
    this.dead = true;
    Audio2.sfx('explo'); this.scene.triggerScreenShake(3); FX.pulseGlitch(0.15);
    this.scene.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 18, { color: this.type === 'virus' ? C.magenta : C.cyan, spMax: 3, life: 0.6, glow: true, size: 2, grav: 0.05 });
    this.scene.onEnemyKilled(this);
  }
  update(dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const S = CONFIG.ENEMY_SPEED;
    const p = this.scene.player;
    const pc = p.center(), me = { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    const dist = Math.hypot(pc.x - me.x, pc.y - me.y);

    if (this.type === 'drone') {
      this.alert = dist < 110;
      const tx = this.ox + Math.sin(this.t * 1.2 + this.seed) * this.patrol;
      this.x = U.approach(this.x, tx, 0.6 * S);
      this.y += Math.sin(this.t * 2 + this.seed) * 0.3 * S;
      if (pc.x < me.x) this.facing = -1; else this.facing = 1;
      if (this.alert) {
        this.fireCD -= dt;
        if (this.fireCD <= 0) {
          this.fireCD = 1.6;
          const dir = U.sign(pc.x - me.x) || 1;
          this.scene.projectiles.push(new Projectile(this.scene, me.x, me.y, dir, { speed: 2.8, dmg: this.dmg, color: C.red, from: 'enemy', life: 3, w: 4, h: 4 }));
          Audio2.sfx('shoot');
        }
      }
    } else if (this.type === 'virus') {
      // persigue al jugador flotando
      const ang = Math.atan2(pc.y - me.y, pc.x - me.x);
      const sp = dist < 140 ? 0.9 : 0.3;
      this.x += (Math.cos(ang) * sp + Math.sin(this.t * 3 + this.seed) * 0.3) * S;
      this.y += (Math.sin(ang) * sp + Math.cos(this.t * 3 + this.seed) * 0.3) * S;
    } else if (this.type === 'purger') {
      // mini-jefe: persigue lento y borra plataformas debajo
      this.x = U.approach(this.x, pc.x - this.w / 2, 0.35 * S);
      this.vy = U.clamp(this.vy + CONFIG.GRAVITY, -10, CONFIG.MAX_FALL);
      this.y += this.vy * S;
      this._ground();
      if (this.t % 2 < dt && Math.abs(pc.x - me.x) < 30) {
        const col = Math.floor(pc.x / CONFIG.TILE), row = Math.floor((p.y + p.h + 4) / CONFIG.TILE);
        if (this.scene.tile(col, row) === '#') { /* no borra muros base */ }
      }
      this.fireCD -= dt;
      if (this.fireCD <= 0 && dist < 160) {
        this.fireCD = 1.1;
        for (let k = -1; k <= 1; k++)
          this.scene.projectiles.push(new Projectile(this.scene, me.x, me.y, U.sign(pc.x - me.x) || 1, { speed: 2.6, vy: k * 0.8, dmg: this.dmg, color: C.purple, from: 'enemy', life: 3, w: 4, h: 4 }));
        Audio2.sfx('shoot');
      }
    }
    // contacto con jugador
    if (U.rectsOverlap(this.rect(), p.rect())) p.hurt(this.dmg, me.x);
  }
  _ground() {
    const T = CONFIG.TILE;
    const r = this.rect();
    const rw = Math.floor((r.y + r.h) / T);
    for (let col = Math.floor(r.x / T); col <= Math.floor((r.x + r.w - 1) / T); col++) {
      if (this.scene.isSolidTile(col, rw, false) && this.vy >= 0) { this.y = rw * T - this.h; this.vy = 0; }
    }
  }
  draw(ctx, camX, camY) {
    ctx.save();
    if (this.flash > 0) ctx.globalAlpha = 0.6;
    const e = { x: this.x - camX, y: this.y - camY, w: this.w, h: this.h, facing: this.facing, alert: this.alert, seed: this.seed };
    if (this.type === 'drone') Sprites.drawDrone(ctx, e, this.t);
    else if (this.type === 'virus') Sprites.drawVirus(ctx, e, this.t);
    else if (this.type === 'purger') Sprites.drawPurger(ctx, e, this.t);
    ctx.restore();
    // barra de vida mini-jefe
    if (this.type === 'purger') {
      px(ctx, this.x - camX - 2, this.y - camY - 6, this.w + 4, 2, '#300');
      px(ctx, this.x - camX - 2, this.y - camY - 6, (this.w + 4) * (this.hp / this.maxHp), 2, C.magenta);
    }
  }
}

/* -------------------- Memoria coleccionable -------------------- */
class Memory {
  constructor(x, y, id, text) {
    this.x = x; this.y = y; this.baseY = y;
    this.id = id; this.text = text; this.t = 0;
    this.taken = false; this.collecting = false; this.collectT = 0;
    this.alpha = 1; this.w = 10; this.h = 10;
  }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  startCollect() {
    if (this.collecting || this.taken) return;
    this.collecting = true; this.collectT = 0; this.baseY = this.y;
  }
  update(dt) {
    this.t += dt;
    if (this.collecting) {
      this.collectT += dt;
      this.y = this.baseY - this.collectT * 40;
      this.alpha = U.clamp(1 - this.collectT / 0.3, 0, 1);
      if (this.collectT >= 0.3) { this.taken = true; this.collecting = false; }
    }
  }
  draw(ctx, camX, camY) {
    if (this.taken) return;
    const yo = this.collecting ? 0 : Math.sin(this.t * 3) * 2;
    ctx.globalAlpha = this.alpha;
    ctx.shadowColor = C.yellow; ctx.shadowBlur = 8;
    ctx.save();
    ctx.translate(this.x + this.w / 2 - camX, this.y + this.h / 2 - camY + yo);
    ctx.rotate(this.t * 1.5);
    px(ctx, -4, -4, 8, 8, C.yellow);
    px(ctx, -2, -2, 4, 4, '#fff');
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

/* -------------------- Señalizador holográfico (saltos de fe) -------------------- */
class HoloMarker {
  constructor(x, y) {
    this.x = x; this.y = y; this.t = Math.random() * 4;
  }
  update(dt) { this.t += dt; }
  draw(ctx, camX, camY) {
    // bob yoyo + parpadeo
    const bob = Math.sin(this.t * 3.2) * 3;
    const blink = 0.35 + Math.abs(Math.sin(this.t * 5)) * 0.4;
    const x = this.x - camX;
    const y = this.y - camY + bob;
    ctx.globalAlpha = blink;
    ctx.shadowColor = C.cyan; ctx.shadowBlur = 8;
    // flecha apuntando abajo
    px(ctx, x - 1, y - 10, 3, 7, C.cyan);
    px(ctx, x - 4, y - 4, 9, 2, C.cyan);
    px(ctx, x - 3, y - 2, 7, 2, C.cyan);
    px(ctx, x - 2, y, 5, 2, C.cyan);
    px(ctx, x - 1, y + 2, 3, 2, C.cyan);
    px(ctx, x, y + 4, 1, 2, C.cyan);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
