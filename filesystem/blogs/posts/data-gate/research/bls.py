import numpy as np

BINS = 320
MAX_WIDTH = 26
MAX_ABS_PPM = 60000

def load_curve(path):
    raw = np.fromfile(path, dtype=np.float32).reshape(-1, 2)
    days = raw[:, 0].astype(np.float64)
    ppm = raw[:, 1].astype(np.float64)

    keep = np.abs(ppm) < MAX_ABS_PPM
    days = days[keep] - days[keep][0]
    flux = ppm[keep] / 1e6
    return days, flux - np.median(flux)

def scatter_ppm(flux):
    return float(1.4826 * np.median(np.abs(flux)) * 1e6)

def period_grid(min_period, max_period, trials):
    return 1.0 / np.linspace(1.0 / max_period, 1.0 / min_period, trials)

def periodogram(days, flux, periods, bins=BINS, max_width=MAX_WIDTH, progress=None):
    total = flux.size
    count = periods.size

    power = np.empty(count)
    depth = np.empty(count)
    width = np.empty(count, dtype=np.int32)
    offset = np.empty(count, dtype=np.int32)

    starts = np.arange(bins)
    widths = np.arange(1, max_width + 1)
    window_index = starts[None, :] + widths[:, None]

    for index, period in enumerate(periods):
        phase = days / period
        slot = ((phase - np.floor(phase)) * bins).astype(np.int32)
        np.clip(slot, 0, bins - 1, out=slot)

        sums = np.bincount(slot, weights=flux, minlength=bins)
        counts = np.bincount(slot, minlength=bins).astype(np.float64)
        rolled_sums = np.concatenate(([0.0], np.cumsum(np.concatenate((sums, sums)))))
        rolled_counts = np.concatenate(([0.0], np.cumsum(np.concatenate((counts, counts)))))

        window_sum = rolled_sums[window_index] - rolled_sums[starts][None, :]
        window_count = rolled_counts[window_index] - rolled_counts[starts][None, :]
        outside = total - window_count

        usable = (window_count >= 6) & (outside >= 6) & (window_sum < 0)
        residue = np.where(usable, window_sum * window_sum / (window_count * outside + 1e-12), 0.0)

        best = int(np.argmax(residue))
        row, column = divmod(best, bins)
        power[index] = np.sqrt(residue.flat[best])
        depth[index] = -window_sum[row, column] / max(window_count[row, column], 1.0)
        width[index] = widths[row]
        offset[index] = column

        if progress is not None:
            progress(index, count)

    return {"power": power, "depth": depth, "width": width, "offset": offset}

def significance(power):
    floor = np.median(power)
    spread = 1.4826 * np.median(np.abs(power - floor))
    return (power - floor) / (spread + 1e-12)

def log_sample(periods, values, samples, min_period, max_period):
    edges = np.linspace(np.log10(min_period), np.log10(max_period), samples + 1)
    slot = np.clip(np.digitize(np.log10(periods), edges) - 1, 0, samples - 1)

    kept_periods = []
    kept_values = []
    for bucket in range(samples):
        members = np.flatnonzero(slot == bucket)
        if members.size:
            best = members[int(np.argmax(values[members]))]
            kept_periods.append(float(periods[best]))
            kept_values.append(float(values[best]))

    return np.array(kept_periods), np.array(kept_values)

def flatten(values, half=90):
    floor = np.empty_like(values)
    for index in range(values.size):
        low = max(0, index - half)
        high = min(values.size, index + half + 1)
        floor[index] = np.median(values[low:high])
    return np.maximum(values - floor, 0.0)

def transit_mask(days, period, epoch, width_days, margin=0.75):
    phase = (days - epoch) / period
    phase -= np.floor(phase)
    phase[phase > 0.5] -= 1.0
    return np.abs(phase) < (width_days / period) * margin
