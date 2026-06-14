// Tiny fetch wrapper with bearer-token auth.
// Token storage is here so the auth module can swap it out without other
// modules caring how the JWT is persisted.

const TOKEN_KEY = 'tc_token';
let _token = localStorage.getItem(TOKEN_KEY) || null;

export function getToken()        { return _token; }
export function setToken(token)   { _token = token; localStorage.setItem(TOKEN_KEY, token); }
export function clearToken()      { _token = null; localStorage.removeItem(TOKEN_KEY); }

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(_token ? { Authorization: 'Bearer ' + _token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error(data.error || 'Request failed');
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}
