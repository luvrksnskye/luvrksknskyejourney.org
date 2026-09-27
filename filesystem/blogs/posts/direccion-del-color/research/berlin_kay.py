import json
import re
import sys
from pathlib import Path

from munsell import C_TO_D65, XYZ_TO_SRGB, fit, mul, to_hex

WHITE_C = (0.98074, 1.0, 1.18232)
ROWS = "ABCDEFGHIJ"
LANGUAGES = {
    "es": (13, "Español de México"),
    "en": (6, "Inglés de Estados Unidos"),
    "ja": (10, "Japonés"),
    "zh": (12, "Mandarín"),
}
WORDS = {
    "es": {"cafe": ("café", "")},
    "ja": {
        "kuro": ("黒", "kuro"), "shiro": ("白", "shiro"), "aka(iro)": ("赤", "aka"), "midori(iro)": ("緑", "midori"),
        "ki(iro)": ("黄", "ki"), "ao": ("青", "ao"), "cha(iro)": ("茶", "cha"), "murasaki(iro)": ("紫", "murasaki"),
        "momoiro": ("桃色", "momoiro"), "daidai(iro)": ("橙", "daidai"), "haiiro, nezumiiro": ("灰色", "haiiro"),
    },
    "zh": {
        "hei": ("黑", "hēi"), "pai": ("白", "bái"), "hung": ("红", "hóng"),
        "lu": ("绿", "lǜ"), "huang": ("黄", "huáng"), "lan": ("蓝", "lán"),
    },
}
GLOSS = {
    "black": "negro", "white": "blanco", "red": "rojo", "green": "verde", "yellow": "amarillo", "blue": "azul",
    "brown": "café", "cafe": "café", "purple": "morado", "pink": "rosa", "orange": "anaranjado", "grey": "gris",
    "kuro": "negro", "shiro": "blanco", "aka(iro)": "rojo", "midori(iro)": "verde", "ki(iro)": "amarillo", "ao": "azul",
    "cha(iro)": "café", "murasaki(iro)": "morado", "momoiro": "rosa", "daidai(iro)": "anaranjado",
    "haiiro, nezumiiro": "gris", "hei": "negro", "pai": "blanco", "hung": "rojo", "lu": "verde", "huang": "amarillo", "lan": "azul",
}


def lab_to_xyz(lab):
    big_l, a, b = lab
    fy = (big_l + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200

    def inverse(t):
        return t ** 3 if t > 6 / 29 else 3 * (6 / 29) ** 2 * (t - 4 / 29)

    return tuple(w * inverse(f) for w, f in zip(WHITE_C, (fx, fy, fz)))


def rows(path):
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.startswith("#"):
            yield line.rstrip("\n").split("\t")


def read_chips(path):
    chips = {}
    for parts in rows(path):
        number, row, column, chroma, hue, value, big_l, a, b = parts
        xyz = mul(C_TO_D65, lab_to_xyz((float(big_l), float(a), float(b))))
        srgb, inside = fit(mul(XYZ_TO_SRGB, xyz))
        hue = re.sub(r"(\d+)\.(\d)0", r"\1.\2", hue).replace(".0", "")
        chips[int(number)] = {
            "n": int(number), "row": row, "col": int(column), "h": hue, "v": float(value),
            "c": int(chroma), "srgb": to_hex(srgb), "fit": inside,
        }
    return chips


def where(chips):
    return {(chip["row"], chip["col"]): number for number, chip in chips.items()}


def parse_foci(code, grid):
    found = []
    for row, columns in re.findall(r"([A-J])([0-9.,]+)", code):
        for part in columns.split(","):
            part = part.strip(".")
            if not part:
                continue
            if ".." in part:
                start, end = (int(x) for x in part.split(".."))
                span = range(start, end + 1)
            else:
                span = [int(part)]
            for column in span:
                number = grid.get((row, 0 if row in "AJ" else column))
                if number is not None and number not in found:
                    found.append(number)
    return found


def main(chip_path, term_path, foci_path, dict_path, out_path):
    chips = read_chips(chip_path)
    grid = where(chips)
    dictionary = {}
    for lnum, abbr, tnum, word in rows(dict_path):
        dictionary.setdefault(int(lnum), {})[abbr] = (tnum, word)
    named = {}
    for lnum, _, cnum, abbr in rows(term_path):
        named.setdefault(int(lnum), {}).setdefault(abbr, []).append(int(cnum))
    foci = {}
    for lnum, _, tnum, code in rows(foci_path):
        foci.setdefault(int(lnum), {})[tnum] = parse_foci(code, grid)

    languages = {}
    for key, (lnum, label) in LANGUAGES.items():
        terms = []
        for abbr, (tnum, word) in sorted(dictionary[lnum].items(), key=lambda item: (int(re.match(r"\d+", item[1][0]).group()), item[1][0])):
            native, reading = WORDS.get(key, {}).get(word, (word, ""))
            terms.append({
                "abbr": abbr, "word": native, "reading": reading, "gloss": GLOSS.get(word, word),
                "chips": sorted(named.get(lnum, {}).get(abbr, [])), "focus": foci.get(lnum, {}).get(tnum, []),
            })
        languages[key] = {"label": label, "terms": terms}

    data = {
        "format": "berlin-kay-1969/1",
        "source": "Berlin y Kay (1969), Basic Color Terms, apéndice 1, digitalizado por el archivo del World Color Survey (Cook, Kay y Regier)",
        "chips": sorted(chips.values(), key=lambda chip: ("ABCDEFGHIJ".index(chip["row"]), chip["col"])),
        "languages": languages,
    }
    Path(out_path).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for key, language in languages.items():
        print(key, language["label"], [(t["word"], len(t["chips"]), t["focus"][:3]) for t in language["terms"]])
    print(sum(1 for chip in chips.values() if not chip["fit"]), "de", len(chips), "fichas no caben en sRGB")


if __name__ == "__main__":
    main(*sys.argv[1:6])
