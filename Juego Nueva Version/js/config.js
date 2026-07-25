/* ============================================================
   config.js  —  Constantes globales, paletas y utilidades.
   LORD-M // LORD-Q : Fractura del Sistema
   ============================================================ */

const CONFIG = {
  W: 320,            // resolucion base (GDD)
  H: 180,
  SCALE: 4,          // escalado x4 -> 1280x720
  GRAVITY: 0.55,
  MAX_FALL: 9,
  TILE: 16,
  FPS: 60,
  // Multiplicadores de velocidad (1 = original). Mas bajo = mas lento.
  SPEED: 0.55,        // movimiento del jugador (ejes X e Y)
  ENEMY_SPEED: 0.45,  // movimiento de los enemigos
  PROJ_SPEED: 0.45,   // velocidad de los proyectiles
  TOTAL_MEMORIES: 9,  // memorias coleccionables en total
  // Game feel
  COYOTE_TIME: 0.1,   // 100ms salto tras caer del borde
  JUMP_BUFFER: 0.1,   // 100ms buffer de salto anticipado
  HARD_LAND_VY: 6,    // umbral de shake por caida fuerte
  INVULN_TIME: 1.5,   // iFrames al recibir daño
  RUN_TRAIL_SPEED: 1.4,
  FADE_DURATION: 1.0,
  // Cooldowns Q (maximos para barras HUD)
  LIQUID_CD_MAX: 1.6,
  SCAN_CD_MAX: 1.2,
  REWIND_CD_MAX: 3,
  LIQUID_DUR: 1.1,
};

/* Paleta cyberpunk base */
const C = {
  black:   '#04050d',
  void:    '#02030a',
  panel:   '#0b1024',
  panel2:  '#121a38',
  steel:   '#2a3358',
  steel2:  '#3c4878',
  white:   '#e8f6ff',
  cyan:    '#33e5ff',
  cyanD:   '#0a9bd6',
  blue:    '#3a7bff',
  neon:    '#19f0c8',
  magenta: '#ff3df0',
  pink:    '#ff5fa8',
  purple:  '#9b4dff',
  yellow:  '#ffd23a',
  amber:   '#ff9b21',
  red:     '#ff3b4e',
  green:   '#5dff8f',
  grayD:   '#161a2c',
};

/* Colores de LORD-M (segun arte: pelo azul, bufanda roja, armadura amarilla) */
const M_COL = {
  hair:  '#1f8ca6',
  hairL: '#39b7cf',
  skin:  '#f0d9b8',
  scarf: '#c0252b',
  scarfL:'#e3403f',
  armor: '#f2b324',
  armorD:'#c8870f',
  body:  '#2a2d33',
  bodyL: '#3a3e46',
  boot:  '#e0a01e',
  eye:   '#ffffff',
};

/* Colores de LORD-Q (NEGRO: gorro y traje negros, pelo verde, pañuelo rojo) */
const Q_COL = {
  cap:   '#15151b',
  capL:  '#2a2a34',
  hair:  '#5dd92e',
  hairL: '#84f24c',
  skin:  '#f3d2ab',
  scarf: '#d6322e',
  body:  '#101015',
  bodyL: '#23232c',
  boot:  '#0a0a0e',
  eye:   '#ffffff',
  data:  '#33e5ff',
};

/* Paletas/ambiente por nivel (corrupcion creciente) */
const LEVELS_META = [
  { id: 1, act: 1, char: 'M', name: 'DISTRITO DE DATOS BAJOS',     bg: ['#06122a', '#0a2342', '#123a5c'], accent: C.cyan,    fog: 'rgba(20,60,110,0.35)', corruption: 0.05, rain: true },
  { id: 2, act: 1, char: 'M', name: 'SERVIDORES DE RESPALDO',      bg: ['#160a2a', '#2a0e3e', '#0c2a2e'], accent: C.magenta, fog: 'rgba(80,20,90,0.30)',  corruption: 0.28, rain: false },
  { id: 3, act: 1, char: 'M', name: 'NUCLEO DEL SISTEMA CENTRAL',  bg: ['#2a0712', '#3a0a1c', '#120a2e'], accent: C.red,     fog: 'rgba(120,20,40,0.30)', corruption: 0.55, rain: false },
  { id: 4, act: 2, char: 'Q', name: 'PASADIZOS FRAGMENTADOS',      bg: ['#01040e', '#03101f', '#05202f'], accent: C.cyan,    fog: 'rgba(0,40,70,0.25)',   corruption: 0.35, rain: false },
  { id: 5, act: 2, char: 'Q', name: 'HUBS CUANTICOS SUSPENDIDOS',  bg: ['#031018', '#06202a', '#0a2e3a'], accent: C.neon,    fog: 'rgba(0,60,80,0.22)',   corruption: 0.45, rain: false },
  { id: 6, act: 2, char: 'Q', name: 'ARCHIVO CORRUPTO',            bg: ['#0a0520', '#1a0a30', '#2a0a30'], accent: C.purple,  fog: 'rgba(60,20,90,0.30)',  corruption: 0.85, rain: false },
];

/* Utilidades */
const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  rectsOverlap: (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
  sign: (v) => (v > 0 ? 1 : v < 0 ? -1 : 0),
  approach: (v, target, step) => {
    if (v < target) return Math.min(v + step, target);
    if (v > target) return Math.max(v - step, target);
    return v;
  },
};
