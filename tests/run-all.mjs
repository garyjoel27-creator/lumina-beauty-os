#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bookingHandler from '../netlify/functions/booking.js';
import syncHandler from '../netlify/functions/sync.js';
import adminHandler from '../netlify/functions/admin.js';
import {
  resetMemoryStore,
  getShopConfig,
  getAuditLog,
  hashClientIp,
  setRateLimitState,
} from '../netlify/functions/lib/blobsClient.js';
import {
  BEAUTY_THEMES,
  normalizeBeautyThemeId,
  SHOP_CAMPODONICO_NAILS_CONFIG,
  SHOP_PELUQUERIA_ESTETICA_CONFIG,
  formatWhatsAppPhone,
  buildWhatsAppUrl,
  buildCustomerPortalUrl,
  buildAppointmentIcsContent,
  buildSalonVCardContent,
  buildWhatsAppAutoReplyTemplate,
  loadSavedPublicClientProfile,
  savePublicClientProfile,
  clearPublicClientProfile,
  getShopVertical,
  isPublicBookingPath,
  resolveTenantSlug,
  NAIL_SHAPES,
  NAIL_POLISH_COLORS,
} from '../src/lib/shopUtils.js';
import {
  mergeSyncedAppointments,
  mergeSyncedClients,
  mergeSyncedSales,
  SyncEngine,
  enqueueOutboxAction,
  getOutbox,
  replayOutbox,
} from '../src/lib/syncService.js';

const VALID_RGPD_CONSENT = {
  acceptedPrivacy: true,
  acceptedWhatsapp: false,
  policyVersion: '2026.1',
};

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
        rgpdConsent: VALID_RGPD_CONSENT,
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
        rgpdConsent: VALID_RGPD_CONSENT,
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
        rgpdConsent: VALID_RGPD_CONSENT,
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

  // Query-param fallback routing (as used by Netlify redirects) + PIN 4-digit validation
  const badPinRes = await adminHandler(
    new Request('http://localhost/.netlify/functions/admin?shopSlug=atelier-marfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lumina-beauty-admin-2026' },
      body: JSON.stringify({ pin: '12' }),
    })
  );
  assert.equal(badPinRes.status, 422);

  const reactivateViaQuery = await adminHandler(
    new Request('http://localhost/.netlify/functions/admin?shopSlug=atelier-marfil&action=status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'lumina-beauty-admin-2026' },
      body: JSON.stringify({ status: 'active' }),
    })
  );
  assert.equal(reactivateViaQuery.status, 200);
});

await test('9. Multi-specialist "any" booking assigns free specialist & allows concurrent 2nd booking (not false 409)', async () => {
  resetMemoryStore();
  // campodonico-nails has 2 specialists: nails-master (Camila) & spa-specialist (Nadia)
  const b1 = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Clienta Uno',
        clientPhone: '611111111',
        barberId: 'any',
        serviceId: 'cn4', // 60m
        date: '2026-11-23',
        timeSlot: '10:00',
        rgpdConsent: VALID_RGPD_CONSENT,
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(b1.status, 201);
  const d1 = await b1.json();
  assert.equal(d1.appointment.barberId, 'nails-master', 'First "any" booking must assign concrete specialist id');

  // Second concurrent booking at 10:00 with "any" must succeed on 2nd specialist (spa-specialist)
  const b2 = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Clienta Dos',
        clientPhone: '622222222',
        barberId: 'any',
        serviceId: 'cn6', // 60m
        date: '2026-11-23',
        timeSlot: '10:00',
        rgpdConsent: VALID_RGPD_CONSENT,
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(b2.status, 201);
  const d2 = await b2.json();
  assert.equal(d2.appointment.barberId, 'spa-specialist', 'Second "any" booking must assign 2nd free specialist');

  // Third concurrent booking at 10:00 must fail 409 (both specialists busy)
  const b3 = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Clienta Tres',
        clientPhone: '633333333',
        barberId: 'any',
        serviceId: 'cn4',
        date: '2026-11-23',
        timeSlot: '10:00',
        rgpdConsent: VALID_RGPD_CONSENT,
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(b3.status, 409);
});

