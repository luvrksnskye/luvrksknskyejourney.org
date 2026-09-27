import json
import math
import re
import sys
from pathlib import Path

FAMILIES = ("R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP")
HUE = re.compile(r"(\d+(?:\.\d+)?)(YR|GY|BG|PB|RP|R|Y|G|B|P)")
WHITE_C = (0.31006, 0.31616)
MGO = 0.975
LUT_SIZE = 33

BRADFORD = ((0.8951, 0.2664, -0.1614), (-0.7502, 1.7135, 0.0367), (0.0389, -0.0685, 1.0296))
XYZ_TO_SRGB = ((3.2404542, -1.5371385, -0.4985314), (-0.9692660, 1.8760108, 0.0415560), (0.0556434, -0.2040259, 1.0572252))
SRGB_TO_XYZ = ((0.4124564, 0.3575761, 0.1804375), (0.2126729, 0.7151522, 0.0721750), (0.0193339, 0.1191920, 0.9503041))
XYZ_TO_P3 = ((2.4934969, -0.9313836, -0.4027108), (-0.8294890, 1.7626641, 0.0236247), (0.0358458, -0.0761724, 0.9568845))


def mul(m, v):
    return tuple(m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] for i in range(3))


def matmul(a, b):
    return tuple(tuple(sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)) for i in range(3))


