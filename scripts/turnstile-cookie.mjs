// REQ-102.1: the bot-check cookie is signed by the server, so scripts can't write it by hand.
// Against a local server (Turnstile test secret) any token passes; returns the cookie's value.
export async function turnstileCookieValue(baseUrl) {
  const response = await fetch(`${baseUrl}/api/turnstile/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'script' }),
  });
  const cookie = response.headers.getSetCookie().find((c) => c.startsWith('turnstile_verified='));
  if (!cookie) throw new Error(`No turnstile_verified cookie from ${baseUrl} (HTTP ${response.status}); local dev server only.`);
  return cookie.split(';')[0].slice('turnstile_verified='.length);
}
