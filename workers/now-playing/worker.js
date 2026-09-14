import { respond, fail, cors } from './lib/http.js';
import { handleNowPlaying } from './lib/now-playing.js';
import { handleClock } from './lib/clock.js';
import { handleWall } from './lib/wall.js';

const ROUTES = [
  { test: (path) => path === '/now-playing', methods: 'GET, HEAD, OPTIONS', handle: handleNowPlaying },
  { test: (path) => path === '/clock', methods: 'GET, HEAD, OPTIONS', handle: handleClock },
  { test: (path) => path === '/wall' || path.startsWith('/wall/'), methods: 'GET, POST, OPTIONS', handle: handleWall }
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
