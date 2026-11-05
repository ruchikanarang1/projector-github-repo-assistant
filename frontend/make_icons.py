import zlib
import struct
from pathlib import Path

def create_png(width, height, path):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = b'IHDR' + ihdr_data
    png += struct.pack('!I', len(ihdr_data)) + ihdr + struct.pack('!I', zlib.crc32(ihdr))

    # Raw pixel data: RGB (indigo #6366f1 = 99, 102, 241)
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            # Gradient circle pattern
            dx = x - width / 2
            dy = y - height / 2
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < width * 0.4:
                # Purple accent
                raw.extend([139, 92, 246])
            else:
                # Dark slate background #0f172a
                raw.extend([15, 23, 42])

    idat_data = zlib.compress(bytes(raw), 9)
    idat = b'IDAT' + idat_data
    png += struct.pack('!I', len(idat_data)) + idat + struct.pack('!I', zlib.crc32(idat))

    # IEND chunk
    iend = b'IEND'
    png += struct.pack('!I', 0) + iend + struct.pack('!I', zlib.crc32(iend))

    Path(path).write_bytes(png)
    print(f"Generated {path}")

create_png(192, 192, "frontend/public/icon-192.png")
create_png(512, 512, "frontend/public/icon-512.png")
