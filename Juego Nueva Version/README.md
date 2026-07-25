# LORD-M // LORD-Q : Fractura del Sistema

Vertical slice jugable de un action-platformer **2D Pixel-Art Cyberpunk** narrativo,
construido sobre HTML5 Canvas puro (sin dependencias, sin build).

Resolución base **320×180** escalada **×4** (1280×720), tal como pide el GDD.

---

## Cómo jugar

Doble clic en **`index.html`** (o ábrelo en cualquier navegador moderno).
Pulsa una tecla / clic para activar el audio (requisito del navegador).

> El juego corre directamente desde el sistema de archivos. Si tu navegador
> bloqueara algún recurso, sirve la carpeta con un servidor local, p. ej.:
> `python -m http.server` y entra a `http://localhost:8000`.

### Controles

| Acción | Tecla | LORD-M | LORD-Q |
|---|---|---|---|
| Mover | `A/D` o `←/→` | correr | correr |
| Saltar / Doble salto | `Space` / `Z` | ✔ | ✔ |
| `Shift` / `L` | — | **Dash de cortocircuito** (atraviesa puertas `B`) | **Slide** |
| `J` / `X` | — | **Disparo de código** (con retroceso) | — |
| `U` | — | **Ataque pesado** | — |
| `I` | — | **STACK OVERFLOW** (ultimate, requiere barra llena) | — |
| `F` / `Q` | — | — | **Fase líquida** (atraviesa muros de datos `=`) |
| `R` | — | — | **Escáner forense** (revela plataformas `?`) |
| `E` | — | — | **Rebobinado temporal** (~5 s) |
| Menú / avanzar | `Enter` | — | — |
| Silenciar audio | `M` | — | — |

---

## Estructura del proyecto

```
Proyecto/
├── index.html          # shell + overlay CRT
├── css/style.css       # escalado pixelado, marco de neón, viñeta CRT
├── assets/
│   ├── lordM.png       # arte de referencia (retrato/cinemáticas)
│   └── lordQ.png
└── js/
    ├── config.js       # constantes, paletas y metadatos de niveles
    ├── input.js        # teclado (held / justPressed)
    ├── audio.js        # motor synthwave/industrial procedural (WebAudio)
    ├── fx.js           # post-proceso: RGB split, bloom, scanlines, glitch, ruido, flash
    ├── sprites.js      # personajes articulados pixel-art + enemigos + tiles + fondo parallax
    ├── entities.js     # Player (M/Q), Projectile, Enemy, Boss, Particles, Memory
    ├── levels.js       # tilemaps data-driven + guion narrativo (STORY)
    ├── scenes.js       # MenuScene, CutsceneScene, GameScene + HUD
    └── game.js         # bucle principal + pipeline de render + flujo de actos
```

**Pipeline de render:** el mundo se dibuja a 320×180 → `fx.js` aplica el post-proceso
cyberpunk → se escala ×4 al lienzo visible con suavizado desactivado.

**Personajes:** las imágenes provistas son **arte conceptual vectorial**, no hojas de
sprites pixeladas; se usan como retratos en menú y cinemáticas. Los personajes en juego
son **pixel-art procedural articulado** (cabeza/pelo/bufanda/torso/brazos/piernas animados
por fase) que respeta sus esquemas de color y silueta.

---

## Lo implementado en este slice

- **Arco narrativo completo** Acto I → *Stack Overflow* → Acto II → revelación final, con
  cinemáticas tipográficas y retratos.
- **LORD-M (Acto I):** correr, doble salto, dash de cortocircuito (rompe puertas blindadas),
  disparo de código con retroceso, ataque pesado, ultimate *Stack Overflow*.
- **LORD-Q (Acto II):** doble salto, slide, **fase líquida** (muros de datos), **escáner**
  (plataformas ocultas), **rebobinado temporal**.
- **Dos niveles jugables:** *Distrito de Datos Bajos* (M) y *Pasadizos Fragmentados* (Q),
  cada uno con un mini-jefe (*Guardián de Integridad MK-I* / *Rutina de Purga Omega*).
- **Enemigos:** drones guardianes (disparan), virus (persiguen), purgadores (mini-jefes).
- **Sistema de memorias** coleccionables (5) que revelan la relación M↔Q.
- **FX cyberpunk** con **corrupción creciente** por nivel, banda sonora procedural
  (intensa para M, atmosférica para Q) y SFX sintetizados.

## Roadmap (resto del GDD)

El motor es **data-driven**, así que ampliar es directo:

- Añadir niveles 2, 3, 5 y 6 con nuevas entradas en `LEVELS_META` + funciones `build*` en `levels.js`.
- Boss final de LORD-M como entidad propia (hoy el clímax del Acto I es el *Stack Overflow*).
- Más enemigos (Depuradores), tipos de plataforma efímera, portales verticales.
- Sustituir el pixel-art procedural por hojas de sprites dedicadas si se desea.
- Sustituir la BSO procedural por pistas synthwave producidas.
