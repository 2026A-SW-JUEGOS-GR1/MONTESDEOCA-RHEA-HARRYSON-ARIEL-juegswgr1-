/* ============================================================
   levels.js  —  Construccion de niveles (tilemaps), colocacion
   de enemigos / memorias, y guion narrativo.
   Tiles:  . vacio   # solido   B puerta blindada (dash)
           = muro de datos (fase liquida)   ? plataforma oculta (scan)
           ^ peligro   D salida   T terminal   S spawn
   ============================================================ */

function makeGrid(cols, rows) {
  const g = [];
  for (let r = 0; r < rows; r++) g.push(new Array(cols).fill('.'));
  return g;
}
function fillRect(g, c, r, w, h, ch) {
  for (let y = r; y < r + h; y++)
    for (let x = c; x < c + w; x++)
      if (g[y] && g[y][x] !== undefined) g[y][x] = ch;
}
function plat(g, c, r, len, ch = '#') { for (let x = c; x < c + len; x++) if (g[r] && g[r][x] !== undefined) g[r][x] = ch; }

/* -------- NIVEL M : DISTRITO DE DATOS BAJOS -------- */
function buildLevelM() {
  const cols = 84, rows = 14;
  const g = makeGrid(cols, rows);
  fillRect(g, 0, 12, cols, 2, '#');            // suelo continuo
  // bordes
  fillRect(g, 0, 0, 1, rows, '#'); fillRect(g, cols - 1, 0, 1, rows, '#');

  // plataformas flotantes
  [[8, 9, 4], [24, 8, 4], [31, 6, 4], [38, 9, 4], [46, 7, 5], [58, 7, 4], [64, 9, 5], [72, 6, 4]]
    .forEach(([c, r, l]) => plat(g, c, r, l));

  // puertas blindadas (dash de cortocircuito)
  fillRect(g, 20, 8, 1, 4, 'B');
  fillRect(g, 50, 7, 1, 5, 'B');

  // peligros de superficie
  g[11][16] = '^'; g[11][17] = '^';
  g[11][43] = '^'; g[11][44] = '^';

  // terminales hackeables (decor / objetivo)
  g[11][6] = 'T'; g[11][55] = 'T';

  g[11][2] = 'S';                              // spawn
  g[11][80] = 'D';                             // salida

  const enemies = [
    { type: 'drone', col: 14, row: 5 },
    { type: 'virus', col: 28, row: 8 },
    { type: 'drone', col: 40, row: 4 },
    { type: 'virus', col: 53, row: 8 },
    { type: 'drone', col: 60, row: 4 },
    { type: 'purger', col: 70, row: 10, opts: { hp: 22, dmg: 1 } }, // Guardian de Integridad MK-I
  ];
  const memories = [
    { col: 32, row: 5, text: 'MEMORIA 01 — "Vi el codigo bajo la ciudad. Alguien lo reescribia en silencio." — LORD-M' },
    { col: 65, row: 8, text: 'MEMORIA 02 — "Si destruyo el nucleo, el sistema sera libre. Estoy seguro. Casi seguro." — LORD-M' },
  ];
  // Señalizadores en bordes de precipicio / saltos de fe
  const markers = [
    { col: 15, row: 10 },
    { col: 42, row: 10 },
    { col: 57, row: 6 },
  ];
  return { grid: g, cols, rows, enemies, memories, markers, metaIndex: 0, char: 'M',
    hint: 'A/D mover · SPACE saltar (x2) · SHIFT dash · J disparar · U pesado · I STACK OVERFLOW',
    objective: 'Atraviesa el distrito y alcanza el nucleo. Recoge las memorias.' };
}

