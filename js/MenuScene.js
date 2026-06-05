/* ====================================================================
   MenuScene.js  -  Pantalla principal
   ==================================================================== */

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    this.cameras.main.setBackgroundColor('#0a0e18');
    this.buildBackground();

    // Titulo
    this.add.text(W / 2, 110, 'ESCAPE DEL', {
      fontFamily: 'Courier New, monospace', fontSize: '46px',
      color: COLORS.cyan, fontStyle: 'bold',
    }).setOrigin(0.5);

    const lab = this.add.text(W / 2, 165, 'LABORATORIO', {
      fontFamily: 'Courier New, monospace', fontSize: '64px',
      color: COLORS.neon, fontStyle: 'bold',
    }).setOrigin(0.5);
    lab.setShadow(0, 0, '#39ff78', 18, true, true);
    this.tweens.add({ targets: lab, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Narrativa breve
    this.add.text(W / 2, 230,
      'Una fuga quimica ha contaminado el laboratorio.\nRecoge 5 tarjetas de acceso y escapa antes de que sea tarde.',
      {
        fontFamily: 'Courier New, monospace', fontSize: '16px',
        color: COLORS.text, align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);

    // Cientifico animado de muestra
    this.anims.create({
      key: 'menu_walk',
      frames: this.anims.generateFrameNumbers('chars', { frames: [0, 1, 2] }),
      frameRate: 6, repeat: -1,
    });
    const hero = this.add.sprite(W / 2 - 250, 360, 'chars').setScale(3);
    hero.play('menu_walk');

    // Tarjeta flotante de muestra
    this.anims.create({
      key: 'menu_card',
      frames: this.anims.generateFrameNumbers('keycard', { start: 0, end: 1 }),
      frameRate: 4, repeat: -1,
    });
    const card = this.add.sprite(W / 2 + 250, 360, 'keycard').setScale(3);
    card.play('menu_card');
    this.tweens.add({ targets: card, y: 340, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Botones
    Util.createButton(this, W / 2, 350, 'JUGAR', () => {
      audioManager.startMusic();
      this.scene.start('GameScene');
    });
    Util.createButton(this, W / 2, 420, 'INSTRUCCIONES', () => this.showInstructions());
    Util.createButton(this, W / 2, 490, 'SALIR', () => this.showExit());

    this.add.text(W / 2, H - 24, 'Controles: Flechas / WASD para moverte', {
      fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#7fa8b8',
    }).setOrigin(0.5);
  }

  buildBackground() {
    // Lineas neon verticales en movimiento (fondo animado)
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(0, CONFIG.WIDTH);
      const line = this.add.rectangle(x, -20, 2, Phaser.Math.Between(40, 120), 0x1f6e4a, 0.5);
      this.tweens.add({
        targets: line,
        y: CONFIG.HEIGHT + 120,
        duration: Phaser.Math.Between(4000, 9000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        onRepeat: () => { line.x = Phaser.Math.Between(0, CONFIG.WIDTH); },
      });
    }
  }

  showInstructions() {
    const panel = this.makeOverlay('INSTRUCCIONES',
      [
        'OBJETIVO:',
        '  Recolecta las 5 tarjetas de acceso repartidas',
        '  por el laboratorio y llega a la puerta de salida.',
        '',
        'CONTROLES:',
        '  Flechas o WASD  ->  Mover al cientifico',
        '',
        'CUIDADO:',
        '  Los mutantes toxicos te quitan una vida al tocarte.',
        '  Tienes 3 vidas y 2:00 minutos.',
        '',
        'La puerta se desbloquea solo con las 5 tarjetas.',
      ].join('\n'));
  }

  showExit() {
    this.makeOverlay('SALIR',
      'Gracias por jugar.\n\nPuedes cerrar esta pestana del navegador\npara salir del juego.',
      true);
    try { window.close(); } catch (e) {}
  }

  makeOverlay(title, body) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const layer = this.add.container(0, 0).setDepth(2000);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0x0c1322, 0.98);
    g.fillRoundedRect(W / 2 - 320, 120, 640, 400, 16);
    g.lineStyle(2, COLORS.neonHex, 1);
    g.strokeRoundedRect(W / 2 - 320, 120, 640, 400, 16);

    const tt = this.add.text(W / 2, 155, title, {
      fontFamily: 'Courier New, monospace', fontSize: '30px', color: COLORS.neon, fontStyle: 'bold',
    }).setOrigin(0.5);
    const bt = this.add.text(W / 2, 310, body, {
      fontFamily: 'Courier New, monospace', fontSize: '17px', color: COLORS.text,
      align: 'left', lineSpacing: 6,
    }).setOrigin(0.5);

    const close = Util.createButton(this, W / 2, 475, 'VOLVER', () => layer.destroy(), { width: 180, height: 46, fontSize: '20px' });
    layer.add([dim, g, tt, bt, close]);
    return layer;
  }
}
