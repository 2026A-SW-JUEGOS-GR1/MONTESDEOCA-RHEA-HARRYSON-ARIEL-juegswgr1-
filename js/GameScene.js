/* ====================================================================
   GameScene.js  -  Nucleo del juego: mapa, jugador, enemigos, tarjetas,
   puerta, UI, colisiones, temporizador y condiciones de victoria/derrota.
   ==================================================================== */

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.gameOver = false;
    this.score = 0;
    this.cardsCollected = 0;
    this.timeLeft = CONFIG.TIME_LIMIT;
    this.doorUnlocked = false;

    this.createAnimations();

    // ---------- Mapa por tiles ----------
    const mapData = this.buildMapData();
    this.map = this.make.tilemap({ data: mapData, tileWidth: CONFIG.TILE, tileHeight: CONFIG.TILE });
    const tileset = this.map.addTilesetImage('tiles');
    this.layer = this.map.createLayer(0, tileset, 0, 0);
    this.layer.setCollision(SOLID_TILES);

    this.physics.world.setBounds(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // ---------- Jugador ----------
    const start = Util.tileCenter(2, 2);
    this.player = new Player(this, start.x, start.y);
    this.physics.add.collider(this.player, this.layer);

    // ---------- Tarjetas ----------
    this.createCards();

    // ---------- Puerta de salida ----------
    const doorPos = Util.tileCenter(24, 14);
    this.door = this.physics.add.staticImage(doorPos.x, doorPos.y, 'tiles', TILE.DOOR_LOCKED).setDepth(5);
    this.doorCollider = this.physics.add.collider(this.player, this.door);

    // ---------- Enemigos ----------
    this.createEnemies();

    // ---------- UI ----------
    this.ui = new UIManager(this);
    this.ui.setScore(this.score);
    this.ui.setLives(this.player.lives);
    this.ui.setCards(this.cardsCollected, CONFIG.TOTAL_CARDS);
    this.ui.banner('Encuentra 5 tarjetas y escapa', COLORS.cyan);

    // ---------- Temporizador ----------
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: this.onTick, callbackScope: this,
    });

    // ---------- Volver al menu con ESC ----------
    this.input.keyboard.on('keydown-ESC', () => {
      audioManager.stopMusic();
      this.scene.start('MenuScene');
    });
  }

  /* ---------------- Animaciones ---------------- */
  createAnimations() {
    const mk = (key, frames, rate = 8) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('chars', { frames }),
        frameRate: rate, repeat: -1,
      });
    };
    // Jugador (cientifico rojo, columnas 0-2)
    // Fila 2 (9-17) = mirando a la DERECHA, Fila 3 (18-26) = mirando a la IZQUIERDA
    mk('p_walk_down', [0, 1, 2]);
    mk('p_walk_right', [9, 10, 11]);
    mk('p_walk_left', [18, 19, 20]);
    mk('p_walk_up', [27, 28, 29]);
    // Enemigo (hazmat naranja, columnas 6-8)
    mk('e_walk_down', [6, 7, 8], 6);
    mk('e_walk_right', [15, 16, 17], 6);
    mk('e_walk_left', [24, 25, 26], 6);
    mk('e_walk_up', [33, 34, 35], 6);
    // Tarjeta
    if (!this.anims.exists('card_float')) {
      this.anims.create({
        key: 'card_float',
        frames: this.anims.generateFrameNumbers('keycard', { start: 0, end: 1 }),
        frameRate: 3, repeat: -1,
      });
    }
  }

  /* ---------------- Construccion del mapa (5 zonas) ---------------- */
  buildMapData() {
    const { COLS, ROWS } = CONFIG;
    const d = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push(TILE.FLOOR);
      d.push(row);
    }
    // Variedad de piso
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if ((r * 3 + c) % 7 === 0) d[r][c] = TILE.FLOOR_GRID;

    // Borde exterior
    for (let c = 0; c < COLS; c++) { d[0][c] = TILE.WALL; d[ROWS - 1][c] = TILE.WALL; }
    for (let r = 0; r < ROWS; r++) { d[r][0] = TILE.WALL; d[r][COLS - 1] = TILE.WALL; }

    // Muros verticales (mitad superior) col 8 y 16, filas 1-8
    for (let r = 1; r <= 8; r++) { d[r][8] = TILE.WALL; d[r][16] = TILE.WALL; }
    // Muro horizontal fila 10 con huecos (puertas) en col 4, 12, 20
    for (let c = 1; c <= 23; c++) if (c !== 4 && c !== 12 && c !== 20) d[10][c] = TILE.WALL;
    // Muros verticales (mitad inferior) col 8 y 16, filas 11-18, hueco en fila 14
    for (let r = 11; r <= 18; r++) if (r !== 14) { d[r][8] = TILE.WALL; d[r][16] = TILE.WALL; }

    // Luces de pared
    d[4][8] = TILE.WALL_LIGHT; d[4][16] = TILE.WALL_LIGHT;
    d[10][2] = TILE.WALL_LIGHT; d[10][22] = TILE.WALL_LIGHT;

    // Acentos neon en el pasillo (fila 9)
    for (let c = 1; c <= 23; c++) if (d[9][c] === TILE.FLOOR) d[9][c] = TILE.FLOOR_NEON;

    // Decals toxicos (zona peligrosa, NO solidos)
    [[15, 17], [16, 18], [17, 20], [13, 21], [16, 22]].forEach(([r, c]) => {
      if (d[r][c] === TILE.FLOOR || d[r][c] === TILE.FLOOR_GRID) d[r][c] = TILE.HAZARD;
    });

    // Obstaculos solidos (equipo de laboratorio, contenedores, barreras)
    const obstacles = [
      [3, 3, TILE.CONTAINER], [3, 4, TILE.CONTAINER],   // zona 1
      [3, 19, TILE.CONSOLE],                            // zona 2
      [7, 12, TILE.CONSOLE],                            // zona 2/3
      [12, 3, TILE.CONTAINER],                          // zona 3
      [16, 11, TILE.CONTAINER],                         // zona 3
      [13, 18, TILE.CONSOLE],                           // zona 4
      [16, 18, TILE.BARRIER], [17, 18, TILE.BARRIER],   // zona 4 (barreras)
    ];
    obstacles.forEach(([r, c, t]) => { d[r][c] = t; });

    // Hueco en el borde derecho para la puerta de salida
    d[14][COLS - 1] = TILE.FLOOR;

    return d;
  }

  /* ---------------- Tarjetas ---------------- */
  createCards() {
    this.cards = this.physics.add.group();
    const positions = [
      [12, 2],   // zona 2 (sala superior central)
      [21, 2],   // zona 2 (sala superior derecha)
      [4, 15],   // zona 3 (sala inferior izquierda)
      [12, 13],  // zona 3 (sala inferior central)
      [20, 12],  // zona 4 (sala inferior derecha, cerca de la salida)
    ];
    positions.forEach(([col, row]) => {
      const p = Util.tileCenter(col, row);
      const card = this.cards.create(p.x, p.y, 'keycard', 0).setDepth(6);
      card.play('card_float');
      card.body.setSize(20, 16);
      this.tweens.add({ targets: card, y: p.y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    this.physics.add.overlap(this.player, this.cards, this.collectCard, null, this);
  }

  /* ---------------- Enemigos ---------------- */
  createEnemies() {
    this.enemies = this.physics.add.group();
    const defs = [
      { col: 12, row: 9, axis: 'h', range: 5, speed: 70 },  // pasillo central
      { col: 4, row: 14, axis: 'v', range: 3, speed: 60 },  // zona 3 izquierda
      { col: 19, row: 15, axis: 'v', range: 3, speed: 65 }, // zona 4 (peligrosa)
      { col: 21, row: 14, axis: 'v', range: 3, speed: 70 }, // zona 4 (peligrosa, custodia salida)
    ];
    defs.forEach((def) => {
      const e = new Enemy(this, def);
      this.enemies.add(e);
    });
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.overlap(this.player, this.enemies, this.hitByEnemy, null, this);
  }

  /* ---------------- Eventos ---------------- */
  collectCard(player, card) {
    card.disableBody(true, true);
    this.cardsCollected++;
    this.score += CONFIG.POINTS_PER_CARD;
    this.ui.setScore(this.score);
    this.ui.setCards(this.cardsCollected, CONFIG.TOTAL_CARDS);
    audioManager.playPickup();

    if (this.cardsCollected >= CONFIG.TOTAL_CARDS) this.unlockDoor();
  }

  unlockDoor() {
    this.doorUnlocked = true;
    this.door.setFrame(TILE.DOOR_OPEN);
    if (this.doorCollider) this.physics.world.removeCollider(this.doorCollider);
    this.physics.add.overlap(this.player, this.door, this.reachExit, null, this);
    audioManager.playUnlock();
    this.ui.banner('SALIDA DESBLOQUEADA', COLORS.neon);
    this.tweens.add({ targets: this.door, scale: 1.12, duration: 300, yoyo: true, repeat: 2 });
  }

  hitByEnemy(player, enemy) {
    if (this.gameOver) return;
    if (player.takeDamage()) {
      audioManager.playDamage();
      this.ui.setLives(player.lives);
      if (player.lives <= 0) this.lose('SIN SIGNOS VITALES');
    }
  }

  reachExit() {
    if (!this.doorUnlocked || this.gameOver) return;
    this.win();
  }

  onTick() {
    if (this.gameOver) return;
    this.timeLeft--;
    this.ui.setTime(this.timeLeft);
    if (this.timeLeft <= 0) this.lose('TIEMPO AGOTADO');
  }

  win() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.timerEvent.remove();
    audioManager.stopMusic();
    audioManager.playWin();
    this.scene.start('WinScene', { score: this.score, timeLeft: this.timeLeft });
  }

  lose(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.timerEvent.remove();
    audioManager.stopMusic();
    audioManager.playLose();
    this.player.body.setVelocity(0, 0);
    this.scene.start('LoseScene', { reason, score: this.score });
  }

  update() {
    if (this.gameOver) return;
    this.player.update();
    this.enemies.children.iterate((e) => { if (e) e.update(); });
  }
}
