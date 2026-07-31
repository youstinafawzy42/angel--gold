// عرض/حذف الطلبات - جدول orders مش متاح قراءته من المتصفح (RLS)، فلازم يعدي من هنا
export const config = { runtime: 'edge' };
import { isAdminRequest, supabaseFetch, json } from './_supabase.js';

export default async function handler(request) {
  if (!(await isAdminRequest(request))) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method === 'GET') {
    try {
      const res = await supabaseFetch('/orders?select=*&order=created_at.desc');
      if (!res.ok) {
        const errText = await res.text();
        return json({ ok: false, error: errText }, 500);
      }
      const data = await res.json();
      return json({ ok: true, orders: data });
    } catch (e) {
      return json({ ok: false, error: String(e) }, 500);
    }
  }

  if (request.method === 'DELETE') {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'bad_request' }, 400);
    }
    if (!body || !body.id) {
      return json({ ok: false, error: 'missing_id' }, 400);
    }
    try {
      const res = await supabaseFetch(`/orders?id=eq.${encodeURIComponent(body.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errText = await res.text();
        return json({ ok: false, error: errText }, 500);
      }
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: String(e) }, 500);
    }
  }

  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
