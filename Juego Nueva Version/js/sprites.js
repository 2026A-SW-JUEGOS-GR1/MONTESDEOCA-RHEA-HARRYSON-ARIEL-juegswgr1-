/* ============================================================
   sprites.js  —  Dibujo procedural (pixel-art) de personajes
   articulados (LORD-M / LORD-Q), enemigos, tiles y fondos.
   Todo se dibuja a resolucion base 320x180.
   ============================================================ */

function px(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function limb(ctx, x1, y1, x2, y2, w, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

const Sprites = {
  /* ---- Personaje generico articulado ----
     anim: { state, phase, vy, alpha, flashWhite } facing: 1 | -1 */
  drawChar(ctx, x, y, facing, pal, cfg, anim) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = anim.alpha != null ? anim.alpha : 1;

    const legH = cfg.legH, torsoH = cfg.torsoH, headR = cfg.headR;
    const hipY = -legH;
    const shldY = -legH - torsoH;
    const state = anim.state;
    const ph = anim.phase || 0;

    let legSwing = 0, armSwing = 0, lean = 0, crouch = 0, bob = 0, stretch = 1;
    if (state === 'run') { legSwing = Math.sin(ph) * 5; armSwing = Math.sin(ph) * 4; lean = 2.5; bob = Math.abs(Math.sin(ph)) * -1; }
    else if (state === 'idle') { bob = Math.sin(ph * 0.5) * 0.6; }
    else if (state === 'jump') { legSwing = 3; armSwing = -3; lean = 1.5; }
    else if (state === 'fall') { legSwing = -2; armSwing = 4; lean = 0.5; }
    else if (state === 'dash') { lean = 5; stretch = 1.15; legSwing = 4; armSwing = -5; }
    else if (state === 'slide') { crouch = legH * 0.6; lean = 6; }
    else if (state === 'attack') { lean = 3; armSwing = 6; }
    else if (state === 'hurt') { lean = -3; armSwing = -4; }
    else if (state === 'scan') { bob = Math.sin(ph) * 0.6; armSwing = 2; }

    const cy = crouch + bob;

    // Sombra
    ctx.globalAlpha = (anim.alpha != null ? anim.alpha : 1) * 0.35;
    px(ctx, -6, -1, 12, 2, '#000');
    ctx.globalAlpha = anim.alpha != null ? anim.alpha : 1;

    // --- Piernas ---
    const footF = legSwing, footB = -legSwing;
    limb(ctx, 0, hipY + cy, footB, -1 + cy, 3.4, pal.body);       // pierna trasera
    px(ctx, footB - 2, -2 + cy, 4, 2, pal.boot);
    limb(ctx, 0, hipY + cy, footF + 1, -1 + cy, 3.6, pal.bodyL);  // pierna delantera
    px(ctx, footF - 1, -2 + cy, 4, 2, pal.boot);

    // --- Torso / armadura ---
    const tx = lean * 0.4;
    ctx.save();
    ctx.translate(tx, 0);
    px(ctx, -3.5, shldY + cy, 7, torsoH * stretch, pal.armor || pal.body);
    if (pal.armorD) px(ctx, -3.5, shldY + cy + 1, 2, torsoH * stretch - 1, pal.armorD);
    // detalle de armadura
    if (pal.armor) px(ctx, -2.5, shldY + cy + 2, 5, 1.5, pal.armorD || pal.body);

    // --- Bufanda / pañuelo ---
    if (pal.scarf) {
      px(ctx, -3.5, shldY + cy - 1, 7, 2.4, pal.scarf);
      if (pal.scarfL) px(ctx, -3.5, shldY + cy - 1, 7, 1, pal.scarfL);
      // cola de la bufanda ondeando hacia atras
      const wag = Math.sin(ph * 1.3) * 2;
      limb(ctx, -3, shldY + cy + 1, -8 - Math.abs(armSwing), shldY + cy + 3 + wag, 2.5, pal.scarf);
      limb(ctx, -3, shldY + cy + 1, -7 - Math.abs(armSwing), shldY + cy + 6 + wag, 1.8, pal.scarfL || pal.scarf);
    }

    // --- Brazos ---
    const handF = armSwing + 2;
    limb(ctx, 1, shldY + cy + 2, -armSwing - 1, shldY + cy + 6, 2.6, pal.bodyL); // brazo trasero
    px(ctx, -armSwing - 2.5, shldY + cy + 6, 3, 2.5, pal.skin);
    if (anim.weapon === 'gun') {
      // brazo delantero apuntando
      limb(ctx, 1, shldY + cy + 2, 6, shldY + cy + 3, 2.8, pal.skin);
      px(ctx, 5, shldY + cy + 1.5, 4, 2.5, '#3a3e46');
      px(ctx, 8.5, shldY + cy + 2, 1.5, 1.5, anim.muzzle ? '#fff' : pal.data || '#33e5ff');
    } else {
      limb(ctx, 1, shldY + cy + 2, handF, shldY + cy + 6, 2.8, pal.skin);   // brazo delantero
      px(ctx, handF - 1, shldY + cy + 6, 3, 2.5, pal.skin);
    }
    ctx.restore();

    // --- Cabeza ---
    const hx = tx + lean * 0.5;
    const hy = shldY + cy - headR - 1;
    px(ctx, hx - headR + 1, hy, headR * 2 - 1, headR * 2, pal.skin);

    // ojos
    px(ctx, hx + 0.5, hy + headR - 1, cfg.bigEyes ? 2 : 1.4, cfg.bigEyes ? 2 : 1.4, '#1b1b1b');
    if (cfg.bigEyes) px(ctx, hx + 0.7, hy + headR - 0.8, 0.8, 0.8, '#fff');

    // --- Pelo / gorro ---
    if (cfg.hairStyle === 'spike') {
      // melena azul puntiaguda (LORD-M)
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.moveTo(hx - headR, hy + headR);
      ctx.lineTo(hx - headR - 1, hy - 2);
      ctx.lineTo(hx - 1, hy - 4);
      ctx.lineTo(hx + 1, hy - 5);
      ctx.lineTo(hx + headR + 1, hy - 1);
      ctx.lineTo(hx + headR, hy + headR - 1);
      ctx.lineTo(hx - 1, hy + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.hairL;
      ctx.beginPath();
      ctx.moveTo(hx - 1, hy - 4); ctx.lineTo(hx + 1, hy - 5);
      ctx.lineTo(hx + headR, hy - 1); ctx.lineTo(hx, hy);
      ctx.closePath(); ctx.fill();
    } else if (cfg.hairStyle === 'cap') {
      // gorro marron + coleta verde (LORD-Q)
      px(ctx, hx - headR, hy - 1, headR * 2, 2.5, pal.cap);
      ctx.fillStyle = pal.cap;
      ctx.beginPath();
      ctx.arc(hx, hy + 0.5, headR + 0.5, Math.PI, 0); ctx.fill();
      px(ctx, hx - headR - 1, hy + 1, 2, 1.5, pal.capL); // visera
      // coleta verde
      ctx.fillStyle = pal.hair;
      const wag = Math.sin(ph) * 1.5;
      ctx.beginPath();
      ctx.moveTo(hx + headR - 1, hy);
      ctx.lineTo(hx + headR + 3, hy - 2 + wag);
      ctx.lineTo(hx + headR + 4, hy + 2 + wag);
      ctx.lineTo(hx + headR - 1, hy + 3);
      ctx.closePath(); ctx.fill();
      px(ctx, hx + headR, hy, 2, 1, pal.hairL);
    }

    // flash blanco al recibir daño / tint magenta en iFrames (glitch)
    if (anim.flashMagenta) {
      ctx.globalAlpha = 0.55;
      px(ctx, hx - headR, hy - 5, headR * 2 + 4, headR * 2 + torsoH + legH + 6, C.magenta);
    } else if (anim.flashWhite) {
      ctx.globalAlpha = 0.7;
      px(ctx, hx - headR, hy - 5, headR * 2 + 4, headR * 2 + torsoH + legH + 6, '#fff');
    }

    ctx.restore();
  },

  drawLordM(ctx, x, y, facing, anim) {
    this.drawChar(ctx, x, y, facing, M_COL,
      { legH: 11, torsoH: 11, headR: 4.2, hairStyle: 'spike', bigEyes: false }, anim);
  },
  drawLordQ(ctx, x, y, facing, anim) {
    this.drawChar(ctx, x, y, facing, Q_COL,
      { legH: 8, torsoH: 8, headR: 4, hairStyle: 'cap', bigEyes: true }, anim);
  },

  /* ---------------- Enemigos ---------------- */
  drawDrone(ctx, e, t) {
    const x = e.x + e.w / 2, y = e.y + e.h / 2;
    const bob = Math.sin(t * 3 + e.seed) * 2;
    ctx.save(); ctx.translate(x, y + bob);
    px(ctx, -7, -5, 14, 10, '#3a4570');
    px(ctx, -7, -5, 14, 2, '#5a68a0');
    px(ctx, -8, -2, 1.5, 4, '#aab6e0');
    px(ctx, 6.5, -2, 1.5, 4, '#aab6e0');
    // ojo / sensor
    const eyeC = e.alert ? C.red : C.cyan;
    px(ctx, -3, -2, 6, 4, '#0a0e1c');
    px(ctx, e.facing > 0 ? 1 : -2, -1, 2, 2, eyeC);
    ctx.shadowColor = eyeC; ctx.shadowBlur = 6;
    px(ctx, e.facing > 0 ? 1 : -2, -1, 2, 2, eyeC);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  drawVirus(ctx, e, t) {
    const x = e.x + e.w / 2, y = e.y + e.h / 2;
    const pulse = 1 + Math.sin(t * 6 + e.seed) * 0.15;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = C.magenta;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = (i % 2 ? 4 : 7) * pulse;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    px(ctx, -2, -2, 4, 4, '#1a001a');
    px(ctx, -1, -1, 1.5, 1.5, C.green);
    ctx.restore();
  },
  drawPurger(ctx, e, t) {
    const x = e.x + e.w / 2, y = e.y + e.h / 2;
    ctx.save(); ctx.translate(x, y);
    px(ctx, -9, -10, 18, 20, '#241030');
    px(ctx, -9, -10, 18, 3, C.purple);
    px(ctx, -7, -4, 14, 6, '#0a0014');
    const scan = Math.sin(t * 4 + e.seed);
    px(ctx, scan * 5 - 1, -3, 2, 4, C.magenta);
    px(ctx, -10, -8, 2, 16, '#4a2a6a');
    px(ctx, 8, -8, 2, 16, '#4a2a6a');
    ctx.restore();
  },

  /* ---------------- Tiles / mundo ---------------- */
  drawTile(ctx, x, y, s, accent, corr) {
    px(ctx, x, y, s, s, '#0e1430');
    px(ctx, x, y, s, s * 0.5, '#141d44');
    // borde neon superior
    px(ctx, x, y, s, 1, accent);
    px(ctx, x, y + 1, s, 0.5, '#0a1430');
    // remaches
    px(ctx, x + 2, y + s - 3, 1.5, 1.5, '#2a3358');
    px(ctx, x + s - 3, y + s - 3, 1.5, 1.5, '#2a3358');
    // lineas de circuito
    ctx.globalAlpha = 0.5;
    px(ctx, x + 3, y + 5, s - 6, 0.5, accent);
    ctx.globalAlpha = 1;
    if (corr > 0.4 && Math.random() < corr * 0.05) {
      px(ctx, x, y + U.randi(0, s), s, 1, C.magenta);
    }
  },
  drawHazard(ctx, x, y, s, t) {
    px(ctx, x, y + s - 4, s, 4, '#220010');
    const f = Math.floor(t * 10) % 2;
    px(ctx, x + (f ? 2 : 6), y + s - 3, 3, 2, C.red);
    px(ctx, x + (f ? 9 : 11), y + s - 3, 3, 2, C.amber);
  },
};

/* ---------------- Fondo parallax + lluvia ---------------- */
const Backdrop = {
  rain: [],
  stars: [],
  init() {
    this.rain = [];
    for (let i = 0; i < 70; i++) this.rain.push({ x: Math.random() * CONFIG.W, y: Math.random() * CONFIG.H, s: U.rand(4, 8) });
    this.stars = [];
    for (let i = 0; i < 50; i++) this.stars.push({ x: Math.random() * CONFIG.W, y: Math.random() * CONFIG.H * 0.8, b: Math.random() });
  },
  draw(ctx, meta, camX, t) {
    const W = CONFIG.W, H = CONFIG.H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, meta.bg[0]); g.addColorStop(0.55, meta.bg[1]); g.addColorStop(1, meta.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // estrellas / pixeles de datos (capa lejana)
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + Math.abs(Math.sin(t * 2 + s.b * 9)) * 0.4;
      px(ctx, (s.x - camX * 0.08) % W, s.y, 1, 1, meta.accent);
    }
    ctx.globalAlpha = 1;

    // torres de datos (parallax: lejos 0.12 → medio 0.35 → cerca 0.55)
    this._towers(ctx, camX * 0.12, H, '#080e28', 40, 8, meta.accent, t, 0.12);
    this._towers(ctx, camX * 0.35, H, '#0c1838', 64, 14, meta.accent, t, 0.28);
    this._towers(ctx, camX * 0.55, H, '#12224c', 90, 20, meta.accent, t, 0.48);

    // niebla
    ctx.fillStyle = meta.fog;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // lluvia (solo nivel 1)
    if (meta.rain) {
      ctx.strokeStyle = 'rgba(120,180,255,0.35)';
      ctx.lineWidth = 1;
      for (const r of this.rain) {
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 1, r.y + r.s); ctx.stroke();
        r.y += r.s + 6; r.x -= 1;
        if (r.y > H) { r.y = -4; r.x = Math.random() * W; }
      }
    }
  },
  _towers(ctx, off, H, col, baseY, maxH, accent, t, glowA) {
    const W = CONFIG.W;
    ctx.fillStyle = col;
    for (let i = -1; i < 8; i++) {
      const seed = Math.floor((i * 53 + off * 0.0) ) ;
      const x = ((i * 46 - (off % 46)) % (W + 46));
      const w = 22 + (i % 3) * 8;
      const h = baseY * 0.4 + ((i * 37) % maxH);
      const y = H - 28 - h;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
      // ventanas
      ctx.globalAlpha = glowA;
      ctx.fillStyle = accent;
      for (let wy = y + 3; wy < H - 30; wy += 4) {
        for (let wx = x + 2; wx < x + w - 2; wx += 4) {
          if (((wx + wy + i) * 7) % 5 === 0) ctx.fillRect(wx, wy, 1.5, 1.5);
        }
      }
      ctx.globalAlpha = 1;
    }
  },
};
