import json
import math
import subprocess
import sys
from pathlib import Path

from munsell import FAMILIES, hue_label

WIDTH, HEIGHT = 480, 270
SIZE = 33


def frame(video, second):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", str(second), "-i", video, "-frames:v", "1",
         "-vf", f"scale={WIDTH}:{HEIGHT}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True,
    ).stdout
    return raw


def lookup(lut, r, g, b):
    step = (SIZE - 1) / 255
    fr, fg, fb = r * step, g * step, b * step
    r0, g0, b0 = min(int(fr), SIZE - 2), min(int(fg), SIZE - 2), min(int(fb), SIZE - 2)
    tr, tg, tb = fr - r0, fg - g0, fb - b0
    total = [0.0, 0.0, 0.0]
    for db in (0, 1):
        for dg in (0, 1):
            for dr in (0, 1):
                weight = (tr if dr else 1 - tr) * (tg if dg else 1 - tg) * (tb if db else 1 - tb)
                index = (((b0 + db) * SIZE + (g0 + dg)) * SIZE + (r0 + dr)) * 3
                total[0] += weight * (lut[index] - 128) / 4
                total[1] += weight * (lut[index + 1] - 128) / 4
                total[2] += weight * lut[index + 2] / 25
    a, b, value = total
    chroma = math.hypot(a, b)
    hue = (math.degrees(math.atan2(b, a)) / 360 * 100) % 100
    return hue, value, chroma


def notation(hue, value, chroma):
    if chroma < 0.8:
        return f"N {value:.1f}"
    return f"{hue_label(round(hue / 2.5) * 2.5)} {value:.1f}/{round(chroma)}"


def region(raw, lut, x, y, radius=3):
    ax = ay = av = 0.0
    count = 0
    for yy in range(y - radius, y + radius + 1):
        for xx in range(x - radius, x + radius + 1):
            index = (yy * WIDTH + xx) * 3
            hue, value, chroma = lookup(lut, raw[index], raw[index + 1], raw[index + 2])
            angle = hue / 100 * 2 * math.pi
            ax += chroma * math.cos(angle)
            ay += chroma * math.sin(angle)
            av += value
            count += 1
    ax, ay, av = ax / count, ay / count, av / count
    return (math.degrees(math.atan2(ay, ax)) / 360 * 100) % 100, av, math.hypot(ax, ay)


def families(frames, lut, low, high):
    counts = [0] * 10
    total = 0
    for raw in frames:
        for i in range(0, len(raw), 6):
            hue, value, chroma = lookup(lut, raw[i], raw[i + 1], raw[i + 2])
            if chroma < 1.5 or not low <= value < high:
                continue
            counts[int(hue // 10) % 10] += 1
            total += 1
    return {FAMILIES[i]: round(counts[i] / total * 100, 1) for i in range(10) if counts[i]} if total else {}


def main(video, lut_path, spots_path):
    lut = Path(lut_path).read_bytes()
    spots = json.loads(Path(spots_path).read_text(encoding="utf-8"))
    frames = [frame(video, second) for second in (0, 3, 6, 9, 12)]
    for name, (x, y) in spots.items():
        print(f"{name:>18}  {notation(*region(frames[0], lut, x, y))}")
    print("luces (valor 8 o mas):", families(frames, lut, 8, 11))
    print("medios (valor 6 a 8):", families(frames, lut, 6, 8))
    print("sombras (valor menor a 6):", families(frames, lut, 0, 6))


if __name__ == "__main__":
    main(*sys.argv[1:4])
