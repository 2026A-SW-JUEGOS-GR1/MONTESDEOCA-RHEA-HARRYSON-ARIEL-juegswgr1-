/* ====================================================================
   WinScene.js  -  Pantalla de victoria
   ==================================================================== */

class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.timeLeft = (data.timeLeft != null) ? data.timeLeft : 0;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.cameras.main.setBackgroundColor('#06140c');

    this.add.text(W / 2, 130, 'MISION COMPLETADA', {
      fontFamily: 'Courier New, monospace', fontSize: '52px',
      color: COLORS.neon, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#39ff78', 16, true, true);

    this.add.text(W / 2, 195, 'Has escapado del laboratorio.', {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: COLORS.text,
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, 'PUNTAJE FINAL: ' + this.finalScore, {
      fontFamily: 'Courier New, monospace', fontSize: '30px', color: COLORS.cyan, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, 'TIEMPO RESTANTE: ' + Util.formatTime(this.timeLeft), {
      fontFamily: 'Courier New, monospace', fontSize: '24px', color: COLORS.text,
    }).setOrigin(0.5);

    // Cientifico celebrando
    if (!this.anims.exists('win_walk')) {
      this.anims.create({
        key: 'win_walk',
        frames: this.anims.generateFrameNumbers('chars', { frames: [0, 1, 2] }),
        frameRate: 8, repeat: -1,
      });
    }
    const hero = this.add.sprite(W / 2, 430, 'chars').setScale(3).play('win_walk');
    this.tweens.add({ targets: hero, y: 415, duration: 400, yoyo: true, repeat: -1 });

    Util.createButton(this, W / 2, 540, 'JUGAR DE NUEVO', () => {
      audioManager.startMusic();
      this.scene.start('GameScene');
    }, { width: 320 });

    Util.createButton(this, W / 2, 600, 'MENU PRINCIPAL', () => {
      this.scene.start('MenuScene');
    }, { width: 320, height: 44, fontSize: '18px' });
  }
}
