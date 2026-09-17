import { encode } from './http.js';

export async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encode(text)));
}

export function toHex(bytes) {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

export async function fingerprint(body) {
  return `"${toHex((await digest(body)).slice(0, 12))}"`;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', typeof secret === 'string' ? encode(secret) : secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function keyedHash(secret, label, message, bytes = 16) {
  const master = await hmacKey(secret);
  const derived = await crypto.subtle.sign('HMAC', master, encode(label));
  const key = await hmacKey(derived);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encode(message)));
  return toHex(mac.slice(0, bytes));
}

export async function bearerMatches(request, secret) {
  const match = /^Bearer\s+(\S+)$/.exec(request.headers.get('authorization') ?? '');
  if (!match || typeof secret !== 'string' || secret.length < 16) return false;
  const [given, expected] = await Promise.all([digest(match[1]), digest(secret)]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(given, expected);
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given[i] ^ expected[i];
  return diff === 0;
}
