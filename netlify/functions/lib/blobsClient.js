import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const memoryStore = new Map();

export const STORE_NAME = 'lumina_beauty_platform';
export const DEFAULT_SHOP_SLUG = 'campodonico-nails';

export const SHOP_CAMPODONICO_NAILS_CONFIG = {
  slug: 'campodonico-nails',
  name: 'CM Salón D’ Campodónico · Nails & Beauty',
  subtitle: 'Uñas Acrílicas, Manicura, Pedicura & Cabina Facial',
  vertical: 'nails',
  theme: 'quiet-luxury',
  pin: '2023',
  timezone: 'Atlantic/Canary',
  status: 'active',
  walkInOpen: true,
  address: 'Av. Alcalde Ginés de la Hoz, 2, 35500 Arrecife, Lanzarote',
  phone: '638 877 945',
  description:
    'Atelier especializado en uñas acrílicas Talla S y M/L, rellenos, manicura semipermanente con refuerzo, pedicura completa Spa e higiene facial profunda en Arrecife.',
  instagramSalon: 'cm.salondcampodonico',
  googleReviewUrl:
    "https://www.google.com/maps/search/?api=1&query=CM+Sal%C3%B3n+D%27+Campod%C3%B3nico+Av.+Alcalde+Gin%C3%A9s+de+la+Hoz+2+Arrecife",
  logo: '/favicon.svg',
  configVersion: 1,
  barbers: [
    {
      id: 'nails-master',
      name: 'Camila (Uñas & Nail Art)',
      chair: 'MESA NAILS 1',
      role: 'Directora Nail Artist · Acrílico & Refuerzo',
      specialty: 'Acrílicas Talla S/M/L, Rellenos & Baby Boomer',
      available: true,
    },
    {
      id: 'spa-specialist',
      name: 'Nadia (Manicura, Pedicura & Facial)',
      chair: 'CABINA SPA 2',
      role: 'Especialista Spa & Estética Facial',
      specialty: 'Pedicura Spa, Semipermanente & Higiene Facial',
      available: true,
    },
  ],
  services: [
    { id: 'cn1', name: 'Uñas acrílicas Talla S', durationMinutes: 90, price: 45, priceLabel: '45€', category: 'acrilico', description: 'Esculpido acrílico talla corta con forma a elegir y esmaltado impecable' },
    { id: 'cn2', name: 'Uñas acrílicas Talla M/L', durationMinutes: 105, price: 50, priceLabel: '50€', category: 'acrilico', description: 'Esculpido acrílico talla media/larga: Almendra, Coffin o Stiletto' },
    { id: 'cn3', name: 'Relleno acrílico', durationMinutes: 75, price: 35, priceLabel: '35€', category: 'acrilico', description: 'Mantenimiento completo recomendado cada 18–21 días con refuerzo' },
    { id: 'cn4', name: 'Manicura semipermanente con refuerzo', durationMinutes: 60, price: 25, priceLabel: '25€', category: 'manicura', description: 'Limpieza de cutícula rusa, nivelación con base rubber y color' },
    { id: 'cn5', name: 'Manicura / Limpieza tradicional', durationMinutes: 45, price: 20, priceLabel: '20€', category: 'manicura', description: 'Limado, cutícula, hidratación con aceite de seda y brillo' },
    { id: 'cn6', name: 'Pedicura completa & Spa', durationMinutes: 60, price: 30, priceLabel: '30€', category: 'pedicura', description: 'Exfoliación botánica, durezas, masaje relajante y esmaltado' },
    { id: 'cn7', name: 'Retiro semipermanente', durationMinutes: 15, price: 5, priceLabel: '5€', category: 'retiro', description: 'Retirado cuidadoso protegiendo la lámina natural' },
    { id: 'cn8', name: 'Retiro tradicional', durationMinutes: 15, price: 3, priceLabel: '3€', category: 'retiro', description: 'Retirado suave con aceites nutritivos' },
    { id: 'cn9', name: 'Reparación uña caída', durationMinutes: 15, price: 3, priceLabel: '3€', category: 'retiro', description: 'Reconstrucción rápida de uña acrílica o semipermanente' },
    { id: 'cn10', name: 'Higiene facial profunda', durationMinutes: 60, price: 35, priceLabel: '35€', category: 'facial', description: 'Limpieza profunda en cabina con extracción suave y velo calmante' },
  ],
  schedule: {
    startHour: 9,
    endHour: 20,
    openTime: '09:30',
    closeTime: '19:30',
    slotMinutes: 30,
    slotIntervalMinutes: 30,
    workDays: [1, 2, 3, 4, 5, 6],
    daysOpen: [1, 2, 3, 4, 5, 6],
    hoursByDay: {
      1: { openTime: '09:30', closeTime: '19:30' },
      2: { openTime: '09:30', closeTime: '19:30' },
      3: { openTime: '09:30', closeTime: '19:30' },
      4: { openTime: '09:30', closeTime: '19:30' },
      5: { openTime: '09:30', closeTime: '20:00' },
      6: { openTime: '09:30', closeTime: '15:00' },
    },
  },
  createdAt: 1763500000000,
  updatedAt: 1763500000000,
};