/* -------- NIVEL M (2) : SERVIDORES DE RESPALDO -------- */
function buildLevelM2() {
  const cols = 100, rows = 18;
  const g = makeGrid(cols, rows);
  fillRect(g, 0, 16, cols, 2, '#');            // suelo continuo
  fillRect(g, 0, 0, cols, 1, '#');             // techo
  fillRect(g, 0, 0, 1, rows, '#'); fillRect(g, cols - 1, 0, 1, rows, '#');

  // racks de servidores (plataformas escalonadas, sensacion de descenso/ascenso)
  [[6, 13, 4], [12, 10, 3], [18, 7, 4], [26, 9, 4], [33, 12, 4], [40, 8, 4],
   [47, 11, 5], [55, 7, 4], [62, 10, 4], [70, 13, 4], [78, 9, 4], [86, 12, 4], [92, 8, 4]]
    .forEach(([c, r, l]) => plat(g, c, r, l));

  // columnas de servidor colgando del techo
  fillRect(g, 30, 1, 1, 4, '#'); fillRect(g, 58, 1, 1, 5, '#'); fillRect(g, 82, 1, 1, 4, '#');

  // puertas blindadas (dash de cortocircuito)
  fillRect(g, 23, 12, 1, 4, 'B');
  fillRect(g, 52, 11, 1, 5, 'B');
  fillRect(g, 75, 12, 1, 4, 'B');

  // fugas de energia / peligros sobre el suelo
  g[15][16] = '^'; g[15][17] = '^';
  g[15][44] = '^'; g[15][45] = '^';
  g[15][67] = '^'; g[15][68] = '^';

  // terminales
  g[15][8] = 'T'; g[15][60] = 'T';

  g[15][2] = 'S';
  g[15][96] = 'D';

  const enemies = [
    { type: 'virus', col: 14, row: 11 },
    { type: 'virus', col: 20, row: 9 },
    { type: 'drone', col: 28, row: 5 },
    { type: 'virus', col: 36, row: 10 },
    { type: 'virus', col: 44, row: 8 },
    { type: 'drone', col: 58, row: 5 },
    { type: 'virus', col: 66, row: 9 },
    { type: 'virus', col: 72, row: 11 },
    { type: 'drone', col: 84, row: 5 },
    { type: 'purger', col: 92, row: 14, opts: { hp: 28, dmg: 1 } }, // Guardian de Integridad MK-II
  ];
  const memories = [
    { col: 19, row: 6, text: 'MEMORIA 03 — "Los respaldos estan vivos. El sistema se defiende solo." — LORD-M' },
    { col: 79, row: 8, text: 'MEMORIA 04 — "Ya no puedo detenerme. El nucleo cae conmigo." — LORD-M' },
  ];
  const markers = [
    { col: 15, row: 12 },
    { col: 43, row: 14 },
    { col: 66, row: 14 },
    { col: 85, row: 11 },
  ];
  return { grid: g, cols, rows, enemies, memories, markers, metaIndex: 1, char: 'M',
    hint: 'Enjambres de virus · usa DASH (SHIFT) en las puertas · I STACK OVERFLOW',
    objective: 'Desciende por los servidores de respaldo hasta el nucleo central.' };
}

/* -------- NIVEL Q : PASADIZOS FRAGMENTADOS -------- */
function buildLevelQ() {
  const cols = 92, rows = 16;
  const g = makeGrid(cols, rows);
  fillRect(g, 0, 14, cols, 2, '#');
  fillRect(g, 0, 0, 1, rows, '#'); fillRect(g, cols - 1, 0, 1, rows, '#');

  // plataformas de luz
  [[7, 11, 4], [14, 9, 3], [22, 11, 4], [42, 11, 4], [48, 9, 3], [56, 11, 5], [66, 9, 4], [74, 11, 4]]
    .forEach(([c, r, l]) => plat(g, c, r, l));

  // muro de datos (FASE LIQUIDA Q/F)
  fillRect(g, 30, 6, 2, 8, '=');

  // pozo con plataformas ocultas (ESCANER R)
  fillRect(g, 34, 14, 6, 2, '.');         // hueco en el suelo
  g[12][34] = '?'; g[12][36] = '?'; g[12][38] = '?';

  // muro de datos final
  fillRect(g, 62, 8, 2, 6, '=');

  // peligros
  g[13][26] = '^'; g[13][27] = '^';
  g[13][70] = '^'; g[13][71] = '^';

  g[13][2] = 'S';
  g[13][88] = 'D';

  const enemies = [
    { type: 'virus', col: 18, row: 9 },
    { type: 'virus', col: 45, row: 9 },
    { type: 'drone', col: 52, row: 5 },
    { type: 'virus', col: 68, row: 8 },
    { type: 'purger', col: 80, row: 12, opts: { hp: 30, dmg: 1 } }, // Rutina de Purga Omega
  ];
  const memories = [
    { col: 15, row: 7, text: 'MEMORIA 05 — "Encontre registros de M. Sus manos... son como las mias." — LORD-Q' },
    { col: 50, row: 7, text: 'MEMORIA 06 — "El Stack Overflow no borro el sistema. Lo partio en dos." — LORD-Q' },
    { col: 75, row: 9, text: 'MEMORIA 07 — "No estoy reconstruyendo el mundo. Me estoy reconstruyendo a mi." — LORD-Q' },
  ];
  const markers = [
    { col: 25, row: 12 },
    { col: 33, row: 13 },  // borde del pozo (saltar de fe / escaner)
    { col: 69, row: 12 },
  ];
  return { grid: g, cols, rows, enemies, memories, markers, metaIndex: 3, char: 'Q',
    hint: 'SHIFT slide · F fase liquida (muros de datos) · R escaner (plataformas) · E rebobinar · SPACE doble salto',
    objective: 'Reconstruye la ruta. Usa fase liquida, escaner y rebobinado. Reune las memorias.' };
}

