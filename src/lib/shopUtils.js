/**
 * src/lib/shopUtils.js
 * Pure domain utilities, salon configs, nail/colorimetry catalogs,
 * tenant slug resolution, WhatsApp +34 formatting, and timezone helpers
 * for LUMINA // BEAUTY & SALON.
 */

export const DEFAULT_SHOP_SLUG = 'campodonico-nails';

export const NAIL_SHAPES = [
  { id: 'almendra', label: 'Almendra', short: 'Almendra', path: 'M12 2 C17 6 19 13 18 22 L6 22 C5 13 7 6 12 2 Z' },
  { id: 'coffin', label: 'Coffin / Bailarina', short: 'Coffin', path: 'M8 2 L16 2 L19 14 L18 22 L6 22 L5 14 Z' },
  { id: 'cuadrada', label: 'Cuadrada', short: 'Cuadrada', path: 'M6 3 L18 3 L18 22 L6 22 Z' },
  { id: 'stiletto', label: 'Stiletto', short: 'Stiletto', path: 'M12 1 L19 15 L18 22 L6 22 L5 15 Z' },
];

export const NAIL_POLISH_COLORS = [
  { id: 'milky-white', name: 'Milky White', swatch: '#F6F2EC', border: '#DFD4C8' },
  { id: 'cover-pink', name: 'Cover Pink', swatch: '#E8C4BE', border: '#D1A29B' },
  {
    id: 'baby-boomer',
    name: 'Baby Boomer',
    swatch: 'linear-gradient(180deg, #FFFDFB 0%, #F4E4DF 45%, #E4B5AE 100%)',
    border: '#D5A69F',
  },
  { id: 'rojo-burdeos', name: 'Rojo Burdeos', swatch: '#7A1F2B', border: '#5A131C' },
  {
    id: 'francesa',
    name: 'Francesa',
    swatch: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 28%, #F4D8D2 30%, #F0CFC8 100%)',
    border: '#D7B3AB',
  },
  {
    id: 'glazed-pearl',
    name: 'Glazed Pearl',
    swatch: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F7EDE7 55%, #E7D2C6 100%)',
    border: '#D5BEB1',
  },
];

export const COLORIMETRY_PRESETS = [
  {
    id: 'balayage-miel',
    label: 'Balayage Miel',
    formula: 'Base 7.1 + 8.3 · 20 vol · Matiz 9.21 + Olaplex Nº1',
    kind: 'color',
  },
  {
    id: 'raiz-organica',
    label: 'Raíz Orgánica',
    formula: 'Base 6.0 + 6.1 (1:1) · 20 vol · 35 min sin amoníaco',
    kind: 'color',
  },
  {
    id: 'botox-seda',
    label: 'Botox Capilar',
    formula: 'Keratina orgánica + Ácido Hialurónico · Plancha 190°C',
    kind: 'color',
  },
  {
    id: 'facial-vitc',
    label: 'Cabina Vit C',
    formula: 'Piel mixta sensible · Vitamina C + Ácido Hialurónico + Ultrasonidos',
    kind: 'cabin',
  },
  {
    id: 'radiofrecuencia',
    label: 'Lifting Radiofrec.',
    formula: 'Gel conductor colágeno · Radiofrecuencia 40°C · Velo calmante',
    kind: 'cabin',
  },
];

