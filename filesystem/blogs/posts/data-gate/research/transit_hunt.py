import json
import sys
import time

import numpy as np

import bls

PASSES = 8
WIDE_PASSES = 3
WIDE_TRIALS = 60000
NARROW_TRIALS = 30000
MIN_PERIOD = 0.6
WIDE_MAX = 400.0
NARROW_MAX = 70.0

KNOWN = {
    "Kepler-90 b": 7.008151,
    "Kepler-90 c": 8.719375,
    "Kepler-90 i": 14.44912,
    "Kepler-90 d": 59.73667,
    "Kepler-90 e": 91.93913,
    "Kepler-90 f": 124.9144,
    "Kepler-90 g": 210.60697,
    "Kepler-90 h": 331.60059,
}

def identify(period):
    for name, known in KNOWN.items():
        ratio = period / known
        if abs(ratio - 1) < 0.015:
            return name, "planeta"
        for factor in (2, 3, 4, 5):
            if abs(ratio - factor) < 0.02 or abs(ratio - 1 / factor) < 0.02 / factor:
                return name, "eco"
    return "", "desconocido"

def best_transit(days, flux, alive, max_period, trials):
    periods = bls.period_grid(MIN_PERIOD, max_period, trials)
    result = bls.periodogram(days[alive], flux[alive], periods)
    strength = bls.significance(result["power"])
    index = int(np.argmax(strength))
    period = float(periods[index])
    width_days = float(result["width"][index]) / bls.BINS * period
    return {
        "period": period,
        "depth": float(result["depth"][index]),
        "width_days": width_days,
        "epoch": (float(result["offset"][index]) + result["width"][index] / 2) / bls.BINS * period,
        "significance": float(strength[index]),
    }

def main(curve_path, out_path):
    days, flux = bls.load_curve(curve_path)
    alive = np.ones(flux.size, dtype=bool)
    print(f"puntos {flux.size}, baseline {days[-1]:.0f} dias", flush=True)

    found = []
    started = time.time()

    for step in range(PASSES):
        wide = step < WIDE_PASSES
        hit = best_transit(
            days, flux, alive,
            WIDE_MAX if wide else NARROW_MAX,
            WIDE_TRIALS if wide else NARROW_TRIALS,
        )
        name, kind = identify(hit["period"])

        inside = bls.transit_mask(days, hit["period"], hit["epoch"], hit["width_days"])
        removed = int((alive & inside).sum())
        alive &= ~inside

        found.append({
            "pass": step + 1,
            "period": round(hit["period"], 5),
            "depth_ppm": round(hit["depth"] * 1e6),
            "duration_h": round(hit["width_days"] * 24, 2),
            "significance": round(hit["significance"], 1),
            "name": name,
            "kind": kind,
            "masked": removed,
            "left": int(alive.sum()),
        })

        print(f"vuelta {step + 1}: {hit['period']:9.4f} d  {round(hit['depth'] * 1e6):5d} ppm  "
              f"sig {hit['significance']:6.1f}  {name or 'sin identificar'} ({kind})  "
              f"quedan {int(alive.sum())} puntos  {time.time() - started:.0f} s", flush=True)

    payload = {
        "version": 1,
        "star": "Kepler-90",
        "method": "BLS iterativo: buscar, apuntar, borrar las bajadas y repetir",
        "passes": PASSES,
        "points": int(flux.size),
        "found": found,
        "known": [{"name": name, "period": period} for name, period in KNOWN.items()],
    }

    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))

    planets = sorted({entry["name"] for entry in found if entry["kind"] == "planeta"})
    print(f"planetas reencontrados: {', '.join(planets) if planets else 'ninguno'}")
    print(f"guardado en {out_path}, {time.time() - started:.0f} s")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
