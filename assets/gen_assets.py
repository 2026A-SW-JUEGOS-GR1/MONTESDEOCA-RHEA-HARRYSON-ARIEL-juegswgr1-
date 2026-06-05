"""Genera los assets propios del juego: tileset sci-fi 32x32 y tarjeta de acceso.
Ejecutar:  python gen_assets.py
"""
from PIL import Image, ImageDraw

TS = 32  # tile size


def new_tile():
    return Image.new("RGBA", (TS, TS), (0, 0, 0, 0))


def px(d, x, y, c):
    d.point((x, y), fill=c)


def rect(d, x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=c)


# ---------- Paleta sci-fi (azul / gris / verde neon) ----------
FLOOR_BASE = (38, 46, 66, 255)
FLOOR_LINE = (52, 62, 86, 255)
FLOOR_HI = (62, 74, 102, 255)
NEON = (57, 255, 120, 255)
NEON_DK = (32, 150, 78, 255)
WALL_BASE = (88, 98, 116, 255)
WALL_DK = (52, 60, 74, 255)
WALL_HI = (132, 144, 164, 255)
WALL_TOP = (108, 120, 140, 255)
METAL = (70, 80, 98, 255)
METAL_HI = (120, 134, 156, 255)
CYAN = (90, 200, 230, 255)
RED = (224, 70, 70, 255)
RED_DK = (140, 36, 36, 255)
GREEN = (70, 210, 110, 255)
AMBER = (240, 180, 70, 255)


def floor_plain():
    t = new_tile(); d = ImageDraw.Draw(t)
    rect(d, 0, 0, 31, 31, FLOOR_BASE)
    # sutil borde de panel
    rect(d, 0, 0, 31, 0, FLOOR_HI)
    rect(d, 0, 0, 0, 31, FLOOR_HI)
    rect(d, 31, 0, 31, 31, (28, 34, 50, 255))
    rect(d, 0, 31, 31, 31, (28, 34, 50, 255))
    # remaches
    for (x, y) in [(4, 4), (27, 4), (4, 27), (27, 27)]:
        px(d, x, y, FLOOR_HI)
    return t


def floor_grid():
    t = floor_plain(); d = ImageDraw.Draw(t)
    rect(d, 16, 1, 16, 30, FLOOR_LINE)
    rect(d, 1, 16, 30, 16, FLOOR_LINE)
    return t


def floor_neon():
    t = floor_plain(); d = ImageDraw.Draw(t)
    rect(d, 0, 14, 31, 17, NEON_DK)
    rect(d, 0, 15, 31, 16, NEON)
    return t


def floor_hazard():
    # decal toxico (no solido)
    t = floor_plain(); d = ImageDraw.Draw(t)
    for i in range(0, 40, 6):
        d.line([(i, 0), (i - 12, 31)], fill=(60, 180, 90, 90), width=2)
    # simbolo bioriesgo simple
    cx, cy = 16, 16
    d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], outline=NEON, width=1)
    for a in (0, 1, 2):
        import math
        ang = math.radians(90 + a * 120)
        ex = cx + int(6 * math.cos(ang)); ey = cy - int(6 * math.sin(ang))
        d.line([(cx, cy), (ex, ey)], fill=NEON, width=2)
    return t


def wall():
    t = new_tile(); d = ImageDraw.Draw(t)
    rect(d, 0, 0, 31, 31, WALL_BASE)
    rect(d, 0, 0, 31, 4, WALL_TOP)      # cara superior
    rect(d, 0, 0, 31, 0, WALL_HI)
    rect(d, 0, 5, 31, 5, WALL_DK)
    rect(d, 0, 31, 31, 31, (30, 34, 42, 255))
    rect(d, 0, 0, 0, 31, WALL_HI)
    rect(d, 31, 0, 31, 31, WALL_DK)
    # paneles verticales
    for x in (10, 21):
        rect(d, x, 6, x, 30, WALL_DK)
    return t


def wall_light():
    t = wall(); d = ImageDraw.Draw(t)
    rect(d, 6, 12, 25, 14, (40, 70, 90, 255))
    rect(d, 7, 13, 24, 13, CYAN)
    return t


def container():
    t = new_tile(); d = ImageDraw.Draw(t)
    rect(d, 2, 4, 29, 29, METAL)
    rect(d, 2, 4, 29, 4, METAL_HI)
    rect(d, 2, 4, 2, 29, METAL_HI)
    rect(d, 29, 4, 29, 29, WALL_DK)
    rect(d, 2, 29, 29, 29, WALL_DK)
    # tapa
    rect(d, 2, 4, 29, 10, (84, 96, 116, 255))
    rect(d, 2, 10, 29, 10, WALL_DK)
    # cierres
    rect(d, 9, 11, 11, 28, WALL_DK)
    rect(d, 20, 11, 22, 28, WALL_DK)
    # luz de estado
    px(d, 6, 7, NEON)
    return t