/* -------- NIVEL Q (2) : HUBS CUANTICOS SUSPENDIDOS -------- */
function buildLevelQ2() {
  const cols = 76, rows = 22;
  const g = makeGrid(cols, rows);
  fillRect(g, 0, 20, cols, 2, '#');            // suelo de seguridad (caer no mata)
  fillRect(g, 0, 0, cols, 1, '#');             // techo
  fillRect(g, 0, 0, 1, rows, '#'); fillRect(g, cols - 1, 0, 1, rows, '#');

  // ascenso en zigzag (verticalidad extrema)
  plat(g, 5, 17, 4);
  plat(g, 12, 14, 4);
  plat(g, 5, 11, 4);
  plat(g, 12, 8, 4);
  plat(g, 6, 5, 4);

  // muro de datos vertical (FASE LIQUIDA F) que corta el ascenso
  fillRect(g, 18, 10, 2, 8, '=');

  // tras el muro, ruta lateral con plataformas de luz
  plat(g, 22, 14, 5);
  plat(g, 30, 12, 4);
  plat(g, 38, 14, 4);

  // gran vacio cruzado por plataformas OCULTAS (ESCANER R)
  g[10][33] = '?'; g[10][35] = '?'; g[10][37] = '?'; g[10][39] = '?';

  plat(g, 42, 9, 4);
  plat(g, 50, 11, 4);
  plat(g, 58, 8, 4);

  // segundo muro de datos en altura
  fillRect(g, 46, 4, 2, 6, '=');

  // peligros (trampas electricas)
  g[19][16] = '^'; g[19][17] = '^';
  g[13][24] = '^';
  g[19][50] = '^'; g[19][51] = '^';

  // plataforma final y salida arriba a la derecha
  plat(g, 62, 5, 7);
  g[4][66] = 'D';

  g[19][2] = 'S';

  const enemies = [
    { type: 'virus', col: 10, row: 12 },
    { type: 'drone', col: 14, row: 6 },
    { type: 'virus', col: 26, row: 11 },
    { type: 'virus', col: 36, row: 10 },
    { type: 'drone', col: 44, row: 6 },
    { type: 'virus', col: 54, row: 9 },
    { type: 'purger', col: 64, row: 18, opts: { hp: 32, dmg: 1 } }, // Rutina de Purga Sigma
  ];
  const memories = [
    { col: 13, row: 7, text: 'MEMORIA 08 — "Cada hub guarda un eco de M. Subo y lo escucho mas claro." — LORD-Q' },
    { col: 59, row: 7, text: 'MEMORIA 09 — "No quedan dudas. El residuo que me dio vida... era el." — LORD-Q' },
  ];
  return { grid: g, cols, rows, enemies, memories, markers: [
    { col: 8, row: 16 },
    { col: 15, row: 13 },
    { col: 32, row: 13 },
    { col: 49, row: 10 },
  ], metaIndex: 4, char: 'Q',
    hint: 'SUBE: doble salto · F fase liquida · R escaner (puntos cian) · E rebobinar si caes',
    objective: 'Asciende por los hubs cuanticos. Usa fase liquida y escaner para abrir la ruta.' };
}

const LEVELS = { M1: buildLevelM, M2: buildLevelM2, Q1: buildLevelQ, Q2: buildLevelQ2 };
const LEVEL_ORDER = ['M1', 'M2', 'Q1', 'Q2'];

/* -------------------- Guion / cinematicas -------------------- */
const STORY = {
  intro: [
    { t: 'NEON GRID', s: 'Una metropolis construida sobre capas de datos.', portrait: null },
    { t: 'ACTO I — LA ERA DE LORD-M', s: '"La destruccion nace de las buenas intenciones."', portrait: 'M' },
    { t: 'LORD-M', s: 'He descubierto la conspiracion. El nucleo miente. Voy a apagarlo.', portrait: 'M' },
  ],
  stackOverflow: [
    { t: 'STACK OVERFLOW', s: 'LORD-M ejecuta el comando final. El nucleo colapsa.', portrait: 'M', glitch: 1 },
    { t: '0xDEADC0DE', s: 'La pantalla se rompe. El sistema se fragmenta en codigo binario...', portrait: null, glitch: 1 },
    { t: 'FIN DEL ACTO I', s: 'Sin saberlo, LORD-M provoco una catastrofe.', portrait: null, glitch: 0.6 },
  ],
  actII: [
    { t: 'ACTO II — LA ERA DE LORD-Q', s: '"La verdad solo existe cuando las piezas vuelven a unirse."', portrait: 'Q' },
    { t: 'LORD-Q', s: 'Fui creado tras el colapso. Mi mision: reconstruir lo que se rompio.', portrait: 'Q' },
  ],
  ending: [
    { t: 'REVELACION', s: 'LORD-Q fue creado con fragmentos residuales de la conciencia de LORD-M.', portrait: 'Q' },
    { t: 'NO SON ENEMIGOS', s: 'Son la misma entidad, separada por la fractura del Stack Overflow.', portrait: 'M' },
    { t: 'REUNIFICACION', s: 'Las dos conciencias se reunen. Neon Grid vuelve a iluminarse.', portrait: null },
    { t: 'EQUILIBRIO RESTAURADO', s: 'Gracias por jugar — vertical slice.', portrait: null },
    { t: 'CREDITOS', s: 'Pulsa ENTER para volver al menu.', credits: true },
  ],
};
