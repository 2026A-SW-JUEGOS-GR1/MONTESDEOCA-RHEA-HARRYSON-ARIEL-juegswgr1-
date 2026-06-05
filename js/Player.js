/* ====================================================================
   Player.js  -  Cientifico controlado por el jugador
   Movimiento top-down 4 direcciones + animaciones + vidas/invulnerabilidad
   ==================================================================== */

const PLAYER_IDLE_FRAME = { down: 1, right: 10, left: 19, up: 28 };

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'chars', PLAYER_IDLE_FRAME.down);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Cuerpo de colision ajustado a los "pies" del sprite (32x48)
    this.body.setSize(16, 12);
    this.body.setOffset(8, 32);
    this.setDepth(10);

    this.speed = CONFIG.PLAYER_SPEED;
    this.lives = CONFIG.START_LIVES;
    this.invulnerable = false;
    this.lastDir = 'down';

    // Controles: flechas + WASD
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update() {
    const c = this.cursors;
    const w = this.wasd;
    const left = c.left.isDown || w.left.isDown;
    const right = c.right.isDown || w.right.isDown;
    const up = c.up.isDown || w.up.isDown;
    const down = c.down.isDown || w.down.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx = -1; else if (right) vx = 1;
    if (up) vy = -1; else if (down) vy = 1;

    // Normalizar diagonal para mantener velocidad constante
    if (vx !== 0 && vy !== 0) {
      const inv = Math.SQRT1_2;
      vx *= inv;
      vy *= inv;
    }
    this.body.setVelocity(vx * this.speed, vy * this.speed);

    const moving = vx !== 0 || vy !== 0;
    let dir = this.lastDir;
    if (left) dir = 'left';
    else if (right) dir = 'right';
    else if (up) dir = 'up';
    else if (down) dir = 'down';

    if (moving) {
      this.lastDir = dir;
      this.anims.play('p_walk_' + dir, true);
    } else {
      this.anims.stop();
      this.setFrame(PLAYER_IDLE_FRAME[this.lastDir]);
    }
  }

  /* Devuelve true si el daño se aplico (no estaba invulnerable). */
  takeDamage() {
    if (this.invulnerable) return false;
    this.lives = Math.max(0, this.lives - 1);
    this.invulnerable = true;

    // Destello rojo + parpadeo
    this.setTint(0xff4444);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 110,
      yoyo: true,
      repeat: 4,
    });
    this.scene.time.delayedCall(CONFIG.INVULN_MS, () => {
      this.invulnerable = false;
      this.clearTint();
      this.alpha = 1;
    });
    return true;
  }
}