def console():
    t = new_tile(); d = ImageDraw.Draw(t)
    rect(d, 1, 8, 30, 30, METAL)
    rect(d, 1, 8, 30, 8, METAL_HI)
    rect(d, 1, 30, 30, 30, WALL_DK)
    # pantalla
    rect(d, 4, 11, 27, 22, (20, 40, 56, 255))
    rect(d, 4, 11, 27, 11, CYAN)
    # lineas de datos en pantalla
    for y in (14, 17, 20):
        d.line([(6, y), (18, y)], fill=(70, 150, 180, 255))
    px(d, 24, 14, NEON); px(d, 24, 17, AMBER); px(d, 24, 20, RED)
    # base / botones
    for x in (6, 12, 18, 24):
        px(d, x, 26, AMBER)
    return t


def barrier():
    # barrera con franjas peligro (solido)
    t = new_tile(); d = ImageDraw.Draw(t)
    rect(d, 0, 9, 31, 22, (32, 36, 46, 255))
    for i in range(-8, 40, 8):
        d.polygon([(i, 22), (i + 4, 22), (i + 12, 9), (i + 8, 9)], fill=AMBER)
    rect(d, 0, 9, 31, 9, WALL_HI)
    rect(d, 0, 22, 31, 22, WALL_DK)
    # postes
    rect(d, 1, 6, 3, 28, METAL); rect(d, 28, 6, 30, 28, METAL)
    return t


def door(locked=True):
    t = new_tile(); d = ImageDraw.Draw(t)
    # marco
    rect(d, 0, 0, 31, 31, WALL_DK)
    rect(d, 3, 1, 28, 31, METAL)
    rect(d, 3, 1, 28, 1, METAL_HI)
    # dos hojas
    rect(d, 5, 3, 15, 30, (60, 70, 88, 255))
    rect(d, 16, 3, 26, 30, (60, 70, 88, 255))
    rect(d, 15, 3, 16, 30, WALL_DK)
    col = RED if locked else GREEN
    coldk = RED_DK if locked else NEON_DK
    # panel/luz de estado
    rect(d, 11, 12, 20, 19, (18, 22, 30, 255))
    rect(d, 12, 13, 19, 18, coldk)
    rect(d, 13, 14, 18, 17, col)
    # franjas superiores
    rect(d, 5, 3, 26, 5, col if not locked else (50, 58, 72, 255))
    return t


def build_tileset():
    tiles = [
        floor_plain(),    # 0
        floor_grid(),     # 1
        floor_neon(),     # 2
        floor_hazard(),   # 3
        wall(),           # 4
        wall_light(),     # 5
        container(),      # 6
        console(),        # 7
        barrier(),        # 8
        door(True),       # 9  puerta bloqueada
        door(False),      # 10 puerta desbloqueada
    ]
    sheet = Image.new("RGBA", (TS * len(tiles), TS), (0, 0, 0, 0))
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * TS, 0))
    sheet.save("lab_tiles.png")
    print("lab_tiles.png", sheet.size, "tiles:", len(tiles))


def build_keycard():
    # 2 frames (brillo) de 32x32 para flotar/parpadear
    frames = []
    for f in range(2):
        t = new_tile(); d = ImageDraw.Draw(t)
        # cuerpo de tarjeta
        rect(d, 8, 9, 24, 23, (40, 120, 200, 255))
        rect(d, 8, 9, 24, 9, (120, 200, 255, 255))
        rect(d, 8, 9, 8, 23, (120, 200, 255, 255))
        rect(d, 24, 9, 24, 23, (24, 70, 130, 255))
        rect(d, 8, 23, 24, 23, (24, 70, 130, 255))
        # banda magnetica
        rect(d, 9, 12, 23, 14, (20, 40, 70, 255))
        # chip dorado
        rect(d, 11, 17, 16, 21, AMBER)
        rect(d, 11, 17, 16, 17, (255, 220, 120, 255))
        d.line([(13, 17), (13, 21)], fill=(180, 130, 40, 255))
        # destello que cambia
        if f == 1:
            px(d, 22, 11, (255, 255, 255, 255))
            px(d, 21, 12, (220, 240, 255, 200))
        else:
            px(d, 10, 11, (255, 255, 255, 230))
        frames.append(t)
    sheet = Image.new("RGBA", (TS * 2, TS), (0, 0, 0, 0))
    for i, t in enumerate(frames):
        sheet.paste(t, (i * TS, 0))
    sheet.save("keycard.png")
    print("keycard.png", sheet.size)


if __name__ == "__main__":
    build_tileset()
    build_keycard()
