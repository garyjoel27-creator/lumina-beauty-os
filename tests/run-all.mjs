#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bookingHandler from '../netlify/functions/booking.js';
import syncHandler from '../netlify/functions/sync.js';
import adminHandler from '../netlify/functions/admin.js';
import { resetMemoryStore, getShopConfig } from '../netlify/functions/lib/blobsClient.js';
import {
  SHOP_CAMPODONICO_NAILS_CONFIG,
  SHOP_PELUQUERIA_ESTETICA_CONFIG,
  formatWhatsAppPhone,
  buildWhatsAppUrl,
  getShopVertical,
  isPublicBookingPath,
  resolveTenantSlug,
  NAIL_SHAPES,
  NAIL_POLISH_COLORS,
} from '../src/lib/shopUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ ${name}\n    ${err.message}`);
  }
}

console.log('\n=====================================================================');
console.log('  LUMINA // BEAUTY & SALON — AUTOMATED VERIFICATION SUITE');
console.log('=====================================================================\n');

await test('1. CM Salón D’ Campodónico (campodonico-nails) has all 10 official services, Arrecife info & PIN 2023', async () => {
  resetMemoryStore();
  const cfg = await getShopConfig('campodonico-nails');
  assert.equal(cfg.slug, 'campodonico-nails');
  assert.equal(cfg.vertical, 'nails');
  assert.equal(cfg.pin, '2023');
  assert.equal(cfg.phone, '638 877 945');
  assert.equal(cfg.instagramSalon, 'cm.salondcampodonico');
  assert.ok(cfg.address.includes('Arrecife'));
  assert.equal(cfg.services.length, 10);

  const expected = [
    ['Uñas acrílicas Talla S', 45, 90],
    ['Uñas acrílicas Talla M/L', 50, 105],
    ['Relleno acrílico', 35, 75],
    ['Manicura semipermanente con refuerzo', 25, 60],
    ['Manicura / Limpieza tradicional', 20, 45],
    ['Pedicura completa & Spa', 30, 60],
    ['Retiro semipermanente', 5, 15],
    ['Retiro tradicional', 3, 15],
    ['Reparación uña caída', 3, 15],
    ['Higiene facial profunda', 35, 60],
  ];
  for (const [name, price, dur] of expected) {
    const found = cfg.services.find((s) => s.name === name);
    assert.ok(found, `Missing service: ${name}`);
    assert.equal(found.price, price, `Price mismatch for ${name}`);
    assert.equal(found.durationMinutes, dur, `Duration mismatch for ${name}`);
  }
});

await test('2. Lumina Atelier Peluquería & Estética (peluqueria-estetica) has 9 pure hair/facial services & ZERO nails/pedicura', async () => {
  resetMemoryStore();
  const cfg = await getShopConfig('peluqueria-estetica');
  assert.equal(cfg.slug, 'peluqueria-estetica');
  assert.equal(cfg.vertical, 'peluqueria');
  assert.equal(cfg.pin, '1234');
  assert.equal(cfg.services.length, 9);

  const forbidden = ['uñas', 'unas', 'manicura', 'pedicura', 'acrílic', 'acrilic'];
  for (const svc of cfg.services) {
    const low = svc.name.toLowerCase();
    for (const bad of forbidden) {
      assert.ok(!low.includes(bad), `Forbidden nail/pedicure term "${bad}" found in "${svc.name}"`);
    }
  }
});

await test('3. Brand & Aesthetic Audit: Quiet Luxury Silk Cream palette, editorial fonts, ZERO barber/KUTZ references in UI', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
  const layout = fs.readFileSync(path.join(rootDir, 'src/components/Layout.jsx'), 'utf8');
  const booking = fs.readFileSync(path.join(rootDir, 'src/pages/PublicBookingView.jsx'), 'utf8');

  assert.ok(html.includes('Cormorant Garamond'));
  assert.ok(html.includes('Playfair Display'));
  assert.ok(html.includes('#FAF6F2'));
  assert.ok(css.includes('#FAF6F2'));
  assert.ok(css.includes('#2A201D'));
  assert.ok(css.includes('#C87A72'));
  assert.ok(css.includes('#C59B5F'));
  assert.ok(css.includes('backdrop-filter: blur(8px)'));

  const combined = (html + layout + booking).toLowerCase();
  assert.ok(!combined.includes('kutz'), 'KUTZ leaked into UI');
  assert.ok(!combined.includes('barbería'), 'Barbería leaked into UI');
  assert.ok(!combined.includes('skin fade'), 'Skin fade leaked into UI');
});

await test('4. Visual Nail Catalog (4 shapes + 6 real polish colors) & WhatsApp +34 normalization', () => {
  assert.equal(NAIL_SHAPES.length, 4);
  assert.equal(NAIL_POLISH_COLORS.length, 6);
  assert.equal(formatWhatsAppPhone('638 877 945'), '34638877945');
  assert.ok(buildWhatsAppUrl('638 877 945', 'Hola').startsWith('https://wa.me/34638877945?text='));
  assert.equal(getShopVertical(SHOP_CAMPODONICO_NAILS_CONFIG, 'campodonico-nails'), 'nails');
  assert.equal(getShopVertical(SHOP_PELUQUERIA_ESTETICA_CONFIG, 'peluqueria-estetica'), 'peluqueria');
  assert.equal(isPublicBookingPath('/r/campodonico-nails'), true);
  assert.equal(isPublicBookingPath('/reservar'), true);
  assert.equal(isPublicBookingPath('/clients'), false);
  assert.equal(resolveTenantSlug('/r/peluqueria-estetica'), 'peluqueria-estetica');
});

