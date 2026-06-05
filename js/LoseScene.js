/* ====================================================================
   LoseScene.js  -  Pantalla de derrota (Game Over)
   ==================================================================== */

class LoseScene extends Phaser.Scene {
  constructor() { super('LoseScene'); }

  init(data) {
    this.reason = data.reason || 'GAME OVER';
    this.finalScore = data.score || 0;
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.cameras.main.setBackgroundColor('#160808');

    this.add.text(W / 2, 160, 'GAME OVER', {
      fontFamily: 'Courier New, monospace', fontSize: '64px',
      color: COLORS.warn, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#ff3030', 18, true, true);

    this.add.text(W / 2, 250, 'MOTIVO:', {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: COLORS.text,
    }).setOrigin(0.5);

    this.add.text(W / 2, 300, this.reason, {
      fontFamily: 'Courier New, monospace', fontSize: '36px', color: '#ffb3b3', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, 370, 'PUNTAJE: ' + this.finalScore, {
      fontFamily: 'Courier New, monospace', fontSize: '24px', color: COLORS.cyan,
    }).setOrigin(0.5);

    Util.createButton(this, W / 2, 470, 'REINTENTAR', () => {
      audioManager.startMusic();
      this.scene.start('GameScene');
    }, { width: 300 });

    Util.createButton(this, W / 2, 535, 'MENU PRINCIPAL', () => {
      this.scene.start('MenuScene');
    }, { width: 300, height: 44, fontSize: '18px' });
  }
}
