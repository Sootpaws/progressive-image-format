from PIL import Image
import sys
import struct
import math

def create_simple(img):
    (width, height) = img.size
    o = struct.pack('!HH', width, height)
    for y in range(0, height):
        print(str(y) + "/" + str(height))
        l = b''
        for x in range(0, width):
            pixel = img.getpixel((x, y))
            (r, g, b, a) = pixel
            l += struct.pack('!BBBB', r, g, b, a)
        o += l
    return o

def pixel_min(a, b):
    if a == None:
        return b
    if b == None:
        return a
    return (min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3]))

def pixel_max(a, b):
    if a == None:
        return b
    if b == None:
        return a
    return (max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))

def pixel_avg(a, b):
    return (
        int((a[0] + b[0]) / 2),
        int((a[1] + b[1]) / 2),
        int((a[2] + b[2]) / 2),
        int((a[3] + b[3]) / 2)
    )

def previous_layer(img):
    (width, height) = img.size
    width = math.ceil(width / 2)
    height = math.ceil(height / 2)
    o = Image.new("RGBA", (width, height), (0x80, 0x20, 0xf0, 0xff))
    for y in range(0, height):
        print(str(y) + "/" + str(height))
        for x in range(0, width):
            min_vals = None
            max_vals = None
            for (xo, yo) in [(0, 0), (0, 1), (1, 0), (1, 1)]:
                sx = x * 2 + xo
                sy = y * 2 + yo
                if sx >= img.width or sy >= img.height:
                    continue
                pixel = img.getpixel((sx, sy))
                min_vals = pixel_min(min_vals, pixel)
                max_vals = pixel_max(max_vals, pixel)
            o.putpixel((x, y), pixel_avg(min_vals, max_vals))
    return o

def diff(prev, img):
    (width, height) = img.size
    o = b''
    for y in range(0, height):
        l = b''
        for x in range(0, width):
            prev_pixel = prev.getpixel((int(x / 2), int(y / 2)))
            pixel = img.getpixel((x, y))
            r = pixel[0] - prev_pixel[0] + 0x80 - 1
            g = pixel[1] - prev_pixel[1] + 0x80 - 1
            b = pixel[2] - prev_pixel[2] + 0x80 - 1
            a = pixel[3] - prev_pixel[3] + 0x80 - 1
            l += struct.pack('!BBBB', r, g, b, a)
        o += l
    return b'M' + o

def diffs_to(img):
    if img.size == (1, 1):
        base = Image.new("RGBA", (1, 1), (0x80, 0x80, 0x80, 0x80))
        return diff(base, img)
    else:
        prev = previous_layer(img)
        return diffs_to(prev) + diff(prev, img)

def create_psi(img):
    (width, height) = img.size
    return b'\0PSI' + struct.pack('!HH', width, height) + diffs_to(img)

def process(input_path, simple_path, psi_path):
    img = Image.open(input_path).convert("RGBA")
    simple = create_simple(img)
    psi = create_psi(img)
    with open(simple_path, "wb") as f:
        f.write(simple)
    with open(psi_path, "wb") as f:
        f.write(psi)

def infer_paths(input_path):
    base = input_path[:input_path.rfind(".")]
    return (base + ".sif", base + ".psi")

def run(path):
    (simple, psi) = infer_paths(path)
    process(path, simple, psi)

run(sys.argv[1])
