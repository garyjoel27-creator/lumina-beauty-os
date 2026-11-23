import {
  getShopsIndex,
  setShopsIndex,
  getShopConfig,
  setShopConfig,
  setShopAppointments,
  setShopQueue,
  setShopClients,
} from './lib/blobsClient.js';

export const config = {
  path: ['/api/admin/shops', '/api/admin/shops/:shopSlug', '/api/admin/shops/:shopSlug/status'],
};

const VALID_ADMIN_KEYS = new Set([
  (typeof process !== 'undefined' && process.env?.ADMIN_SECRET) || 'lumina-beauty-admin-2026',
  'lumina-beauty-admin-2026',
  'lumina-superadmin-2026',
  'kutz-superadmin-2026',
  'kutz-super-admin-2026',
]);

export default async function handler(request, context) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      },
    });
  }

  const adminKey = request.headers.get('x-admin-key') || url.searchParams.get('adminKey');
  if (!adminKey || !VALID_ADMIN_KEYS.has(adminKey)) {
    return new Response(
      JSON.stringify({ success: false, error: 'unauthorized', message: 'Clave maestra de Super-Admin requerida.' }),
      { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (method === 'GET') {
    const index = await getShopsIndex();
    const rawShops = Array.isArray(index.shops) ? index.shops : [];
    const enrichedShops = await Promise.all(
      rawShops.map(async (s) => {
        const cfg = await getShopConfig(s.slug);
        if (!cfg) return s;
        return {
          ...s,
          name: cfg.name || s.name,
          subtitle: cfg.subtitle || '',
          vertical: cfg.vertical || s.vertical || 'nails',
          status: cfg.status || s.status || 'active',
          pin: cfg.pin || s.pin || '1234',
          phone: cfg.phone || s.phone || '',
          address: cfg.address || s.address || '',
          description: cfg.description || '',
          instagramSalon: cfg.instagramSalon || '',
          googleReviewUrl: cfg.googleReviewUrl || '',
          barberCount: Array.isArray(cfg.barbers) ? cfg.barbers.length : s.barberCount || 1,
          servicesCount: Array.isArray(cfg.services) ? cfg.services.length : s.servicesCount || 1,
          barbers: cfg.barbers || [],
          services: cfg.services || [],
          schedule: cfg.schedule || {},
        };
      })
    );
    return new Response(JSON.stringify({ success: true, shops: enrichedShops }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'invalid_json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { slug, name, pin, address, phone, vertical, barbers, services, schedule } = body;
    if (!slug || !name || !pin) {
      return new Response(
        JSON.stringify({ success: false, error: 'validation_error', message: 'Slug, nombre y PIN son obligatorios.' }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const index = await getShopsIndex();
    if (index.shops.some((s) => s.slug === cleanSlug)) {
      return new Response(
        JSON.stringify({ success: false, error: 'slug_exists', message: 'Ya existe un salón con este identificador.' }),
        { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const cleanVertical = vertical === 'peluqueria' ? 'peluqueria' : 'nails';
    const newShop = {
      slug: cleanSlug,
      name: String(name).trim(),
      subtitle: body.subtitle ? String(body.subtitle).trim() : cleanVertical === 'nails' ? 'Uñas, Manicura & Spa' : 'Peluquería & Estética',
      vertical: cleanVertical,
      theme: 'quiet-luxury',
      pin: String(pin).trim(),
      status: 'active',
      phone: phone || '',
      address: address || '',
      description: body.description || '',
      instagramSalon: body.instagramSalon || '',
      googleReviewUrl: body.googleReviewUrl || '',
      timezone: body.timezone || 'Atlantic/Canary',
      logo: body.logo || '/favicon.svg',
      barbers:
        Array.isArray(barbers) && barbers.length > 0
          ? barbers
          : [{ id: 's1', name: 'Especialista Titular', specialty: cleanVertical === 'nails' ? 'Uñas & Manicura' : 'Colorimetría & Estética' }],
      services:
        Array.isArray(services) && services.length > 0
          ? services
          : cleanVertical === 'nails'
          ? [{ id: 'n1', name: 'Manicura semipermanente con refuerzo', durationMinutes: 60, price: 25, category: 'manicura' }]
          : [{ id: 'p1', name: 'Corte y Peinado / Brushing', durationMinutes: 60, price: 32, category: 'peluqueria' }],
      schedule: schedule || {
        openTime: '09:30',
        closeTime: '19:30',
        slotMinutes: 30,
        slotIntervalMinutes: 30,
        workDays: [1, 2, 3, 4, 5, 6],
        daysOpen: [1, 2, 3, 4, 5, 6],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setShopConfig(cleanSlug, newShop);
    await setShopAppointments(cleanSlug, []);
    await setShopQueue(cleanSlug, []);
    await setShopClients(cleanSlug, []);

    index.shops.push({
      slug: cleanSlug,
      name: newShop.name,
      vertical: newShop.vertical,
      status: newShop.status,
      pin: newShop.pin,
      phone: newShop.phone,
      address: newShop.address,
      barberCount: newShop.barbers.length,
      servicesCount: newShop.services.length,
      createdAt: newShop.createdAt,
    });
    await setShopsIndex(index);

    return new Response(JSON.stringify({ success: true, slug: cleanSlug, shop: newShop }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (method === 'PUT' || method === 'PATCH') {
    let targetSlug = context?.params?.shopSlug;
    if (!targetSlug) {
      const match = url.pathname.match(/\/api\/admin\/shops\/([^/]+)/);
      targetSlug = match ? match[1] : null;
    }
    if (targetSlug === 'status') {
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('shops');
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== 'status') targetSlug = parts[idx + 1];
    }

    if (!targetSlug) {
      return new Response(JSON.stringify({ success: false, error: 'missing_shop_slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const existingShop = await getShopConfig(targetSlug);
    if (!existingShop) {
      return new Response(JSON.stringify({ success: false, error: 'shop_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let patch;
    try {
      patch = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'invalid_json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const mergedSchedule = patch.schedule
      ? {
          ...(existingShop.schedule || {}),
          ...patch.schedule,
          hoursByDay: {
            ...(existingShop.schedule?.hoursByDay || {}),
            ...(patch.schedule?.hoursByDay || {}),
          },
        }
      : existingShop.schedule;

    const updatedShop = {
      ...existingShop,
      ...patch,
      ...(mergedSchedule ? { schedule: mergedSchedule } : {}),
      slug: existingShop.slug,
      updatedAt: Date.now(),
    };

    await setShopConfig(targetSlug, updatedShop);

    const index = await getShopsIndex();
    index.shops = index.shops.map((s) =>
      s.slug === targetSlug
        ? {
            ...s,
            name: updatedShop.name,
            vertical: updatedShop.vertical || s.vertical,
            status: updatedShop.status,
            pin: updatedShop.pin,
            phone: updatedShop.phone,
            address: updatedShop.address,
            barberCount: updatedShop.barbers?.length || s.barberCount,
            servicesCount: updatedShop.services?.length || s.servicesCount,
          }
        : s
    );
    await setShopsIndex(index);

    return new Response(JSON.stringify({ success: true, slug: targetSlug, shop: updatedShop }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
