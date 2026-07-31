// Vercel Edge Middleware
// بيشتغل على السيرفر قبل ما admin.html يوصل للمتصفح خالص.
// لو مفيش كوكي جلسة صحيحة، بيوديك على طول لصفحة تسجيل الدخول.

export const config = {
  matcher: ['/admin.html', '/admin'],
};

export default async function middleware(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  const cookie = match ? decodeURIComponent(match[1]) : null;
  const expected = await hashPassword(process.env.ADMIN_PASSWORD || '');

  if (cookie && expected && timingSafeEqual(cookie, expected)) {
    return; // مسموح - كمّلي عرض الصفحة عادي
  }

  const loginUrl = new URL('/login.html', request.url);
  loginUrl.searchParams.set('next', '/admin.html');
  return Response.redirect(loginUrl, 302);
}

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// مقارنة بوقت ثابت عشان نمنع Timing attacks بسيطة
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