export const SHOP_PELUQUERIA_ESTETICA_CONFIG = {
  slug: 'peluqueria-estetica',
  name: 'Lumina Atelier · Peluquería & Estética',
  subtitle: 'Colorimetría Orgánica, Estilismo & Cabina Facial',
  vertical: 'peluqueria',
  theme: 'quiet-luxury',
  pin: '1234',
  timezone: 'Atlantic/Canary',
  status: 'active',
  walkInOpen: true,
  address: 'Calle León y Castillo 18, 35500 Arrecife, Lanzarote',
  phone: '638 877 945',
  description:
    'Salón de Peluquería Femenina y Centro de Estética Avanzada. Especialistas en colorimetría orgánica, balayage, botox capilar, cabina facial, masaje corporal y diseño de mirada.',
  instagramSalon: 'lumina.atelier.beauty',
  googleReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Lumina+Atelier+Peluqueria+Estetica',
  logo: '/favicon.svg',
  configVersion: 1,
  barbers: [
    {
      id: 'estilista-color',
      name: 'Elena (Colorimetría & Balayage)',
      chair: 'TOCADOR 1',
      role: 'Directora de Color · Mechas & Matices',
      specialty: 'Balayage, Babylights & Tinte Orgánico',
      available: true,
    },
    {
      id: 'estilista-corte',
      name: 'Sofía (Corte, Brushing & Keratina)',
      chair: 'TOCADOR 2',
      role: 'Estilista Capilar · Visagismo & Seda',
      specialty: 'Corte, Brushing & Botox Capilar',
      available: true,
    },
    {
      id: 'cabina-facial',
      name: 'Valeria (Cabina Facial & Mirada)',
      chair: 'CABINA 3',
      role: 'Especialista Estética Facial & Corporal',
      specialty: 'Ultrasonidos, Radiofrecuencia, Masaje & Cejas',
      available: true,
    },
  ],
  services: [
    { id: 'pe1', name: 'Corte y Peinado / Brushing', durationMinutes: 60, price: 32, priceLabel: '32€', category: 'peluqueria', description: 'Diagnóstico de visagismo, lavado ritual, corte y brushing con movimiento' },
    { id: 'pe2', name: 'Color / Tinte de Raíz Orgánico', durationMinutes: 75, price: 38, priceLabel: '38€', category: 'peluqueria', description: 'Coloración orgánica sin amoníaco con aceites botánicos protectores' },
    { id: 'pe3', name: 'Mechas Balayage / Babylights + Matiz', durationMinutes: 120, price: 85, priceLabel: '85€', category: 'peluqueria', description: 'Iluminación a mano alzada, matiz personalizado y sellado de brillo' },
    { id: 'pe4', name: 'Hidratación / Keratina / Botox Capilar', durationMinutes: 75, price: 55, priceLabel: '55€', category: 'peluqueria', description: 'Reconstrucción profunda de fibra capilar con efecto seda anti-frizz' },
    { id: 'pe5', name: 'Higiene Facial Profunda + Ultrasonidos', durationMinutes: 60, price: 45, priceLabel: '45€', category: 'facial', description: 'Limpieza con espátula ultrasónica, activos calmantes y mascarilla' },
    { id: 'pe6', name: 'Radiofrecuencia Facial', durationMinutes: 60, price: 50, priceLabel: '50€', category: 'facial', description: 'Efecto lifting no invasivo y estimulación natural de colágeno' },
    { id: 'pe7', name: 'Peeling Luminosidad & Vitaminas', durationMinutes: 45, price: 48, priceLabel: '48€', category: 'facial', description: 'Renovación suave con Vitamina C pura y ácido hialurónico' },
    { id: 'pe8', name: 'Masaje Relajante / Drenaje Corporal', durationMinutes: 60, price: 40, priceLabel: '40€', category: 'corporal', description: 'Sesión corporal drenante y descontracturante con aceites tibios' },
    { id: 'pe9', name: 'Diseño de Cejas & Lifting de Pestañas', durationMinutes: 45, price: 30, priceLabel: '30€', category: 'mirada', description: 'Arquitectura de cejas con pinza/hilo y curvatura natural de pestañas' },
  ],
  schedule: {
    startHour: 9,
    endHour: 20,
    openTime: '09:30',
    closeTime: '19:30',
    slotMinutes: 30,
    slotIntervalMinutes: 30,
    workDays: [1, 2, 3, 4, 5, 6],
    daysOpen: [1, 2, 3, 4, 5, 6],
    hoursByDay: {
      1: { openTime: '09:30', closeTime: '19:30' },
      2: { openTime: '09:30', closeTime: '19:30' },
      3: { openTime: '09:30', closeTime: '19:30' },
      4: { openTime: '09:30', closeTime: '19:30' },
      5: { openTime: '09:30', closeTime: '20:00' },
      6: { openTime: '09:30', closeTime: '15:00' },
    },
  },
  createdAt: 1763500000000,
  updatedAt: 1763500000000,
};