await test('5. Public Booking API (/public-state) never leaks PIN & rejects Sunday closed', async () => {
  resetMemoryStore();
  // Monday 2026-11-23
  const res = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/public-state?date=2026-11-23'),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.shop.pin, undefined, 'PIN leaked in public-state!');
  assert.ok(data.availability.length > 0);

  // Sunday 2026-11-22 (closed)
  const sunRes = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/public-state?date=2026-11-22'),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  const sunData = await sunRes.json();
  assert.equal(sunData.closedOnDate, true);
  assert.equal(sunData.availability.length, 0);
});

await test('6. Interval Overlap & Closing Boundary Guard for multi-hour beauty services (105m & 120m)', async () => {
  resetMemoryStore();
  // Book 105m Uñas acrílicas M/L at 11:00 -> 12:45 on Monday 2026-11-23
  const b1 = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Valeria',
        clientPhone: '638877945',
        barberId: 'nails-master',
        serviceId: 'cn2',
        date: '2026-11-23',
        timeSlot: '11:00',
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(b1.status, 201);

  // Overlapping booking at 12:00 with same specialist must fail with 409
  const bOverlap = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Lucía',
        clientPhone: '628441122',
        barberId: 'nails-master',
        serviceId: 'cn4',
        date: '2026-11-23',
        timeSlot: '12:00',
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(bOverlap.status, 409);

  // Closing boundary: 120m Balayage at 18:30 when close is 19:30 must fail with 400
  const bLate = await bookingHandler(
    new Request('http://localhost/api/shops/peluqueria-estetica/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Sofía',
        clientPhone: '638877945',
        barberId: 'estilista-color',
        serviceId: 'pe3',
        date: '2026-11-23',
        timeSlot: '18:30',
      }),
    }),
    { params: { shopSlug: 'peluqueria-estetica' } }
  );
  assert.equal(bLate.status, 400);
});

await test('7. Sync API enforces strict PIN auth (rejects 1234 on campodonico-nails, accepts 2023, omits PIN)', async () => {
  resetMemoryStore();
  const bad = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '1234' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(bad.status, 401);

  const ok = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '2023' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.config.pin, undefined);

  // Test add_appointment + reschedule + delete_appointment
  const addRes = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({
        action: 'add_appointment',
        payload: { id: 'apt-test-1', clientName: 'Elena', date: '2026-11-23', timeSlot: '15:00', durationMinutes: 60 },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(addRes.status, 201);

  const resched = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({
        action: 'reschedule',
        payload: { appointmentId: 'apt-test-1', timeSlot: '16:00', durationMinutes: 90 },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  const reschedData = await resched.json();
  assert.equal(reschedData.appointment.timeSlot, '16:00');
  assert.equal(reschedData.appointment.durationMinutes, 90);
});

await test('8. Super-Admin API accepts lumina-beauty-admin-2026 & kutz-superadmin-2026, provisions & pauses salons', async () => {
  resetMemoryStore();
  const unauth = await adminHandler(new Request('http://localhost/api/admin/shops'));
  assert.equal(unauth.status, 401);

  const list1 = await adminHandler(
    new Request('http://localhost/api/admin/shops', { headers: { 'x-admin-key': 'lumina-beauty-admin-2026' } })
  );
  assert.equal(list1.status, 200);

  const list2 = await adminHandler(
    new Request('http://localhost/api/admin/shops', { headers: { 'x-admin-key': 'kutz-superadmin-2026' } })
  );
  assert.equal(list2.status, 200);

  // Provision new salon
  const created = await adminHandler(
    new Request('http://localhost/api/admin/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lumina-beauty-admin-2026' },
      body: JSON.stringify({
        slug: 'atelier-marfil',
        name: 'Atelier Marfil Estética',
        vertical: 'peluqueria',
        pin: '4545',
        phone: '611222333',
      }),
    })
  );
  assert.equal(created.status, 201);

  // Pause salon and confirm booking portal returns 403 paused
  const paused = await adminHandler(
    new Request('http://localhost/api/admin/shops/atelier-marfil/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lumina-beauty-admin-2026' },
      body: JSON.stringify({ status: 'paused' }),
    }),
    { params: { shopSlug: 'atelier-marfil' } }
  );
  assert.equal(paused.status, 200);

  const pubPaused = await bookingHandler(
    new Request('http://localhost/api/shops/atelier-marfil/public-state'),
    { params: { shopSlug: 'atelier-marfil' } }
  );
  assert.equal(pubPaused.status, 403);
  const pubPausedData = await pubPaused.json();
  assert.equal(pubPausedData.paused, true);
});

console.log(`\n---------------------------------------------------------------------`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`---------------------------------------------------------------------\n`);

if (failed > 0) process.exit(1);
