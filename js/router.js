// js/router.js — Hash router avec params

const routes = {};
let _currentRoute = { path: '/', params: {} };

export function route(pattern, handler) {
  routes[pattern] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return { ..._currentRoute };
}

function matchRoute(hash) {
  const raw = hash.replace(/^#\/?/, '');
  const path = '/' + raw.replace(/^\//, '');

  if (routes[path]) {
    return { handler: routes[path], params: {}, path };
  }

  for (const pattern of Object.keys(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) {
      const paramNames = (pattern.match(/:\w+/g) || []).map(p => p.slice(1));
      const params = {};
      paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
      return { handler: routes[pattern], params, path };
    }
  }

  return null;
}

function dispatch(hash) {
  const result = matchRoute(hash);
  if (result) {
    _currentRoute = { path: result.path, params: result.params };
    result.handler(result.params);
  } else {
    navigate('/home');
  }
}

export function startRouter() {
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest('[data-navigate]');
    if (el) {
      e.preventDefault();
      navigate(el.dataset.navigate);
    }
  });

  window.addEventListener('hashchange', () => {
    dispatch(window.location.hash);
  });

  dispatch(window.location.hash);
}
