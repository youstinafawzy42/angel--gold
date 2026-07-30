export const config = { runtime: 'edge' };

export default async function handler(request) {
  const headers = new Headers();
  headers.append('Set-Cookie', 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  headers.set('Location', new URL('/index.html', request.url).toString());
  return new Response(null, { status: 302, headers });
}
