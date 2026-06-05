/* ====================================================================
   UIManager.js  -  HUD permanente: Puntaje, Vidas, Tarjetas, Tiempo
   ==================================================================== */

class UIManager {
  constructor(scene) {
    this.scene = scene;
    const W = CONFIG.WIDTH;
    const barH = 30;

    // Barra de fondo del HUD
    const g = scene.add.graphics().setDepth(1000).setScrollFactor(0);
    g.fillStyle(COLORS.panel, 0.82);
    g.fillRect(0, 0, W, barH);
    g.lineStyle(2, COLORS.neonHex, 1);
    g.lineBetween(0, barH, W, barH);

    const style = {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: COLORS.text,
      fontStyle: 'bold',
    };

    this.scoreText = scene.add.text(10, 7, '', style).setDepth(1001).setScrollFactor(0);
    this.livesText = scene.add.text(225, 7, '', style).setDepth(1001).setScrollFactor(0);
    this.cardsText = scene.add.text(400, 7, '', style).setDepth(1001).setScrollFactor(0);
    this.timeText = scene.add.text(W - 150, 7, '', { ...style, color: COLORS.neon })
      .setDepth(1001).setScrollFactor(0);

    this.setScore(0);
    this.setLives(CONFIG.START_LIVES);
    this.setCards(0, CONFIG.TOTAL_CARDS);
    this.setTime(CONFIG.TIME_LIMIT);
  }

  setScore(v) { this.scoreText.setText('PUNTAJE: ' + v); }

  setLives(v) {
    const hearts = '\u2665'.repeat(Math.max(0, v));
    this.livesText.setText('VIDAS: ' + (hearts || '0'));
    this.livesText.setColor(v <= 1 ? COLORS.warn : COLORS.text);
  }

  setCards(c, total) { this.cardsText.setText(`TARJETAS: ${c}/${total}`); }

  setTime(sec) {
    this.timeText.setText('TIEMPO: ' + Util.formatTime(sec));
    this.timeText.setColor(sec <= 15 ? COLORS.warn : COLORS.neon);
  }

  /* Mensaje temporal centrado (ej: "Salida desbloqueada") */
  banner(text, color = COLORS.neon) {
    const t = this.scene.add.text(CONFIG.WIDTH / 2, 70, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '26px',
      color: color,
      fontStyle: 'bold',
      backgroundColor: '#000000aa',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(1100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: 50,
      delay: 1600,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }
}
