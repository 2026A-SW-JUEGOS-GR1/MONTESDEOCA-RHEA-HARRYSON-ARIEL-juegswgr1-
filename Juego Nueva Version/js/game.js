/* ============================================================
   game.js  —  Bucle principal, pipeline de render (320x180 ->
   post-proceso FX -> escalado x4) y maquina de escenas.
   LORD-M // LORD-Q : Fractura del Sistema
   ============================================================ */

const Game = {
  W: CONFIG.W, H: CONFIG.H,
  scene: null,
  curLevel: null,
  memories: 0,
  audioStarted: false,
  img: { M: null, Q: null },
  last: 0,
  // Fade monitor (apagado / encendido)
  fadeAlpha: 0,
  fadeDir: 0,       // 1 = out, -1 = in, 0 = idle
  fadeSpeed: 1,     // unidades por segundo (1 = 1s a full)
  _fadeCallback: null,
  inputLocked: false,

  init() {
    this.display = document.getElementById('screen');
    this.dctx = this.display.getContext('2d');
    this.dctx.imageSmoothingEnabled = false;

    this.uiCanvas = document.getElementById('ui');
    this.uctx = this.uiCanvas.getContext('2d');

    this.base = document.createElement('canvas'); this.base.width = this.W; this.base.height = this.H;
    this.bctx = this.base.getContext('2d'); this.bctx.imageSmoothingEnabled = false;
    this.fxc = document.createElement('canvas'); this.fxc.width = this.W; this.fxc.height = this.H;
    this.fxCtx = this.fxc.getContext('2d'); this.fxCtx.imageSmoothingEnabled = false;

    Input.init();
    FX.init();
    Backdrop.init();

    this.img.M = new Image(); this.img.M.src = 'assets/lordM.png';
    this.img.Q = new Image(); this.img.Q.src = 'assets/lordQ.png';
    this.img.M3d = new Image(); this.img.M3d.src = encodeURI('assets/LORD M 3D.png');
    this.img.Q3d = new Image(); this.img.Q3d.src = encodeURI('assets/LORD Q 3D.png');

    this.hint = document.getElementById('hint');

    this.setScene(new MenuScene(this));
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  setScene(s) {
    this.scene = s;
    if (s.enter) s.enter();
  },

  /** Fundido a negro; al terminar ejecuta cb (cambio de escena). */
  fadeOut(cb) {
    this.fadeDir = 1;
    this.fadeSpeed = 1 / CONFIG.FADE_DURATION;
    this._fadeCallback = cb || null;
    this.inputLocked = true;
  },
  /** Fundido desde negro al entrar en una escena. */
  fadeIn() {
    this.fadeAlpha = 1;
    this.fadeDir = -1;
    this.fadeSpeed = 1 / (CONFIG.FADE_DURATION || 1);
    this._fadeCallback = null;
  },

  _updateFade(dt) {
    if (this.fadeDir === 0) return;
    const speed = this.fadeSpeed || 1;
    this.fadeAlpha = U.clamp(this.fadeAlpha + this.fadeDir * speed * dt, 0, 1);
    if (this.fadeDir > 0 && this.fadeAlpha >= 1) {
      this.fadeDir = 0;
      const cb = this._fadeCallback;
      this._fadeCallback = null;
      if (cb) cb();
    } else if (this.fadeDir < 0 && this.fadeAlpha <= 0) {
      this.fadeDir = 0;
      this.fadeAlpha = 0;
      this.inputLocked = false;
    }
  },

  /* ---- flujo narrativo ---- */
  beginRun() {
    this.memories = 0;
    this.fadeOut(() => {
      this.setScene(new CutsceneScene(this, STORY.intro, () => {
        this.fadeOut(() => this.startLevel('M1'));
      }));
      this.fadeIn();
    });
  },
  startLevel(key) {
    this.curLevel = key;
    this.setScene(new GameScene(this, key));
    this.fadeIn();
  },
  levelDone() {
    // Llamado tras fadeOut del nivel; la siguiente escena hace fadeIn
    switch (this.curLevel) {
      case 'M1':
        this.startLevel('M2');
        break;
      case 'M2': {
        const pages = STORY.stackOverflow.concat(STORY.actII);
        this.setScene(new CutsceneScene(this, pages, () => {
          this.fadeOut(() => this.startLevel('Q1'));
        }));
        this.fadeIn();
        break;
      }
      case 'Q1':
        this.startLevel('Q2');
        break;
      case 'Q2':
      default:
        this.setScene(new CutsceneScene(this, STORY.ending, () => {
          this.fadeOut(() => this.toMenu());
        }));
        this.fadeIn();
    }
  },
  toMenu() {
    Audio2.stopCrit();
    this.setScene(new MenuScene(this));
    this.fadeIn();
  },

  loop(now) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05;

    if (!this.audioStarted && Input.anyKey) {
      Audio2.init(); Audio2.resume();
      this.audioStarted = true;
      Audio2.startMusic(this.scene.musicMood || 'Q');
      if (this.hint) this.hint.classList.add('hidden');
    }
    if (Input.justDown('mute') && this.audioStarted) Audio2.toggleMute();
    if (Input.justDown('back') && !this.inputLocked) this.toMenu();

    this._updateFade(dt);
    if (this.scene && this.scene.update) this.scene.update(dt);

    const S = CONFIG.SCALE;
    this.uctx.setTransform(1, 0, 0, 1, 0, 0);
    this.uctx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
    this.uctx.setTransform(S, 0, 0, S, 0, 0);
    this.uctx.imageSmoothingEnabled = true;
    this.uctx.textBaseline = 'middle';

    this.bctx.imageSmoothingEnabled = false;
    if (this.scene && this.scene.draw) this.scene.draw(this.bctx);

    FX.render(this.base, this.fxCtx, dt);

    this.dctx.imageSmoothingEnabled = false;
    this.dctx.clearRect(0, 0, this.display.width, this.display.height);
    this.dctx.drawImage(this.fxc, 0, 0, this.W, this.H, 0, 0, this.display.width, this.display.height);

    // overlay de fade (monitor apagado) sobre display + UI
    if (this.fadeAlpha > 0) {
      this.dctx.globalAlpha = this.fadeAlpha;
      this.dctx.fillStyle = '#000';
      this.dctx.fillRect(0, 0, this.display.width, this.display.height);
      this.dctx.globalAlpha = 1;
      this.uctx.setTransform(1, 0, 0, 1, 0, 0);
      this.uctx.globalAlpha = this.fadeAlpha;
      this.uctx.fillStyle = '#000';
      this.uctx.fillRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
      this.uctx.globalAlpha = 1;
    }

    Input.postUpdate();
    requestAnimationFrame((t) => this.loop(t));
  },
};

MenuScene.prototype.musicMood = 'Q';
GameScene.prototype.musicMood = undefined;

window.addEventListener('load', () => Game.init());