export const RETAIL_COSMETICS = {
  nails: [
    { id: 'cos-1', name: 'Aceite de Cutículas Seda', price: 12 },
    { id: 'cos-2', name: 'Crema de Manos Manteca Karité', price: 16 },
    { id: 'cos-3', name: 'Fortalecedor Queratina Natural', price: 18 },
    { id: 'cos-4', name: 'Exfoliante Botánico Spa', price: 22 },
  ],
  peluqueria: [
    { id: 'cos-p1', name: 'Champú Orgánico Sin Sulfatos', price: 24 },
    { id: 'cos-p2', name: 'Sérum Capilar Aceite de Argán', price: 28 },
    { id: 'cos-p3', name: 'Sérum Facial Vitamina C 15%', price: 36 },
    { id: 'cos-p4', name: 'Mascarilla Reparadora Seda', price: 26 },
  ],
};

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
    { id: 'cn1', name: 'Uñas acrílicas Talla S', durationMinutes: 90, price: 45, priceLabel: '45€', category: 'acrilico' },
    { id: 'cn2', name: 'Uñas acrílicas Talla M/L', durationMinutes: 105, price: 50, priceLabel: '50€', category: 'acrilico' },
    { id: 'cn3', name: 'Relleno acrílico', durationMinutes: 75, price: 35, priceLabel: '35€', category: 'acrilico' },
    { id: 'cn4', name: 'Manicura semipermanente con refuerzo', durationMinutes: 60, price: 25, priceLabel: '25€', category: 'manicura' },
    { id: 'cn5', name: 'Manicura / Limpieza tradicional', durationMinutes: 45, price: 20, priceLabel: '20€', category: 'manicura' },
    { id: 'cn6', name: 'Pedicura completa & Spa', durationMinutes: 60, price: 30, priceLabel: '30€', category: 'pedicura' },
    { id: 'cn7', name: 'Retiro semipermanente', durationMinutes: 15, price: 5, priceLabel: '5€', category: 'retiro' },
    { id: 'cn8', name: 'Retiro tradicional', durationMinutes: 15, price: 3, priceLabel: '3€', category: 'retiro' },
    { id: 'cn9', name: 'Reparación uña caída', durationMinutes: 15, price: 3, priceLabel: '3€', category: 'retiro' },
    { id: 'cn10', name: 'Higiene facial profunda', durationMinutes: 60, price: 35, priceLabel: '35€', category: 'facial' },
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
    { id: 'pe1', name: 'Corte y Peinado / Brushing', durationMinutes: 60, price: 32, priceLabel: '32€', category: 'peluqueria' },
    { id: 'pe2', name: 'Color / Tinte de Raíz Orgánico', durationMinutes: 75, price: 38, priceLabel: '38€', category: 'peluqueria' },
    { id: 'pe3', name: 'Mechas Balayage / Babylights + Matiz', durationMinutes: 120, price: 85, priceLabel: '85€', category: 'peluqueria' },
    { id: 'pe4', name: 'Hidratación / Keratina / Botox Capilar', durationMinutes: 75, price: 55, priceLabel: '55€', category: 'peluqueria' },
    { id: 'pe5', name: 'Higiene Facial Profunda + Ultrasonidos', durationMinutes: 60, price: 45, priceLabel: '45€', category: 'facial' },
    { id: 'pe6', name: 'Radiofrecuencia Facial', durationMinutes: 60, price: 50, priceLabel: '50€', category: 'facial' },
    { id: 'pe7', name: 'Peeling Luminosidad & Vitaminas', durationMinutes: 45, price: 48, priceLabel: '48€', category: 'facial' },
    { id: 'pe8', name: 'Masaje Relajante / Drenaje Corporal', durationMinutes: 60, price: 40, priceLabel: '40€', category: 'corporal' },
    { id: 'pe9', name: 'Diseño de Cejas & Lifting de Pestañas', durationMinutes: 45, price: 30, priceLabel: '30€', category: 'mirada' },
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
};

export const DEFAULT_SHOP_CONFIG = SHOP_CAMPODONICO_NAILS_CONFIG;

export function normalizeShopSlug(rawSlug) {
  if (!rawSlug || typeof rawSlug !== 'string') return '';
  return rawSlug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getShopVertical(shop = null, slug = '') {
  const cleanSlug = normalizeShopSlug(slug || shop?.slug || '');
  if (
    cleanSlug === 'peluqueria-estetica' ||
    cleanSlug === 'salon-estetica' ||
    shop?.vertical === 'peluqueria' ||
    shop?.vertical === 'estetica'
  ) {
    return 'peluqueria';
  }
  return 'nails';
}

export function sanitizeShopName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName.replace(/<[^>]*>/g, '').trim();
}

export function validateTenantConfig(config) {
  if (!config || typeof config !== 'object') return { valid: false, error: 'Configuración inválida' };
  if (!config.slug || !/^[a-z0-9-]+$/.test(config.slug)) {
    return { valid: false, error: 'El slug debe ser alfanumérico en minúsculas con guiones' };
  }
  if (!config.name || !String(config.name).trim()) return { valid: false, error: 'El nombre del salón es obligatorio' };
  if (!config.pin || !/^\d{4}$/.test(String(config.pin))) {
    return { valid: false, error: 'El PIN debe tener exactamente 4 dígitos numéricos' };
  }
  if (!Array.isArray(config.barbers) || config.barbers.length === 0) {
    return { valid: false, error: 'Debe añadir al menos una especialista activa' };
  }
  if (!Array.isArray(config.services) || config.services.length === 0) {
    return { valid: false, error: 'Debe incluir al menos un tratamiento' };
  }
  return { valid: true };
}

