#!/usr/bin/env python3
"""Gera ícones PNG mínimos sem dependências externas."""
import zlib
import struct

def create_png(width, height, color=(255, 193, 7, 255)):
    """Cria um PNG RGBA sólido."""
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return chunk_len + chunk_type + data + chunk_crc
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr = png_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk - raw image data
    r, g, b, a = color
    raw_data = b''
    for _ in range(height):
        raw_data += b'\x00'  # filter type: None
        for _ in range(width):
            raw_data += bytes([r, g, b, a])
    
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = png_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

# Cria os ícones
files = [
    ('icon.png', 128, 128),
    ('32x32.png', 32, 32),
    ('128x128.png', 128, 128),
    ('128x128@2x.png', 256, 256),
]

for filename, w, h in files:
    png_data = create_png(w, h)
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'{filename} criado ({w}x{h})')

# Cria ICO (formato simplificado)
def create_ico():
    """Cria um ICO básico com o PNG de 128x128."""
    png_32 = create_png(32, 32)
    png_64 = create_png(64, 64)
    png_128 = create_png(128, 128)
    
    images = [
        (32, 32, png_32),
        (64, 64, png_64),
        (128, 128, png_128),
    ]
    
    # ICO header
    icon_dir = struct.pack('<HHH', 0, 1, len(images))  # reserved, type=1, count
    
    # Image directory entries
    data_offset = 6 + len(images) * 16
    entries = b''
    image_data = b''
    
    for w, h, png in images:
        entry = struct.pack('<BBBBHHII',
            w if w < 256 else 0,  # width (0 = 256)
            h if h < 256 else 0,  # height (0 = 256)
            0,  # color palette
            0,  # reserved
            1,  # color planes
            32, # bits per pixel
            len(png),  # size of image data
            data_offset  # offset to image data
        )
        entries += entry
        data_offset += len(png)
        image_data += png
    
    with open('icon.ico', 'wb') as f:
        f.write(icon_dir + entries + image_data)
    print('icon.ico criado')

create_ico()
print('Pronto!')
