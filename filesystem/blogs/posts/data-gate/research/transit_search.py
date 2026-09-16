import json
import sys
import time

import numpy as np

import bls

MIN_PERIOD = 0.6
MAX_PERIOD = 400.0
TRIALS = 90000
SAMPLES = 2200
TOP_PEAKS = 12

KNOWN = [
    ("Kepler-90 b", 7.008151),
    ("Kepler-90 c", 8.719375),
    ("Kepler-90 i", 14.44912),
    ("Kepler-90 d", 59.73667),
    ("Kepler-90 e", 91.93913),
    ("Kepler-90 f", 124.9144),
    ("Kepler-90 g", 210.60697),
    ("Kepler-90 h", 331.60059),
]

def identify(period):
    for name, known in KNOWN:
        ratio = period / known
        if abs(ratio - 1) < 0.01:
            return name
        for factor in (2, 3, 4):
            if abs(ratio - factor) < 0.01:
                return f"{name} x{factor}"
            if abs(ratio - 1 / factor) < 0.01 / factor:
                return f"{name} /{factor}"
    return ""

def main(curve_path, out_path):
    days, flux = bls.load_curve(curve_path)
    noise = bls.scatter_ppm(flux)
    print(f"puntos {flux.size}")
    print(f"baseline {days[-1]:.0f} dias")
    print(f"ruido por medicion {noise:.0f} ppm")

    periods = bls.period_grid(MIN_PERIOD, MAX_PERIOD, TRIALS)
    started = time.time()

    def progress(index, count):
        if index and index % 9000 == 0:
            rate = index / (time.time() - started)
            print(f"  {index}/{count} periodos - {rate:.0f}/s", flush=True)

    result = bls.periodogram(days, flux, periods, progress=progress)
    elapsed = time.time() - started
    print(f"busqueda terminada en {elapsed:.0f} s")

    strength = bls.significance(result["power"])

    peaks = []
    for index in np.argsort(strength)[::-1]:
        period = float(periods[index])
        if any(abs(period / peak["period"] - 1) < 0.02 for peak in peaks):
            continue
        peaks.append({
            "period": round(period, 5),
            "depth_ppm": round(float(result["depth"][index]) * 1e6),
            "duration_h": round(float(result["width"][index]) / bls.BINS * period * 24, 2),
            "significance": round(float(strength[index]), 1),
            "match": identify(period),
        })
        if len(peaks) >= TOP_PEAKS:
            break

    for peak in peaks:
        print(f"  {peak['period']:9.4f} d  {peak['depth_ppm']:6d} ppm  "
              f"sig {peak['significance']:6.1f}  {peak['match'] or '-'}")

    sampled_periods, sampled_power = bls.log_sample(periods, strength, SAMPLES, MIN_PERIOD, MAX_PERIOD)
    flat = bls.flatten(sampled_power)
    print(f"periodograma en {flat.size} muestras, pico {flat.max():.1f}")

    payload = {
        "version": 1,
        "star": "Kepler-90",
        "method": f"Box Least Squares sobre la curva real, {TRIALS} periodos entre {MIN_PERIOD} y {MAX_PERIOD} dias",
        "points": int(flux.size),
        "baseline_days": round(float(days[-1]), 1),
        "scatter_ppm": round(noise),
        "seconds": round(elapsed),
        "periods": [round(float(value), 4) for value in sampled_periods],
        "power": [round(float(value), 2) for value in flat],
        "peaks": peaks,
        "known": [{"name": name, "period": period} for name, period in KNOWN],
    }

    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))
    print(f"guardado en {out_path}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