await test('10. walkInOpen=false persists via sync & blocks walkin bookings with 403', async () => {
  resetMemoryStore();
  const toggleRes = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({ action: 'update_shop_schedule', payload: { walkInOpen: false } }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(toggleRes.status, 200);

  const walkinRes = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'walkin',
        clientName: 'Elena',
        clientPhone: '611222333',
        rgpdConsent: VALID_RGPD_CONSENT,
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(walkinRes.status, 403);
  const walkinData = await walkinRes.json();
  assert.equal(walkinData.error, 'walkin_closed');
});

await test('11. Sync merge preserves local demo agenda & VIP clients when server returns empty/partial arrays', () => {
  const localApts = [
    { id: 'demo-1', clientName: 'Valeria', isDemo: true },
    { id: 'demo-2', clientName: 'Deleted', isDemo: true },
  ];
  const remoteApts = [{ id: 'qr-live-1', clientName: 'Nueva QR', status: 'pending' }];
  const mergedApts = mergeSyncedAppointments(remoteApts, localApts, ['demo-2'], []);
  assert.equal(mergedApts.length, 2);
  assert.ok(mergedApts.some((a) => a.id === 'qr-live-1'));
  assert.ok(mergedApts.some((a) => a.id === 'demo-1'));
  assert.ok(!mergedApts.some((a) => a.id === 'demo-2'));

  const localClients = [
    { id: 'n-1', name: 'Valeria' },
    { id: 'n-2', name: 'Lucía' },
  ];
  const remoteClients = [{ id: 'c-qr-1', name: 'Clienta QR' }];
  const mergedClients = mergeSyncedClients(remoteClients, localClients, []);
  assert.equal(mergedClients.length, 3);
});

await test('12. RGPD Booking Consent Gate: missing/false consent returns 422 & valid booking stores rgpdConsent', async () => {
  resetMemoryStore();
  // Missing rgpdConsent -> 422
  const noConsent = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Sin Permiso',
        clientPhone: '611111222',
        serviceId: 'cn4',
        date: '2026-11-23',
        timeSlot: '10:00',
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(noConsent.status, 422);
  const noConsentData = await noConsent.json();
  assert.equal(noConsentData.error, 'rgpd_consent_required');

  // acceptedPrivacy: false on walkin -> 422
  const falseConsent = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'walkin',
        clientName: 'Rechaza Privacidad',
        clientPhone: '611111333',
        rgpdConsent: { acceptedPrivacy: false, acceptedWhatsapp: true },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(falseConsent.status, 422);

  // Valid consent stores rgpdConsent on saved appointment
  const okBooking = await bookingHandler(
    new Request('http://localhost/api/shops/campodonico-nails/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'appointment',
        clientName: 'Valeria Consent',
        clientPhone: '638877945',
        serviceId: 'cn4',
        date: '2026-11-23',
        timeSlot: '10:00',
        rgpdConsent: { acceptedPrivacy: true, acceptedWhatsapp: true, policyVersion: '2026.1' },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(okBooking.status, 201);
  const okData = await okBooking.json();
  assert.equal(okData.appointment.rgpdConsent.acceptedPrivacy, true);
  assert.equal(okData.appointment.rgpdConsent.acceptedWhatsapp, true);
  assert.equal(okData.appointment.rgpdConsent.policyVersion, '2026.1');
});

await test('13. Anti Brute-Force PIN Rate Limiting (5 fails -> 429 + Retry-After 900s, valid PIN resets counter)', async () => {
  resetMemoryStore();
  // First 2 failures from IP A, then valid PIN resets counter
  for (let i = 0; i < 2; i++) {
    const r = await syncHandler(
      new Request('http://localhost/api/shops/campodonico-nails/sync', {
        headers: { 'x-shop-pin': '9999', 'x-forwarded-for': '198.51.100.10' },
      }),
      { params: { shopSlug: 'campodonico-nails' } }
    );
    assert.equal(r.status, 401);
  }
  const okReset = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '2023', 'x-forwarded-for': '198.51.100.10' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(okReset.status, 200);

  // Now 4 failed attempts from IP B -> 401; 5th -> 429 lockout
  for (let i = 1; i <= 4; i++) {
    const r = await syncHandler(
      new Request('http://localhost/api/shops/campodonico-nails/sync', {
        headers: { 'x-shop-pin': '0000', 'x-forwarded-for': '203.0.113.55' },
      }),
      { params: { shopSlug: 'campodonico-nails' } }
    );
    assert.equal(r.status, 401, `Attempt ${i} should return 401`);
  }
  const fifth = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '0000', 'x-forwarded-for': '203.0.113.55' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(fifth.status, 429);
  assert.equal(fifth.headers.get('Retry-After'), '900');
  const fifthBody = await fifth.json();
  assert.equal(fifthBody.error, 'too_many_attempts');
  assert.ok(fifthBody.retryAfterSeconds >= 890);

  // Even a valid PIN from the locked IP stays blocked with 429 during the 15-min window
  const blockedValid = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '2023', 'x-forwarded-for': '203.0.113.55' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(blockedValid.status, 429);

  // Audit log recorded pin_lockout with zero plaintext PINs
  const audit = await getAuditLog('campodonico-nails');
  const lockoutEvent = audit.find((e) => e.action === 'pin_lockout');
  assert.ok(lockoutEvent, 'Expected pin_lockout in audit log');
  assert.ok(!JSON.stringify(audit).includes('2023'), 'Plaintext PIN must NEVER appear in audit log');

  // Regression: after 15-min lockout expires (blockedUntil <= now), 1 wrong PIN returns 401 with 4 remaining attempts (NOT immediate 429 re-lockout)
  const postExpiryReq = new Request('http://localhost/api/shops/campodonico-nails/sync', {
    headers: { 'x-shop-pin': '0000', 'x-forwarded-for': '203.0.113.55' },
  });
  const ipHash = hashClientIp(postExpiryReq);
  await setRateLimitState('campodonico-nails', ipHash, {
    attempts: 5,
    blockedUntil: Date.now() - 1000,
    updatedAt: Date.now() - 901000,
  });
  const postExpiryRes = await syncHandler(postExpiryReq, { params: { shopSlug: 'campodonico-nails' } });
  assert.equal(postExpiryRes.status, 401);
  const postExpiryData = await postExpiryRes.json();
  assert.equal(postExpiryData.remainingAttempts, 4);
});

await test('13b. SyncEngine prompts auth on empty PIN without hammering /sync & replayOutbox preserves items on 429', async () => {
  const map = new Map();
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };

  let calls = 0;
  const eng = new SyncEngine({
    shopSlug: 'campodonico-nails',
    pin: '',
    storage,
    fetch: async () => {
      calls++;
      return { ok: false, status: 401 };
    },
  });
  let authRequired = false;
  eng.on('auth', (v) => { authRequired = v; });
  await eng.forceSync();
  assert.equal(calls, 0);
  assert.equal(authRequired, true);
  assert.equal(eng.authPaused, true);
  eng.destroy();

  enqueueOutboxAction('campodonico-nails', 'record_sale', { sale: { id: 's1' } }, storage);
  enqueueOutboxAction('campodonico-nails', 'record_sale', { sale: { id: 's2' } }, storage);
  let replayCalls = 0;
  const replay = await replayOutbox('campodonico-nails', '2023', {
    storage,
    fetch: async () => {
      replayCalls++;
      return { ok: false, status: 429 };
    },
  });
  assert.equal(replayCalls, 1);
  assert.equal(replay.remaining, 2);
  assert.equal(replay.dropped, 0);
  assert.equal(getOutbox('campodonico-nails', storage).length, 2);
});

await test('14. RGPD Audit Log & Cloud Sync for Internal Cash (dailySales + record_sale + mergeSyncedSales)', async () => {
  resetMemoryStore();
  // Upsert client, delete client, update schedule, record sale
  await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({
        action: 'upsert_client',
        payload: { client: { id: 'c-rgpd-1', name: 'María RGPD', consent: { signed: true } } },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({ action: 'delete_client', payload: { clientId: 'c-rgpd-1' } }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  const saleRes = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-shop-pin': '2023' },
      body: JSON.stringify({
        action: 'record_sale',
        payload: { sale: { id: 'sale-cloud-1', clientName: 'Valeria', amount: 45, method: 'tarjeta', timestamp: 1763500001000 } },
      }),
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  assert.equal(saleRes.status, 200);

  const getRes = await syncHandler(
    new Request('http://localhost/api/shops/campodonico-nails/sync', {
      headers: { 'x-shop-pin': '2023' },
    }),
    { params: { shopSlug: 'campodonico-nails' } }
  );
  const getData = await getRes.json();
  assert.ok(Array.isArray(getData.dailySales));
  assert.equal(getData.dailySales.length, 1);
  assert.equal(getData.dailySales[0].id, 'sale-cloud-1');

  const mergedSales = mergeSyncedSales(getData.dailySales, [
    { id: 'sale-local-1', amount: 30, timestamp: 1763500002000 },
  ]);
  assert.equal(mergedSales.length, 2);
  assert.equal(mergedSales[0].id, 'sale-local-1');

  const audit = await getAuditLog('campodonico-nails');
  assert.ok(audit.some((e) => e.action === 'upsert_client'));
  assert.ok(audit.some((e) => e.action === 'delete_client'));
});

await test('15. Block 1 UI Legal & Security Compliance Audit (RGPD, ARSOPOL, VeriFactu, Clean URLs, Legal Hub)', () => {
  const pubBooking = fs.readFileSync(path.join(rootDir, 'src/pages/PublicBookingView.jsx'), 'utf8');
  const rgpdModal = fs.readFileSync(path.join(rootDir, 'src/components/RGPDConsentModal.jsx'), 'utf8');
  const profile = fs.readFileSync(path.join(rootDir, 'src/pages/ClientProfile.jsx'), 'utf8');
  const dashboard = fs.readFileSync(path.join(rootDir, 'src/pages/Dashboard.jsx'), 'utf8');
  const legalModal = fs.readFileSync(path.join(rootDir, 'src/components/LegalComplianceModal.jsx'), 'utf8');
  const superAdmin = fs.readFileSync(path.join(rootDir, 'src/pages/SuperAdminView.jsx'), 'utf8');
  const sigPad = fs.readFileSync(path.join(rootDir, 'src/components/SignaturePad.jsx'), 'utf8');
  const shopCtx = fs.readFileSync(path.join(rootDir, 'src/context/ShopContext.jsx'), 'utf8');

  assert.ok(pubBooking.includes('Art. 13 RGPD'));
  assert.ok(pubBooking.includes('useState(false)'));
  assert.ok(pubBooking.includes('publicOnly={true}'));
  assert.ok(rgpdModal.includes('healthAndFile: false'));
  assert.ok(rgpdModal.includes('internalPhotos: false'));
  assert.ok(rgpdModal.includes('photosMarketing: false'));
  assert.ok(rgpdModal.includes('whatsappReminders: false'));
  assert.ok(sigPad.includes('lastEmittedRef'));
  assert.ok(shopCtx.includes("params.delete('pin')"));
  assert.ok(profile.includes('Privacidad &amp; Derechos ARSOPOL'));
  assert.ok(profile.includes('-datos-rgpd.json'));
  assert.ok(profile.includes('Revocar permisos opcionales'));
  assert.ok(profile.includes('Derecho de Supresión'));
  assert.ok(dashboard.includes('No válido como ticket fiscal ni factura (VeriFactu)'));
  assert.ok(legalModal.includes('DPA-Art28-'));
  assert.ok(!superAdmin.includes('&pin='), 'SuperAdminView must NEVER put &pin= into panel URLs');
});

await test('16. Repeat Booking Without QR: ICS Calendar Export, Local Client Recall & WhatsApp Rebooking Links', () => {
  const portalUrl = buildCustomerPortalUrl('https://lumina-beauty-gary.netlify.app', 'campodonico-nails');
  assert.equal(portalUrl, 'https://lumina-beauty-gary.netlify.app/r/campodonico-nails');

  const ics = buildAppointmentIcsContent({
    title: 'Relleno acrílico · CM Salón D’ Campodónico',
    description: 'Especialista: Camila',
    location: 'Arrecife, Lanzarote',
    date: '2026-12-15',
    timeSlot: '11:30',
    durationMinutes: 90,
    bookingUrl: portalUrl,
  });
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART:20261215T113000'));
  assert.ok(ics.includes('DTEND:20261215T130000'));
  assert.ok(ics.includes(`URL:${portalUrl}`));
  assert.ok(ics.includes('END:VCALENDAR'));

  const mem = new Map();
  const mockStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  savePublicClientProfile('campodonico-nails', { clientName: 'Lucía Martín', clientPhone: '638877945' }, mockStorage);
  const loaded = loadSavedPublicClientProfile('campodonico-nails', mockStorage);
  assert.equal(loaded.clientName, 'Lucía Martín');
  assert.equal(loaded.clientPhone, '638877945');
  clearPublicClientProfile('campodonico-nails', mockStorage);
  assert.equal(loadSavedPublicClientProfile('campodonico-nails', mockStorage), null);

  const pubBooking = fs.readFileSync(path.join(rootDir, 'src/pages/PublicBookingView.jsx'), 'utf8');
  const clientCtx = fs.readFileSync(path.join(rootDir, 'src/context/ClientContext.jsx'), 'utf8');
  const dashboard = fs.readFileSync(path.join(rootDir, 'src/pages/Dashboard.jsx'), 'utf8');
  assert.ok(pubBooking.includes('repeat-booking-kit'));
  assert.ok(pubBooking.includes('download-ics-btn'));
  assert.ok(pubBooking.includes('download-vcard-btn'));
  assert.ok(pubBooking.includes('booking-stepper'));
  assert.ok(pubBooking.includes('returning-client-banner'));
  assert.ok(clientCtx.includes('buildCustomerPortalUrl'));
  assert.ok(dashboard.includes('buildCustomerPortalUrl'));

  const vcard = buildSalonVCardContent({
    name: 'CM Salón D’ Campodónico',
    phone: '638 877 945',
    address: 'Arrecife, Lanzarote',
    bookingUrl: portalUrl,
  });
  assert.ok(vcard.includes('BEGIN:VCARD'));
  assert.ok(vcard.includes(`URL:${portalUrl}`));
  assert.ok(vcard.includes('END:VCARD'));

  const autoReply = buildWhatsAppAutoReplyTemplate('CM Salón', portalUrl);
  assert.ok(autoReply.includes(portalUrl));

  // Multi-Theme Engine verification
  assert.equal(BEAUTY_THEMES.length, 5);
  assert.equal(normalizeBeautyThemeId('botanical-sage'), 'botanical-sage');
  assert.equal(normalizeBeautyThemeId('obsidian-glam'), 'obsidian-glam');
  assert.equal(normalizeBeautyThemeId('unknown-theme'), 'silk-rose');
  const css = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
  assert.ok(css.includes('html[data-theme="obsidian-glam"]'));
  assert.ok(css.includes('html[data-theme="botanical-sage"]'));
});

console.log(`\n---------------------------------------------------------------------`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`---------------------------------------------------------------------\n`);

if (failed > 0) process.exit(1);
