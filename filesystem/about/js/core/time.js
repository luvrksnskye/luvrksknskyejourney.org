export const DAY = 86400000;

export const FIRST_LIGHT = Date.UTC(2023, 8, 1);

export const daysAlive = (now = Date.now()) => Math.floor((now - FIRST_LIGHT) / DAY);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const monthIndex = (text) => {
  const found = String(text).toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  return found ? MONTHS.indexOf(found[1]) : -1;
};

export function parseLongDate(text) {
  const found = String(text).match(/([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (!found) return null;
  const month = monthIndex(found[1]);
  return month < 0 ? null : Date.UTC(Number(found[3]), month, Number(found[2]));
}

const pad = (n) => String(n).padStart(2, '0');

export function stamp(ms) {
  const d = new Date(ms);
  return `${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}.${d.getUTCFullYear()}`;
}

export function monthLabel(ms) {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
