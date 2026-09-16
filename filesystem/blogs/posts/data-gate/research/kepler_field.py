import csv
import json
import math
import statistics
import sys

SUN_KELVIN = 5772.0
PARSEC_TO_LIGHTYEAR = 3.26156
MIN_PARSEC = 10
MAX_PARSEC = 20000
KEEP = ("CONFIRMED", "CANDIDATE", "FALSE POSITIVE")

def number(row, key):
    try:
        value = float(row.get(key, ""))
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None

def distance_parsec(radius, kelvin, magnitude):
    luminosity = (radius ** 2) * (kelvin / SUN_KELVIN) ** 4
    absolute = 4.74 - 2.5 * math.log10(luminosity)
    return 10 ** ((magnitude - absolute + 5) / 5)

def read_stars(path):
    stars = {}
    with open(path, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            if row.get("koi_disposition") not in KEEP:
                continue

            ra = number(row, "ra")
            dec = number(row, "dec")
            radius = number(row, "koi_srad")
            kelvin = number(row, "koi_steff")
            magnitude = number(row, "koi_kepmag")
            if None in (ra, dec, radius, kelvin, magnitude) or radius <= 0 or kelvin <= 0:
                continue

            parsec = distance_parsec(radius, kelvin, magnitude)
            if not MIN_PARSEC <= parsec <= MAX_PARSEC:
                continue

            star = stars.setdefault(row["kepid"], {
                "ra": ra, "dec": dec, "parsec": parsec, "kelvin": kelvin,
                "radius": radius, "planets": 0, "confirmed": 0, "name": "",
            })
            star["planets"] += 1
            if row["koi_disposition"] == "CONFIRMED":
                star["confirmed"] += 1
                name = (row.get("kepler_name") or "").strip()
                if name and not star["name"]:
                    star["name"] = name.rsplit(" ", 1)[0]
    return list(stars.values())

def main(csv_path, out_path):
    stars = read_stars(csv_path)

    placed = []
    for star in stars:
        ra = math.radians(star["ra"])
        dec = math.radians(star["dec"])
        parsec = star["parsec"]
        placed.append({
            "x": math.cos(dec) * math.cos(ra) * parsec,
            "y": math.sin(dec) * parsec,
            "z": math.cos(dec) * math.sin(ra) * parsec,
            "star": star,
        })

    centre = [statistics.median([point[axis] for point in placed]) for axis in ("x", "y", "z")]
    spread = sorted(
        math.dist((point["x"], point["y"], point["z"]), centre) for point in placed
    )[int(len(placed) * 0.97)]

    flat = []
    names = {}
    for index, point in enumerate(placed):
        star = point["star"]
        flat.extend([
            round((point["x"] - centre[0]) / spread, 4),
            round((point["y"] - centre[1]) / spread, 4),
            round((point["z"] - centre[2]) / spread, 4),
            round(star["kelvin"]),
            round(star["radius"], 3),
            star["planets"],
            star["confirmed"],
            round(star["parsec"] * PARSEC_TO_LIGHTYEAR),
        ])
        if star["name"]:
            names[index] = star["name"]

    distances = [point["star"]["parsec"] for point in placed]
    payload = {
        "version": 1,
        "source": "NASA Exoplanet Archive, tabla KOI acumulada",
        "method": "distancia fotometrica estimada con radio y temperatura, sin paralaje ni extincion",
        "stride": 8,
        "fields": ["x", "y", "z", "teff", "radius", "planets", "confirmed", "lightyears"],
        "count": len(placed),
        "scale_pc": round(spread, 2),
        "earth": [round(-centre[axis] / spread, 4) for axis in range(3)],
        "median_ly": round(statistics.median(distances) * PARSEC_TO_LIGHTYEAR),
        "points": flat,
        "names": names,
    }

    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))

    print(f"estrellas {len(placed)}")
    print(f"mediana {payload['median_ly']} anios luz")
    print(f"rango {round(min(distances) * PARSEC_TO_LIGHTYEAR)} a "
          f"{round(max(distances) * PARSEC_TO_LIGHTYEAR)} anios luz")
    print(f"con nombre {len(names)}")
    print(f"guardado en {out_path}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
