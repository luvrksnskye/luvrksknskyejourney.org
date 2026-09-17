const ENDPOINT = 'https://now-playing.luvrksnskye.workers.dev/visits';
const PAGE = 'about';
const SESSION_KEY = 'skye-about:visit';
const DWELL_MS = 4000;
const TIMEOUT_MS = 6000;

const quiet = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';

function sessionFlag(set) {
  try {
    if (set) sessionStorage.setItem(SESSION_KEY, '1');
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return true;
  }
}

const valid = (n) => Number.isSafeInteger(n) && n >= 0;

async function request(method) {
  const options = {
    method,
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  };
  if (method === 'POST') {
    options.headers = { 'content-type': 'application/json' };
    options.body = JSON.stringify({ page: PAGE });
  }
  const response = await fetch(method === 'POST' ? ENDPOINT : `${ENDPOINT}?page=${PAGE}`, options);
  if (!response.ok) throw new Error(String(response.status));
  const data = await response.json();
  if (!valid(data?.total) || !valid(data?.today)) throw new Error('shape');
  return { total: data.total, today: data.today };
}

function dwell() {
  return new Promise((resolve) => {
    let spent = 0;
    let since = document.hidden ? 0 : performance.now();
    let timer = 0;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(done, DWELL_MS - spent);
    };
    const done = () => {
      document.removeEventListener('visibilitychange', change);
      resolve();
    };
    const change = () => {
      if (document.hidden) {
        clearTimeout(timer);
        if (since) spent += performance.now() - since;
        since = 0;
      } else {
        since = performance.now();
        arm();
      }
    };
    document.addEventListener('visibilitychange', change);
    if (!document.hidden) arm();
  });
}

export async function loadVisits() {
  if (quiet() || sessionFlag(false)) return request('GET');
  await dwell();
  const counts = await request('POST');
  sessionFlag(true);
  return counts;
}
