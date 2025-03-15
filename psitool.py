from PIL import Image
import sys
import struct

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
