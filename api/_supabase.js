// ملف مشترك بين كل صفحات الـ API الخاصة بالإدارة
// المفتاح السري (service_role) بيتقرأ من Environment Variables على السيرفر بس،
// وأبدًا مش بيوصل لكود المتصفح.

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://npofzcmylmnepseedxvb.supabase.co';

export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// بيتأكد إن الطلب جاي من حد مسجل دخول فعلاً في لوحة التحكم (نفس كوكي admin_session
// اللي بيتحط من api/login.js)، قبل ما يسمح بأي تعديل أو حذف على قاعدة البيانات.
export async function isAdminRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  const cookie = match ? decodeURIComponent(match[1]) : null;
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!cookie || !adminPassword) return false;
  const expected = await hashPassword(adminPassword);
  return timingSafeEqual(cookie, expected);
}

// بينفذ طلب على REST API بتاعة Supabase باستخدام المفتاح السري (صلاحية كاملة،
// بيتجاوز أي حماية RLS) - ده بديل آمن لاستخدام anon key من المتصفح للكتابة.
export async function supabaseFetch(path, options = {}) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_missing');
  }
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...options, headers });
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
