// Vercel Edge Function
// بتقارن الباسورد اللي المستخدم كتبها بالباسورد الحقيقي المخزّن في Environment Variables
// على السيرفر (مش في المتصفح خالص)، ولو صح بتحط كوكي جلسة آمنة (HttpOnly).

export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let password = '';
  try {
    const body = await request.json();
    password = body.password || '';
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!expectedPassword) {
    return new Response(JSON.stringify({ ok: false, error: 'server_not_configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (password !== expectedPassword) {
    return new Response(JSON.stringify({ ok: false, error: 'wrong_password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionValue = await hashPassword(expectedPassword);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  // 12 ساعة صلاحية للجلسة، تقدري تغيّري Max-Age لو عايزة مدة مختلفة
  headers.append(
    'Set-Cookie',
    `admin_session=${sessionValue}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
