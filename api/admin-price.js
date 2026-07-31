// تحديث سعر الذهب - بيتنفذ على السيرفر بعد التأكد من تسجيل الدخول
export const config = { runtime: 'edge' };
import { isAdminRequest, supabaseFetch, json } from './_supabase.js';

export default async function handler(request) {
  if (!(await isAdminRequest(request))) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const karat21 = Number(body?.karat21);
  const karat18 = Number(body?.karat18);
  const pound = Number(body?.pound);
  const work = Number(body?.work);

  if (!karat21 || !karat18 || !pound || !work) {
    return json({ ok: false, error: 'missing_fields' }, 400);
  }

  try {
    const res = await supabaseFetch('/gold_price?id=eq.1', {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ karat21, karat18, pound, work, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return json({ ok: false, error: errText }, 500);
    }
    const data = await res.json();
    return json({ ok: true, price: data[0] || { karat21, karat18, pound, work } });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}
