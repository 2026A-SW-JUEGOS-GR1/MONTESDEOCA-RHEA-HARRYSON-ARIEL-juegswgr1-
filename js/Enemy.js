/* ====================================================================
   Enemy.js  -  Mutante toxico con patrulla simple (Punto A <-> Punto B)
   ==================================================================== */

class Enemy extends Phaser.Physics.Arcade.Sprite {
  /*
    def = { col, row, axis:'h'|'v', range (en tiles), speed }
  */
  constructor(scene, def) {
    const center = Util.tileCenter(def.col, def.row);
    super(scene, center.x, center.y, 'chars', 6); // 6 = hazmat naranja (frente)
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(16, 12);
    this.body.setOffset(8, 32);
    this.setDepth(8);

    this.axis = def.axis;
    this.range = (def.range || 3) * CONFIG.TILE;
    this.speed = def.speed || 60;
    this.startX = center.x;
    this.startY = center.y;
    this.dir = 1; // 1 = derecha/abajo, -1 = izquierda/arriba
  }

  update() {
    if (this.axis === 'h') {
      const dx = this.x - this.startX;
      if (this.dir > 0 && (dx >= this.range || this.body.blocked.right)) this.dir = -1;
      else if (this.dir < 0 && (dx <= -this.range || this.body.blocked.left)) this.dir = 1;
      this.body.setVelocity(this.dir * this.speed, 0);
      this.anims.play(this.dir > 0 ? 'e_walk_right' : 'e_walk_left', true);
    } else {
      const dy = this.y - this.startY;
      if (this.dir > 0 && (dy >= this.range || this.body.blocked.down)) this.dir = -1;
      else if (this.dir < 0 && (dy <= -this.range || this.body.blocked.up)) this.dir = 1;
      this.body.setVelocity(0, this.dir * this.speed);
      this.anims.play(this.dir > 0 ? 'e_walk_down' : 'e_walk_up', true);
    }
  }
}
