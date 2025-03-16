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
                pixel = img.getpixel((x * 2 + xo, y * 2 + yo))
                min_vals = pixel_min(min_vals, pixel)
                max_vals = pixel_max(max_vals, pixel)
            o.putpixel((x, y), pixel_avg(min_vals, max_vals))
    return o

def process(input_path, simple_path, psi_path):
    img = Image.open(input_path).convert("RGBA")
    simple = create_simple(img)
    with open(simple_path, "wb") as f:
        f.write(simple)

def infer_paths(input_path):
    base = input_path[:input_path.rfind(".")]
    return (base + ".sif", base + ".psi")

def run(path):
    (simple, psi) = infer_paths(path)
    process(path, simple, psi)

run(sys.argv[1])
