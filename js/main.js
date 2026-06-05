/* ====================================================================
   main.js  -  Configuracion de Phaser 3 + escena de carga (Boot)
   ==================================================================== */

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.cameras.main.setBackgroundColor('#0a0e18');

    this.add.text(W / 2, H / 2 - 60, 'CARGANDO...', {
      fontFamily: 'Courier New, monospace', fontSize: '24px', color: COLORS.neon,
    }).setOrigin(0.5);

    const barW = 400;
    const box = this.add.graphics();
    box.lineStyle(2, COLORS.neonHex, 1);
    box.strokeRect(W / 2 - barW / 2, H / 2 - 12, barW, 24);
    const bar = this.add.graphics();

    this.load.on('progress', (p) => {
      bar.clear();
      bar.fillStyle(COLORS.neonHex, 1);
      bar.fillRect(W / 2 - barW / 2 + 3, H / 2 - 9, (barW - 6) * p, 18);
    });

    // Assets
    this.load.spritesheet('chars', 'assets/LabNPCs.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('tiles', 'assets/lab_tiles.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('keycard', 'assets/keycard.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.scene.start('MenuScene');
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#0a0e18',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, WinScene, LoseScene],
};

const game = new Phaser.Game(config);