def inverse(m):
    (a, b, c), (d, e, f), (g, h, i) = m
    det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    return (
        ((e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det),
        ((f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det),
        ((d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det),
    )


def white_xyz(x, y):
    return (x / y, 1.0, (1 - x - y) / y)


def adaptation(source, target):
    s = mul(BRADFORD, source)
    t = mul(BRADFORD, target)
    scale = ((t[0] / s[0], 0, 0), (0, t[1] / s[1], 0), (0, 0, t[2] / s[2]))
    return matmul(inverse(BRADFORD), matmul(scale, BRADFORD))


C_TO_D65 = adaptation(white_xyz(*WHITE_C), (0.95047, 1.0, 1.08883))
D65_TO_C = inverse(C_TO_D65)


def hue_number(label):
    match = HUE.fullmatch(label)
    if not match:
        raise ValueError(label)
    return (float(match.group(1)) + FAMILIES.index(match.group(2)) * 10) % 100


def hue_label(number):
    number %= 100
    family = int(number // 10)
    step = number - family * 10
    if step < 1e-6:
        family = (family - 1) % 10
        step = 10.0
    text = f"{step:.1f}".rstrip("0").rstrip(".")
    return f"{text}{FAMILIES[family]}"


def read(path):
    rows = []
    for line in Path(path).read_text().splitlines():
        parts = line.split()
        if len(parts) != 6 or parts[0] in ("h", "H"):
            continue
        rows.append((hue_number(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4]), float(parts[5])))
    return rows


def xyy_to_xyz(x, y, big_y):
    if y <= 0:
        return (0.0, 0.0, 0.0)
    return (x * big_y / y, big_y, (1 - x - y) * big_y / y)


def xyz_to_xyy(xyz):
    total = sum(xyz)
    if total <= 0:
        return (*WHITE_C, 0.0)
    return (xyz[0] / total, xyz[1] / total, xyz[1])


def encode(channel):
    return 12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055


def decode(channel):
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def oklab(linear):
    r, g, b = linear
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def oklab_to_linear(lab):
    big_l, a, b = lab
    l = (big_l + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (big_l - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (big_l - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )


def inside(linear, slack=1e-4):
    return all(-slack <= channel <= 1 + slack for channel in linear)


def fit(linear):
    if inside(linear):
        return tuple(min(1.0, max(0.0, c)) for c in linear), True
    big_l, a, b = oklab(linear)
    big_l = min(1.0, max(0.0, big_l))
    low, high = 0.0, 1.0
    for _ in range(28):
        mid = (low + high) / 2
        if inside(oklab_to_linear((big_l, a * mid, b * mid)), 0.0):
            low = mid
        else:
            high = mid
    return tuple(min(1.0, max(0.0, c)) for c in oklab_to_linear((big_l, a * low, b * low))), False


def to_hex(linear):
    return "".join(f"{round(encode(c) * 255):02x}" for c in linear)


def sample_color(x, y, big_y):
    xyz = mul(C_TO_D65, xyy_to_xyz(x, y, big_y * MGO / 100))
    linear = mul(XYZ_TO_SRGB, xyz)
    srgb, in_srgb = fit(linear)
    p3_linear = mul(XYZ_TO_P3, xyz)
    p3, in_p3 = fit(p3_linear)
    return xyz, srgb, in_srgb, p3, in_p3


def value_from_y(big_y):
    target = big_y * 100
    low, high = 0.0, 10.5
    for _ in range(50):
        v = (low + high) / 2
        y = 1.1914 * v - 0.22533 * v ** 2 + 0.23352 * v ** 3 - 0.020484 * v ** 4 + 0.00081939 * v ** 5
        if y < target:
            low = v
        else:
            high = v
    return (low + high) / 2


class Space:
    def __init__(self, rows):
        self.levels = sorted({row[1] for row in rows})
        self.grid = {}
        for h, v, c, x, y, _ in rows:
            self.grid.setdefault(v, {}).setdefault(round(h * 4) / 4, []).append((c, x, y))
        for level in self.grid.values():
            for line in level.values():
                line.sort()
        self.hues = sorted({h for level in self.grid.values() for h in level})

    def plane(self, value):
        value = min(max(value, self.levels[0]), self.levels[-1])
        low = max(level for level in self.levels if level <= value)
        high = min(level for level in self.levels if level >= value)
        t = 0.0 if high == low else (value - low) / (high - low)
        lines = {}
        for hue in self.hues:
            a = dict((c, (x, y)) for c, x, y in self.grid[low].get(hue, []))
            b = dict((c, (x, y)) for c, x, y in self.grid[high].get(hue, []))
            chromas = sorted(set(a) & set(b)) if t not in (0.0, 1.0) else sorted(a if t == 0.0 else b)
            points = [(0.0, WHITE_C[0], WHITE_C[1])]
            for c in chromas:
                pa = a.get(c, b.get(c))
                pb = b.get(c, a.get(c))
                points.append((c, pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t))
            if len(points) > 1:
                lines[hue] = points
        return lines

    def invert(self, x, y, value):
        dx, dy = x - WHITE_C[0], y - WHITE_C[1]
        radius = math.hypot(dx, dy)
        if radius < 1e-4:
            return 0.0, value, 0.0
        angle = math.atan2(dy, dx)
        lines = self.plane(value)
        hues = sorted(lines)
        cuts = []
        for hue in hues:
            cuts.append((hue, *self.cut(lines[hue], radius)))
        best = None
        for i, (hue_a, angle_a, chroma_a) in enumerate(cuts):
            hue_b, angle_b, chroma_b = cuts[(i + 1) % len(cuts)]
            span = (angle_b - angle_a) % (2 * math.pi)
            offset = (angle - angle_a) % (2 * math.pi)
            if span > math.pi:
                span -= 2 * math.pi
                offset = offset - 2 * math.pi if offset > math.pi else offset
            if span == 0:
                continue
            t = offset / span
            if -1e-9 <= t <= 1 + 1e-9:
                gap = (hue_b - hue_a) % 100
                hue = (hue_a + gap * t) % 100
                chroma = chroma_a + (chroma_b - chroma_a) * t
                score = abs(t - 0.5)
                if best is None or score < best[0]:
                    best = (score, hue, chroma)
        if best is None:
            return 0.0, value, 0.0
        return best[1], value, max(0.0, best[2])

    @staticmethod
    def cut(line, radius):
        points = [(c, x, y, math.hypot(x - WHITE_C[0], y - WHITE_C[1])) for c, x, y in line]
        pair = next(((a, b) for a, b in zip(points, points[1:]) if b[3] >= radius), (points[-2], points[-1]))
        (c0, x0, y0, r0), (c1, x1, y1, r1) = pair
        t = (radius - r0) / (r1 - r0) if r1 != r0 else 0.0
        return math.atan2(y0 + (y1 - y0) * t - WHITE_C[1], x0 + (x1 - x0) * t - WHITE_C[0]), c0 + (c1 - c0) * t

    def from_srgb(self, rgb):
        linear = tuple(decode(channel) for channel in rgb)
        xyz = mul(D65_TO_C, mul(SRGB_TO_XYZ, linear))
        x, y, big_y = xyz_to_xyy(xyz)
        value = value_from_y(big_y)
        if value < 0.2:
            return 0.0, value, 0.0
        hue, value, chroma = self.invert(x, y, value)
        return hue, value, chroma


def notation(hue, value, chroma):
    if chroma < 0.5:
        return f"N {value:.1f}"
    return f"{hue_label(round(hue * 2) / 2)} {value:.1f}/{chroma:.1f}"


def build_samples(real, book):
    in_book = {(round(h, 2), v, c) for h, v, c, *_ in book}
    out = {"h": [], "v": [], "c": [], "srgb": [], "p3": [], "gamut": [], "book": []}
    for h, v, c, x, y, big_y in real:
        _, srgb, in_srgb, p3, in_p3 = sample_color(x, y, big_y)
        out["h"].append(round(h, 2))
        out["v"].append(v)
        out["c"].append(c)
        out["srgb"].append(to_hex(srgb))
        out["p3"].append([round(encode(ch), 4) for ch in p3])
        out["gamut"].append(2 if in_srgb else (1 if in_p3 else 0))
        out["book"].append(1 if (round(h, 2), v, c) in in_book else 0)
    return out


def build_neutrals():
    grays = []
    for step in range(0, 11):
        v = float(step)
        y = (1.1914 * v - 0.22533 * v ** 2 + 0.23352 * v ** 3 - 0.020484 * v ** 4 + 0.00081939 * v ** 5) / 100
        grays.append(to_hex((y, y, y)))
    return grays


def build_lut(space):
    lut = bytearray()
    worst = 0.0
    for bi in range(LUT_SIZE):
        for gi in range(LUT_SIZE):
            for ri in range(LUT_SIZE):
                rgb = (ri / (LUT_SIZE - 1), gi / (LUT_SIZE - 1), bi / (LUT_SIZE - 1))
                hue, value, chroma = space.from_srgb(rgb)
                worst = max(worst, chroma)
                angle = hue / 100 * 2 * math.pi
                a = max(-127, min(127, round(chroma * math.cos(angle) * 4)))
                b = max(-127, min(127, round(chroma * math.sin(angle) * 4)))
                lut += bytes((a + 128, b + 128, max(0, min(255, round(value * 25)))))
    return bytes(lut), worst


def check(space, real):
    errors = []
    for h, v, c, x, y, big_y in real:
        _, srgb, in_srgb, _, _ = sample_color(x, y, big_y)
        if not in_srgb or c < 2:
            continue
        rgb = tuple(encode(channel) for channel in srgb)
        hue, value, chroma = space.from_srgb(rgb)
        gap = abs((hue - h + 50) % 100 - 50)
        errors.append((gap, abs(value - v), abs(chroma - c)))
    count = len(errors)
    return {
        "checked": count,
        "hue": round(sum(e[0] for e in errors) / count, 3),
        "value": round(sum(e[1] for e in errors) / count, 3),
        "chroma": round(sum(e[2] for e in errors) / count, 3),
        "hue_worst": round(max(e[0] for e in errors), 2),
        "chroma_worst": round(max(e[2] for e in errors), 2),
    }


def main(real_path, all_path, book_path, out_dir):
    real = read(real_path)
    every = read(all_path)
    book = read(book_path)
    space = Space(every)
    out = Path(out_dir)

    samples = build_samples(real, book)
    report = check(space, real)
    lut, worst = build_lut(space)

    counts = {
        "real": len(real),
        "book1929": sum(samples["book"]),
        "srgb": sum(1 for g in samples["gamut"] if g == 2),
        "p3": sum(1 for g in samples["gamut"] if g >= 1),
    }
    data = {
        "format": "munsell-renotation/1",
        "source": "Newhall, Nickerson y Judd (1943), datos del Munsell Color Science Lab (RIT), iluminante C, observador de 2 grados",
        "counts": counts,
        "check": report,
        "neutrals": build_neutrals(),
        "samples": samples,
    }
    (out / "munsell.json").write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    (out / "munsell-lut.bin").write_bytes(lut)
    print(json.dumps({"counts": counts, "check": report, "lut_bytes": len(lut), "max_chroma_srgb": round(worst, 2)}, indent=1))
    for rgb in ((1, 0, 0), (0, 1, 0), (0, 0, 1), (1, 1, 0), (0.5, 0.5, 0.5)):
        print(rgb, notation(*space.from_srgb(rgb)))


if __name__ == "__main__":
    main(*sys.argv[1:5])