export function isBlobsConfigured() {
  if (typeof process === 'undefined' || !process.env) return false;
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_TOKEN) ||
      (process.env.NETLIFY && process.env.NETLIFY_SITE_ID)
  );
}

const shopLocks = new Map();

export function resetShopLocks() {
  shopLocks.clear();
}

export function resetMemoryStore() {
  memoryStore.clear();
  resetShopLocks();
}

export async function withShopLock(shopSlug, fn) {
  const prev = shopLocks.get(shopSlug) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chained = prev.then(() => current);
  shopLocks.set(shopSlug, chained);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (shopLocks.get(shopSlug) === chained) {
      shopLocks.delete(shopSlug);
    }
  }
}

export function getBeautyStore() {
  let realStore = null;
  if (isBlobsConfigured()) {
    try {
      realStore = getStore({
        name: STORE_NAME,
        consistency: 'strong',
      });
    } catch (err) {
      console.warn('[BlobsClient] Netlify Blobs init fallback to memory:', err?.message);
    }
  }

  const memAdapter = {
    async get(key, options = {}) {
      const val = memoryStore.get(key);
      if (val === undefined || val === null) return null;
      if (options.type === 'json') {
        try {
          return typeof val === 'string' ? JSON.parse(val) : val;
        } catch {
          return null;
        }
      }
      return val;
    },
    async getJSON(key) {
      const val = memoryStore.get(key);
      if (val === undefined || val === null) return null;
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      memoryStore.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    async setJSON(key, value) {
      memoryStore.set(key, JSON.stringify(value));
    },
    async delete(key) {
      memoryStore.delete(key);
    },
    async list(options = {}) {
      const prefix = options.prefix || '';
      const blobs = [];
      for (const [k] of memoryStore.entries()) {
        if (k.startsWith(prefix)) blobs.push({ key: k });
      }
      return { blobs };
    },
  };

  if (!realStore) return memAdapter;

  return {
    async get(key, options = {}) {
      try {
        return await realStore.get(key, options);
      } catch {
        return memAdapter.get(key, options);
      }
    },
    async getJSON(key) {
      try {
        if (typeof realStore.getJSON === 'function') {
          return await realStore.getJSON(key);
        }
        return await realStore.get(key, { type: 'json' });
      } catch {
        return memAdapter.getJSON(key);
      }
    },
    async set(key, value) {
      await memAdapter.set(key, value);
      try {
        await realStore.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch {
        // fallback already saved
      }
    },
    async setJSON(key, value) {
      await memAdapter.setJSON(key, value);
      try {
        if (typeof realStore.setJSON === 'function') {
          await realStore.setJSON(key, value);
        } else {
          await realStore.set(key, JSON.stringify(value));
        }
      } catch {
        // fallback already saved
      }
    },
    async delete(key) {
      await memAdapter.delete(key);
      try {
        await realStore.delete(key);
      } catch {
        // ignore
      }
    },
    async list(options = {}) {
      try {
        return await realStore.list(options);
      } catch {
        return memAdapter.list(options);
      }
    },
  };
}

export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export async function getShopConfig(shopSlug) {
  const store = getBeautyStore();
  const key = `shops/${shopSlug}/config`;
  let config = await store.getJSON(key);
  if (!config && (shopSlug === 'campodonico-nails' || shopSlug === 'default')) {
    config = { ...SHOP_CAMPODONICO_NAILS_CONFIG, slug: shopSlug === 'default' ? 'campodonico-nails' : shopSlug };
    await store.setJSON(key, config);
  } else if (!config && shopSlug === 'peluqueria-estetica') {
    config = { ...SHOP_PELUQUERIA_ESTETICA_CONFIG, slug: 'peluqueria-estetica' };
    await store.setJSON(key, config);
  }
  return config;
}

export async function setShopConfig(shopSlug, config) {
  const store = getBeautyStore();
  await store.setJSON(`shops/${shopSlug}/config`, { ...config, slug: shopSlug, updatedAt: Date.now() });
}

export async function getShopsIndex() {
  const store = getBeautyStore();
  let index = await store.getJSON('platform/shops_index');
  if (!index || !Array.isArray(index.shops)) {
    index = {
      shops: [
        {
          slug: SHOP_CAMPODONICO_NAILS_CONFIG.slug,
          name: SHOP_CAMPODONICO_NAILS_CONFIG.name,
          vertical: 'nails',
          status: 'active',
          pin: SHOP_CAMPODONICO_NAILS_CONFIG.pin,
          phone: SHOP_CAMPODONICO_NAILS_CONFIG.phone,
          address: SHOP_CAMPODONICO_NAILS_CONFIG.address,
          barberCount: SHOP_CAMPODONICO_NAILS_CONFIG.barbers.length,
          servicesCount: SHOP_CAMPODONICO_NAILS_CONFIG.services.length,
          createdAt: SHOP_CAMPODONICO_NAILS_CONFIG.createdAt,
        },
        {
          slug: SHOP_PELUQUERIA_ESTETICA_CONFIG.slug,
          name: SHOP_PELUQUERIA_ESTETICA_CONFIG.name,
          vertical: 'peluqueria',
          status: 'active',
          pin: SHOP_PELUQUERIA_ESTETICA_CONFIG.pin,
          phone: SHOP_PELUQUERIA_ESTETICA_CONFIG.phone,
          address: SHOP_PELUQUERIA_ESTETICA_CONFIG.address,
          barberCount: SHOP_PELUQUERIA_ESTETICA_CONFIG.barbers.length,
          servicesCount: SHOP_PELUQUERIA_ESTETICA_CONFIG.services.length,
          createdAt: SHOP_PELUQUERIA_ESTETICA_CONFIG.createdAt,
        },
      ],
    };
    await store.setJSON('platform/shops_index', index);
  }
  return index;
}

export async function setShopsIndex(index) {
  const store = getBeautyStore();
  await store.setJSON('platform/shops_index', index);
}

export async function getShopAppointments(shopSlug) {
  const store = getBeautyStore();
  const data = await store.getJSON(`shops/${shopSlug}/appointments`);
  return Array.isArray(data) ? data : [];
}

export async function setShopAppointments(shopSlug, appointments) {
  const store = getBeautyStore();
  await store.setJSON(`shops/${shopSlug}/appointments`, Array.isArray(appointments) ? appointments : []);
}

export async function getShopQueue(shopSlug) {
  const store = getBeautyStore();
  const data = await store.getJSON(`shops/${shopSlug}/queue`);
  return Array.isArray(data) ? data : [];
}

export async function setShopQueue(shopSlug, queue) {
  const store = getBeautyStore();
  await store.setJSON(`shops/${shopSlug}/queue`, Array.isArray(queue) ? queue : []);
}

export async function getShopClients(shopSlug) {
  const store = getBeautyStore();
  const data = await store.getJSON(`shops/${shopSlug}/clients`);
  return Array.isArray(data) ? data : [];
}

export async function setShopClients(shopSlug, clients) {
  const store = getBeautyStore();
  await store.setJSON(`shops/${shopSlug}/clients`, Array.isArray(clients) ? clients : []);
}

export function hashClientIp(request) {
  let rawIp = 'unknown';
  try {
    if (request?.headers && typeof request.headers.get === 'function') {
      const nfIp = request.headers.get('x-nf-client-connection-ip');
      const xff = request.headers.get('x-forwarded-for');
      const clientIp = request.headers.get('client-ip');
      rawIp = (nfIp || (xff ? xff.split(',')[0] : '') || clientIp || 'unknown').trim();
    }
  } catch {
    rawIp = 'unknown';
  }
  return crypto.createHash('sha256').update(String(rawIp || 'unknown')).digest('hex').slice(0, 16);
}

export async function getRateLimitState(shopSlug, ipHash) {
  const store = getBeautyStore();
  return await store.getJSON(`ratelimit_${shopSlug}_${ipHash}`);
}

export async function setRateLimitState(shopSlug, ipHash, state) {
  const store = getBeautyStore();
  await store.setJSON(`ratelimit_${shopSlug}_${ipHash}`, state);
}

export async function clearRateLimitState(shopSlug, ipHash) {
  const store = getBeautyStore();
  await store.delete(`ratelimit_${shopSlug}_${ipHash}`);
}

export async function getAuditLog(shopSlug) {
  const store = getBeautyStore();
  const entries = await store.getJSON(`audit_${shopSlug}`);
  return Array.isArray(entries) ? entries : [];
}

export async function appendAuditLog(shopSlug, action, detail = {}) {
  const store = getBeautyStore();
  const key = `audit_${shopSlug}`;
  const existing = await store.getJSON(key);
  const list = Array.isArray(existing) ? existing : [];
  const safeDetail = detail && typeof detail === 'object' ? { ...detail } : { info: String(detail || '') };
  delete safeDetail.pin;
  delete safeDetail.providedPin;
  delete safeDetail.password;
  const entry = {
    ts: new Date().toISOString(),
    action: String(action || 'unknown'),
    detail: safeDetail,
  };
  const next = [...list, entry].slice(-100);
  await store.setJSON(key, next);
  return entry;
}

export async function getShopSales(shopSlug) {
  const store = getBeautyStore();
  const data = await store.getJSON(`shops/${shopSlug}/sales`);
  return Array.isArray(data) ? data : [];
}

export async function setShopSales(shopSlug, sales) {
  const store = getBeautyStore();
  await store.setJSON(`shops/${shopSlug}/sales`, Array.isArray(sales) ? sales.slice(0, 500) : []);
}
