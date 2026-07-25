/* ============================================================
   input.js  —  Teclado: estados held / justPressed / justReleased.
   ============================================================ */

const Input = {
  held: {},
  pressed: {},   // solo el frame en que se presiona
  released: {},
  anyKey: false,

  // Mapa logico -> teclas fisicas
  map: {
    left:  ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up:    ['ArrowUp', 'KeyW'],
    down:  ['ArrowDown', 'KeyS'],
    jump:  ['Space', 'KeyZ', 'KeyK'],
    dash:  ['ShiftLeft', 'ShiftRight', 'KeyL'],   // M: dash de cortocircuito / Q: slide
    shoot: ['KeyJ', 'KeyX'],                       // M: disparo de codigo / Q: scan
    special: ['KeyU', 'KeyC'],                     // M: heavy / Q: fase liquida (Q)
    ultimate: ['KeyI', 'KeyV'],                    // M: stack overflow
    rewind: ['KeyE'],                              // Q: rebobinado
    liquid: ['KeyQ', 'KeyF'],                      // Q: fase liquida
    scan:   ['KeyR'],                              // Q: escaner forense
    start:  ['Enter', 'Space'],
    mute:   ['KeyM'],
    back:   ['Escape'],
  },

  init() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
      if (!this.held[e.code]) this.pressed[e.code] = true;
      this.held[e.code] = true;
      this.anyKey = true;
    });
    window.addEventListener('keyup', (e) => {
      this.held[e.code] = false;
      this.released[e.code] = true;
    });
    window.addEventListener('mousedown', () => { this.anyKey = true; this.mouse = true; });
  },

  _any(list, store) { for (const k of list) if (store[k]) return true; return false; },
  down(action)     { return this._any(this.map[action], this.held); },
  justDown(action) { return this._any(this.map[action], this.pressed); },
  justUp(action)   { return this._any(this.map[action], this.released); },

  // Llamar al final de cada frame
  postUpdate() {
    this.pressed = {};
    this.released = {};
    this.anyKey = false;
    this.mouse = false;
  },
};
