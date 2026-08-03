// إضافة/تعديل/حذف التصميمات - بيتنفذ على السيرفر بس بعد التأكد إن اللي طالب
// فعلاً مسجل دخول بالباسورد (نفس حماية admin.html بالظبط)
export const config = { runtime: 'edge' };
import { isAdminRequest, supabaseFetch, json } from './_supabase.js';

export default async function handler(request) {
  if (!(await isAdminRequest(request))) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'bad_request' }, 400);
    }
    const { id, name, desc, weight, color, image, type, min_weight } = body || {};
    if (!name || !weight) {
      return json({ ok: false, error: 'missing_fields' }, 400);
    }
    // عمود description في الجدول (اسم desc محجوز في SQL)، بس بنستقبله من الفورم باسم desc
    const record = {
      id: id || `d${Date.now()}`,
      name: String(name).trim(),
      description: desc ? String(desc).trim() : '',
      weight: Number(weight),
      color: color || '#e8cf8a,#8a742f',
      image: image || null,
      type: type === 'chain' ? 'chain' : 'design',
      min_weight: Number(min_weight) || 0,
    };
    try {
      const res = await supabaseFetch('/designs', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(record),
      });
      if (!res.ok) {
        const errText = await res.text();
        return json({ ok: false, error: errText }, 500);
      }
      const data = await res.json();
      return json({ ok: true, design: data[0] || record });
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
      const res = await supabaseFetch(`/designs?id=eq.${encodeURIComponent(body.id)}`, {
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