export function resolveTenantSlug(location = null, storage = null) {
  if (location) {
    const pathname = typeof location === 'string' ? location : location.pathname;
    if (pathname && typeof pathname === 'string') {
      const match = pathname.match(/^\/r\/([^/?#]+)/i);
      if (match && match[1]) {
        let raw = match[1];
        try {
          raw = decodeURIComponent(raw);
        } catch {
          // ignore
        }
        const normalized = normalizeShopSlug(raw);
        if (normalized) return normalized;
      }
    }

    const search =
      typeof location === 'string'
        ? location.includes('?')
          ? location.slice(location.indexOf('?'))
          : ''
        : location.search;
    if (search && typeof search === 'string') {
      try {
        const params = new URLSearchParams(search);
        const querySlug = params.get('shop') || params.get('shopSlug');
        if (querySlug) {
          const normalized = normalizeShopSlug(querySlug);
          if (normalized) return normalized;
        }
      } catch {
        // ignore
      }
    }
  }

  const effectiveStorage =
    storage ||
    (typeof window !== 'undefined' ? window.localStorage : null) ||
    (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
  if (effectiveStorage && typeof effectiveStorage.getItem === 'function') {
    try {
      const stored = effectiveStorage.getItem('lumina_beauty_active_shop_slug');
      if (stored) {
        const normalized = normalizeShopSlug(stored);
        if (normalized) return normalized;
      }
    } catch {
      // ignore
    }
  }

  return DEFAULT_SHOP_SLUG;
}

export function buildCustomerPortalUrl(origin, slug) {
  const defaultOrigin =
    typeof window !== 'undefined' && /^https?:\/\//i.test(window.location?.origin || '')
      ? window.location.origin
      : 'https://lumina-beauty-gary.netlify.app';
  const cleanOrigin = (origin || defaultOrigin).replace(/\/+$/, '');
  const cleanSlug = normalizeShopSlug(slug) || DEFAULT_SHOP_SLUG;
  return `${cleanOrigin}/r/${cleanSlug}`;
}

export function buildAppointmentIcsContent({
  title = 'Cita de Belleza',
  description = '',
  location = '',
  date = '',
  timeSlot = '10:00',
  durationMinutes = 60,
  bookingUrl = '',
} = {}) {
  const safeDate = String(date || '').replace(/[^0-9]/g, '');
  const [hhRaw, mmRaw] = String(timeSlot || '10:00').split(':');
  const startH = Math.max(0, Math.min(23, Number(hhRaw) || 10));
  const startM = Math.max(0, Math.min(59, Number(mmRaw) || 0));
  const dur = Math.max(15, Number(durationMinutes) || 60);

  let y = 2026;
  let mo = 1;
  let d = 1;
  if (safeDate.length === 8) {
    y = Number(safeDate.slice(0, 4));
    mo = Number(safeDate.slice(4, 6));
    d = Number(safeDate.slice(6, 8));
  } else {
    const now = new Date();
    y = now.getFullYear();
    mo = now.getMonth() + 1;
    d = now.getDate();
  }

  const startDt = new Date(Date.UTC(y, mo - 1, d, startH, startM, 0));
  const endDt = new Date(startDt.getTime() + dur * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmtLocal = (dt) =>
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00`;
  const stamp = fmtLocal(new Date()) + 'Z';
  const esc = (s) =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');

  const fullDesc = bookingUrl
    ? `${description ? `${description}\n` : ''}Volver a reservar directo: ${bookingUrl}`
    : description;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumina Beauty//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2, 8)}@lumina-beauty`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmtLocal(startDt)}`,
    `DTEND:${fmtLocal(endDt)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(fullDesc)}`,
    location ? `LOCATION:${esc(location)}` : null,
    bookingUrl ? `URL:${bookingUrl}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadAppointmentIcs(params = {}, filename = 'cita-salon.ics') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const content = buildAppointmentIcsContent(params);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function getPublicClientProfileKey(slug) {
  return `lumina_public_client_profile_${normalizeShopSlug(slug) || DEFAULT_SHOP_SLUG}`;
}

export function loadSavedPublicClientProfile(slug, storage = null) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s) return null;
  try {
    const raw = s.getItem(getPublicClientProfileKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (!parsed.clientName && !parsed.clientPhone)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePublicClientProfile(slug, profile, storage = null) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s || !profile) return;
  try {
    s.setItem(
      getPublicClientProfileKey(slug),
      JSON.stringify({
        clientName: String(profile.clientName || '').trim(),
        clientPhone: String(profile.clientPhone || '').trim(),
        lastServiceId: profile.lastServiceId || '',
        lastServiceName: profile.lastServiceName || '',
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore
  }
}

export function clearPublicClientProfile(slug, storage = null) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s) return;
  try {
    s.removeItem(getPublicClientProfileKey(slug));
  } catch {
    // ignore
  }
}

export function buildSalonVCardContent({
  name = 'Lumina Beauty',
  phone = '',
  address = '',
  bookingUrl = '',
  instagram = '',
} = {}) {
  const cleanName = String(name || 'Salón de Belleza').replace(/[\r\n;]/g, ' ').trim();
  const cleanPhone = String(phone || '').replace(/[^\d+\s-]/g, '').trim();
  const cleanAddress = String(address || '').replace(/[\r\n;]/g, ' ').trim();
  const noteParts = [
    bookingUrl ? `Reserva tu cita online en 10 segundos: ${bookingUrl}` : '',
    instagram ? `Instagram: ${instagram}` : '',
  ].filter(Boolean);

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${cleanName}`,
    `ORG:${cleanName}`,
    cleanPhone ? `TEL;TYPE=CELL,VOICE:${cleanPhone}` : null,
    cleanAddress ? `ADR;TYPE=WORK:;;${cleanAddress};;;;` : null,
    bookingUrl ? `URL:${bookingUrl}` : null,
    noteParts.length ? `NOTE:${noteParts.join(' | ')}` : null,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function downloadSalonVCard(params = {}, filename = 'contacto-salon.vcf') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const content = buildSalonVCardContent(params);
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function buildWhatsAppAutoReplyTemplate(shopName = 'nuestro salón', portalUrl = '') {
  return `¡Hola! ✨ Gracias por escribir a ${shopName}.\nPara ver huecos libres y reservar tu cita en 10 segundos sin esperar, toca aquí 👉 ${portalUrl}`;
}

export const BEAUTY_THEMES = [
  {
    id: 'silk-rose',
    name: 'Rosa Seda & Terracota',
    tagline: 'Luminoso, cálido y editorial (Por defecto)',
    mode: 'light',
    swatches: ['#FAF6F2', '#C87A72', '#C59B5F'],
  },
  {
    id: 'champagne-gold',
    name: 'Champán & Oro Viejo',
    tagline: 'Alta estética y lujo discreto dorado',
    mode: 'light',
    swatches: ['#FAF8F3', '#B68B4C', '#D4AF37'],
  },
  {
    id: 'botanical-sage',
    name: 'Salvia Botánico & Spa',
    tagline: 'Orgánico, natural y relajante',
    mode: 'light',
    swatches: ['#F3F8F5', '#4A7B63', '#8BA888'],
  },
  {
    id: 'lavender-atelier',
    name: 'Lavanda & Malva Chic',
    tagline: 'Moderno, femenino y fresco para nail bars',
    mode: 'light',
    swatches: ['#F8F5FA', '#8B669E', '#C58FB0'],
  },
  {
    id: 'obsidian-glam',
    name: 'Obsidiana & Oro Rosa',
    tagline: 'Modo oscuro glam de alto contraste',
    mode: 'dark',
    swatches: ['#141116', '#D88A82', '#C59B5F'],
  },
];

export const DEFAULT_BEAUTY_THEME_ID = 'silk-rose';

export function normalizeBeautyThemeId(themeId) {
  const clean = String(themeId || '').trim().toLowerCase();
  return BEAUTY_THEMES.some((t) => t.id === clean) ? clean : DEFAULT_BEAUTY_THEME_ID;
}

export function buildSalonHubUrl(slug, origin = '') {
  const cleanSlug = normalizeShopSlug(slug) || DEFAULT_SHOP_SLUG;
  const prefix = origin ? origin.replace(/\/+$/, '') : '';
  return `${prefix}/?shop=${cleanSlug}`;
}

export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits || digits.length < 9) return '';
  if (digits.length === 9) return `34${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone, text = '') {
  const waPhone = formatWhatsAppPhone(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return waPhone ? `https://wa.me/${waPhone}${query}` : `https://wa.me/${query}`;
}

export function getShopLocalDateTime(shop = null, now = new Date()) {
  const dateObj = now instanceof Date ? now : new Date(now);
  const addressStr = String(shop?.address || '').toLowerCase();
  const isCanary =
    shop?.timezone === 'Atlantic/Canary' ||
    addressStr.includes('lanzarote') ||
    addressStr.includes('arrecife') ||
    addressStr.includes('canarias');
  const timeZone = shop?.timezone || (isCanary ? 'Atlantic/Canary' : 'Europe/Madrid');
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(dateObj);
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    const year = Number(map.year);
    const month = Number(map.month);
    const day = Number(map.day);
    const hours = Number(map.hour === '24' ? '0' : map.hour);
    const minutes = Number(map.minute);
    return {
      isoDate: `${map.year}-${map.month}-${map.day}`,
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      dayOfWeek: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
      timeZone,
    };
  } catch {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const h = dateObj.getHours();
    const min = dateObj.getMinutes();
    return {
      isoDate: `${y}-${m}-${d}`,
      hours: h,
      minutes: min,
      totalMinutes: h * 60 + min,
      dayOfWeek: dateObj.getDay(),
      timeZone,
    };
  }
}

export function isPublicBookingPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  const segments = decoded.split('/').filter(Boolean);
  const resolved = [];
  for (const seg of segments) {
    if (seg === '..') resolved.pop();
    else if (seg !== '.') resolved.push(seg);
  }
  const normalized = '/' + resolved.join('/');
  return normalized === '/reservar' || normalized.startsWith('/r/');
}
