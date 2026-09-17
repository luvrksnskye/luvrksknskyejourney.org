import { respond, fail, cors } from './lib/http.js';
import { handleNowPlaying } from './routes/now-playing.js';
import { handleClock } from './routes/clock.js';
import { handleWall } from './routes/wall.js';
import { handleVisits } from './routes/visits.js';

const ROUTES = [
  { test: (path) => path === '/now-playing', methods: 'GET, HEAD, OPTIONS', handle: handleNowPlaying },
  { test: (path) => path === '/clock', methods: 'GET, HEAD, OPTIONS', handle: handleClock },
  { test: (path) => path === '/wall' || path.startsWith('/wall/'), methods: 'GET, POST, OPTIONS', handle: handleWall },
  { test: (path) => path === '/visits', methods: 'GET, HEAD, POST, OPTIONS', handle: handleVisits }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = ROUTES.find(({ test }) => test(url.pathname));
    if (!route) return fail(404, 'not_found');

    const access = cors(request, env, route.methods);
    if (request.method === 'OPTIONS') return respond(access ? 204 : 403, null, access ?? {});

    try {
      return await route.handle(request, env, ctx, { url, access });
    } catch {
      return fail(500, 'internal_error', access ?? {});
    }
  }
};
