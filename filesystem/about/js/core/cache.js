const PREFIX = 'skye-about:';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key));
  } catch {
    return null;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), value }));
  } catch {}
}

export function peek(key) {
  return read(key)?.value ?? null;
}

export async function remember(key, ttl, load) {
  const hit = read(key);
  if (hit && Date.now() - hit.t < ttl) return hit.value;
  try {
    const value = await load();
    write(key, value);
    return value;
  } catch (error) {
    if (hit) return hit.value;
    throw error;
  }
}
