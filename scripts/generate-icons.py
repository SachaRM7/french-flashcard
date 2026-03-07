#!/usr/bin/env python3
# scripts/generate-icons.py
# Genere les icones PWA (192x192 et 512x512) sans dependances externes
# Utilise uniquement la bibliotheque standard Python (struct, zlib)

import struct
import zlib
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SCRIPT_DIR, '..')
OUT_DIR = os.path.join(ROOT, 'images', 'icons')

os.makedirs(OUT_DIR, exist_ok=True)

def write_png(filename, size):
    """Genere un PNG avec fond #0B0F16 et texte 'HA' (lettres simples en pixels)."""

    BG = (11, 15, 22)       # #0B0F16
    ACCENT = (88, 166, 255) # #58a6ff
    RADIUS = size // 5      # rayon du rectangle arrondi

    # Creer les pixels RGBA
    pixels = []
    cx, cy = size // 2, size // 2
    r = size // 2 - 2

    # Lettre arabe simplifiee : un cercle plein + barre horizontale
    # On dessine juste une forme geometrique distinctive
    bar_h = size // 16
    bar_w = size * 2 // 3
    circle_r = size // 5

    for y in range(size):
        row = []
        for x in range(size):
            # Fond arrondi
            dx = min(abs(x - RADIUS), abs(x - (size - 1 - RADIUS)))
            dy = min(abs(y - RADIUS), abs(y - (size - 1 - RADIUS)))
            if x < RADIUS and y < RADIUS:
                dist = ((x - RADIUS)**2 + (y - RADIUS)**2) ** 0.5
                if dist > RADIUS:
                    row.extend([0, 0, 0, 0]); continue
            elif x > size - 1 - RADIUS and y < RADIUS:
                dist = ((x - (size - 1 - RADIUS))**2 + (y - RADIUS)**2) ** 0.5
                if dist > RADIUS:
                    row.extend([0, 0, 0, 0]); continue
            elif x < RADIUS and y > size - 1 - RADIUS:
                dist = ((x - RADIUS)**2 + (y - (size - 1 - RADIUS))**2) ** 0.5
                if dist > RADIUS:
                    row.extend([0, 0, 0, 0]); continue
            elif x > size - 1 - RADIUS and y > size - 1 - RADIUS:
                dist = ((x - (size - 1 - RADIUS))**2 + (y - (size - 1 - RADIUS))**2) ** 0.5
                if dist > RADIUS:
                    row.extend([0, 0, 0, 0]); continue

            # Fond de base
            color = BG

            # Cercle accent (haut centre)
            ccy = cy - size // 8
            dist_circle = ((x - cx)**2 + (y - ccy)**2) ** 0.5
            if dist_circle <= circle_r:
                color = ACCENT

            # Barre horizontale (milieu)
            bx = cx - bar_w // 2
            by = cy + size // 16
            if bx <= x <= bx + bar_w and by <= y <= by + bar_h * 2:
                color = ACCENT

            # Trait vertical gauche (comme un alif)
            alif_x = cx - bar_w // 4
            alif_h = size // 3
            alif_y = cy - alif_h // 2 + size // 16
            alif_w = max(2, size // 32)
            if alif_x <= x <= alif_x + alif_w and alif_y <= y <= alif_y + alif_h:
                color = ACCENT

            row.extend([color[0], color[1], color[2], 255])
        pixels.append(row)

    # Encoder en PNG
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    # Signature PNG
    png = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr_data)

    # IDAT
    raw = b''
    for row in pixels:
        raw += b'\x00' + bytes(row)
    compressed = zlib.compress(raw, 9)
    png += make_chunk(b'IDAT', compressed)

    # IEND
    png += make_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)
    print('[ok] ' + os.path.basename(filename) + ' (' + str(size) + 'x' + str(size) + ')')

def main():
    write_png(os.path.join(OUT_DIR, 'icon-192.png'), 192)
    write_png(os.path.join(OUT_DIR, 'icon-512.png'), 512)
    write_png(os.path.join(OUT_DIR, 'icon-maskable-192.png'), 192)
    write_png(os.path.join(OUT_DIR, 'icon-maskable-512.png'), 512)
    print('[done] Icons generated in images/icons/')

if __name__ == '__main__':
    main()
