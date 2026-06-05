/* ====================================================================
   util.js  -  Constantes globales y utilidades compartidas
   ==================================================================== */

const CONFIG = {
  WIDTH: 800,
  HEIGHT: 640,
  TILE: 32,
  COLS: 25,
  ROWS: 20,
  PLAYER_SPEED: 160,   // px/s
  START_LIVES: 3,
  TOTAL_CARDS: 5,
  TIME_LIMIT: 120,     // 02:00 en segundos
  POINTS_PER_CARD: 100,
  INVULN_MS: 1000,     // invulnerabilidad tras recibir daño
};

/* Indices de tile dentro de lab_tiles.png */
const TILE = {
  FLOOR: 0,
  FLOOR_GRID: 1,
  FLOOR_NEON: 2,
  HAZARD: 3,        // decal toxico (NO solido)
  WALL: 4,
  WALL_LIGHT: 5,
  CONTAINER: 6,
  CONSOLE: 7,
  BARRIER: 8,
  DOOR_LOCKED: 9,
  DOOR_OPEN: 10,
};

/* Tiles que bloquean al jugador */
const SOLID_TILES = [TILE.WALL, TILE.WALL_LIGHT, TILE.CONTAINER, TILE.CONSOLE, TILE.BARRIER];

/* Paleta sci-fi (para textos / UI) */
const COLORS = {
  neon: '#39ff78',
  neonHex: 0x39ff78,
  cyan: '#5ac8e6',
  text: '#dffbff',
  warn: '#ff5a5a',
  panel: 0x0a0e18,
  panelStroke: 0x39ff78,
  btn: 0x163248,
  btnHover: 0x1d4a6b,
};

const Util = {
  /* Crea un boton estilizado (container con fondo redondeado + texto). */
  createButton(scene, x, y, label, onClick, opts = {}) {
    const w = opts.width || 260;
    const h = opts.height || 56;
    const fontSize = opts.fontSize || '24px';

    const c = scene.add.container(x, y);
    const g = scene.add.graphics();

    const paint = (fill, stroke) => {
      g.clear();
      g.fillStyle(fill, 0.92);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.lineStyle(2, stroke, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    };
    paint(COLORS.btn, COLORS.neonHex);

    const t = scene.add.text(0, 0, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: fontSize,
      color: COLORS.text,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });

    c.on('pointerover', () => {
      paint(COLORS.btnHover, 0x7dffb0);
      scene.tweens.add({ targets: c, scale: 1.05, duration: 100 });
    });
    c.on('pointerout', () => {
      paint(COLORS.btn, COLORS.neonHex);
      scene.tweens.add({ targets: c, scale: 1, duration: 100 });
    });
    c.on('pointerdown', () => {
      if (window.audioManager) audioManager.playClick();
      scene.tweens.add({ targets: c, scale: 0.95, duration: 60, yoyo: true });
      onClick();
    });
    return c;
  },

  /* Convierte segundos a formato mm:ss */
  formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /* Centro en pixeles de un tile */
  tileCenter(col, row) {
    return { x: col * CONFIG.TILE + CONFIG.TILE / 2, y: row * CONFIG.TILE + CONFIG.TILE / 2 };
  },
};
