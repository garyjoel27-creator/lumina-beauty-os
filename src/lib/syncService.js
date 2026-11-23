/**
 * src/lib/syncService.js
 * Offline-First Synchronization Engine & Multi-Salon Partitioned Storage
 * for LUMINA // BEAUTY & SALON (namespace: lumina_beauty_*).
 */

import {
  SHOP_CAMPODONICO_NAILS_CONFIG,
  SHOP_PELUQUERIA_ESTETICA_CONFIG,
} from './shopUtils.js';

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
  AUTH_REQUIRED: 'auth_required',
};

const STORAGE_PREFIX = 'lumina_beauty';
const DEFAULT_STORAGE_MEMORY = new Map();

export function getEffectiveStorage(customStorage) {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return {
    getItem: (k) => (DEFAULT_STORAGE_MEMORY.has(k) ? DEFAULT_STORAGE_MEMORY.get(k) : null),
    setItem: (k, v) => DEFAULT_STORAGE_MEMORY.set(k, String(v)),
    removeItem: (k) => DEFAULT_STORAGE_MEMORY.delete(k),
  };
}

export function getShopStorageKeys(shopSlug = 'campodonico-nails') {
  const safeSlug = String(shopSlug || 'campodonico-nails').toLowerCase().trim() || 'campodonico-nails';
  return {
    config: `${STORAGE_PREFIX}_${safeSlug}_config`,
    appointments: `${STORAGE_PREFIX}_${safeSlug}_appointments`,
    queue: `${STORAGE_PREFIX}_${safeSlug}_queue`,
    clients: `${STORAGE_PREFIX}_${safeSlug}_clients`,
    outbox: `${STORAGE_PREFIX}_${safeSlug}_outbox`,
    lastSync: `${STORAGE_PREFIX}_${safeSlug}_last_sync`,
    verifiedPin: `${STORAGE_PREFIX}_${safeSlug}_verified_pin`,
    sales: `${STORAGE_PREFIX}_${safeSlug}_sales`,
    reviews: `${STORAGE_PREFIX}_${safeSlug}_reviews`,
    deletedIds: `${STORAGE_PREFIX}_${safeSlug}_deleted_ids`,
  };
}

export function getLocalDeletedIds(shopSlug, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  try {
    const raw = storage.getItem(keys.deletedIds);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function recordLocalDeletion(shopSlug, id, customStorage) {
  if (!id) return;
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  const existing = getLocalDeletedIds(shopSlug, storage);
  const strId = String(id);
  if (!existing.includes(strId)) {
    try {
      storage.setItem(keys.deletedIds, JSON.stringify([...existing.slice(-200), strId]));
    } catch {
      // ignore
    }
  }
}

export function mergeSyncedAppointments(remoteApts, localApts, deletedIds = [], outbox = []) {
  const deletedSet = new Set(deletedIds.map(String));
  const pendingAddIds = new Set(
    (outbox || [])
      .filter((item) => item?.action === 'add_appointment' && item?.payload?.id)
      .map((item) => String(item.payload.id))
  );
  const remoteList = Array.isArray(remoteApts) ? remoteApts : [];
  const localList = Array.isArray(localApts) ? localApts : [];

  const byId = new Map();
  for (const apt of remoteList) {
    if (!apt?.id || deletedSet.has(String(apt.id))) continue;
    byId.set(String(apt.id), apt);
  }
  for (const localApt of localList) {
    if (!localApt?.id || deletedSet.has(String(localApt.id))) continue;
    const idStr = String(localApt.id);
    if (!byId.has(idStr) && (localApt.isDemo || pendingAddIds.has(idStr))) {
      byId.set(idStr, localApt);
    }
  }
  return Array.from(byId.values());
}

export function mergeSyncedClients(remoteClients, localClients, deletedIds = []) {
  const deletedSet = new Set(deletedIds.map(String));
  const remoteList = Array.isArray(remoteClients) ? remoteClients : [];
  const localList = Array.isArray(localClients) ? localClients : [];

  const byId = new Map();
  for (const c of remoteList) {
    if (!c?.id || deletedSet.has(String(c.id))) continue;
    byId.set(String(c.id), c);
  }
  for (const c of localList) {
    if (!c?.id || deletedSet.has(String(c.id))) continue;
    const idStr = String(c.id);
    if (!byId.has(idStr)) {
      byId.set(idStr, c);
    }
  }
  return Array.from(byId.values());
}

export function mergeSyncedSales(remoteSales, localSales) {
  const remoteList = Array.isArray(remoteSales) ? remoteSales : [];
  const localList = Array.isArray(localSales) ? localSales : [];
  const byId = new Map();
  for (const s of localList) {
    if (s && s.id) byId.set(String(s.id), s);
  }
  for (const s of remoteList) {
    if (s && s.id) {
      const prev = byId.get(String(s.id)) || {};
      byId.set(String(s.id), { ...prev, ...s });
    }
  }
  return Array.from(byId.values()).sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
}

export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function loadLocalShopState(shopSlug, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  const parse = (k, fallback) => {
    try {
      const raw = storage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    config: parse(keys.config, null),
    appointments: parse(keys.appointments, []),
    queue: parse(keys.queue, []),
    clients: parse(keys.clients, []),
    sales: parse(keys.sales, []),
    outbox: parse(keys.outbox, []),
    lastSync: parse(keys.lastSync, null),
  };
}

export function saveLocalShopState(shopSlug, state, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  const write = (k, val) => {
    try {
      storage.setItem(k, JSON.stringify(val));
    } catch {
      // quota guard
    }
  };
  if (state.config !== undefined) write(keys.config, state.config);
  if (state.appointments !== undefined) write(keys.appointments, state.appointments);
  if (state.queue !== undefined) write(keys.queue, state.queue);
  if (state.clients !== undefined) write(keys.clients, state.clients);
  if (state.sales !== undefined) write(keys.sales, state.sales);
  if (state.outbox !== undefined) write(keys.outbox, state.outbox);
  if (state.lastSync !== undefined) write(keys.lastSync, state.lastSync);
}

export function calculateHoldExpiration(nowMs = Date.now(), holdMinutes = 10) {
  return nowMs + holdMinutes * 60 * 1000;
}

export function isHoldExpired(appointment, nowMs = Date.now()) {
  if (!appointment || appointment.status !== 'pending') return false;
  if (!appointment.holdExpiresAt) return false;
  return appointment.holdExpiresAt <= nowMs;
}

export function enqueueOutboxAction(shopSlug, action, payload, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  let outbox = [];
  try {
    const raw = storage.getItem(keys.outbox);
    outbox = raw ? JSON.parse(raw) : [];
  } catch {
    outbox = [];
  }
  const entry = {
    id: `obx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    shopSlug,
    action,
    payload,
    enqueuedAt: Date.now(),
    retries: 0,
  };
  outbox.push(entry);
  try {
    storage.setItem(keys.outbox, JSON.stringify(outbox));
  } catch {
    // ignore
  }
  return entry;
}

export function getOutbox(shopSlug, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  const keys = getShopStorageKeys(shopSlug);
  try {
    const raw = storage.getItem(keys.outbox);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function replayOutbox(shopSlug, pin, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';
  const keys = getShopStorageKeys(shopSlug);
  const outbox = getOutbox(shopSlug, storage);

  if (!fetchFn || outbox.length === 0) {
    return { processed: 0, remaining: outbox.length, dropped: 0 };
  }

  let processed = 0;
  let dropped = 0;
  const remaining = [];

  for (let i = 0; i < outbox.length; i++) {
    const item = outbox[i];
    try {
      const res = await fetchFn(`${apiBase}/api/shops/${encodeURIComponent(shopSlug)}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-pin': String(pin || ''),
        },
        body: JSON.stringify({ action: item.action, payload: item.payload }),
      });

      if (res.ok) {
        processed++;
      } else if (res.status === 401 || res.status === 403) {
        remaining.push(...outbox.slice(i));
        break;
      } else if (res.status >= 400 && res.status < 500) {
        const nextRetries = (item.retries || 0) + 1;
        if (nextRetries >= 5) dropped++;
        else remaining.push({ ...item, retries: nextRetries });
      } else {
        remaining.push(...outbox.slice(i));
        break;
      }
    } catch {
      remaining.push(...outbox.slice(i));
      break;
    }
  }

  try {
    storage.setItem(keys.outbox, JSON.stringify(remaining));
  } catch {
    // ignore
  }
  return { processed, remaining: remaining.length, dropped };
}

export class SyncEngine {
  constructor(options = {}) {
    this.shopSlug = options.shopSlug || 'campodonico-nails';
    this.pin = options.pin || '';
    this.pollIntervalMs = options.pollIntervalMs || 15000;
    this.storage = getEffectiveStorage(options.storage);
    this.fetch = options.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    this.apiBase = options.apiBase || '';
    this.status = SYNC_STATUS.IDLE;
    this.timer = null;
    this.destroyed = false;
    this.listeners = { status: [], data: [], outbox: [], error: [], auth: [] };
    this._onlineHandler = () => this.forceSync();
    this._offlineHandler = () => this._setStatus(SYNC_STATUS.OFFLINE);
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => {
      this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb);
    };
  }

  _emit(event, payload) {
    (this.listeners[event] || []).forEach((cb) => {
      try {
        cb(payload);
      } catch {
        // ignore listener error
      }
    });
  }

  _setStatus(next) {
    if (this.status !== next) {
      this.status = next;
      this._emit('status', next);
    }
  }

  start() {
    if (this.destroyed) return;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._onlineHandler);
      window.addEventListener('offline', this._offlineHandler);
    }
    this.forceSync();
    this.timer = setInterval(() => this.forceSync(), this.pollIntervalMs);
  }

  switchShop(newSlug, newPin = '') {
    this.shopSlug = newSlug;
    this.pin = newPin;
    this.forceSync();
  }

  async forceSync() {
    if (this.destroyed || !this.fetch || !this.pin) return null;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this._setStatus(SYNC_STATUS.OFFLINE);
      return null;
    }

    this._setStatus(SYNC_STATUS.SYNCING);
    try {
      const replayRes = await replayOutbox(this.shopSlug, this.pin, {
        storage: this.storage,
        fetch: this.fetch,
        apiBase: this.apiBase,
      });
      this._emit('outbox', getOutbox(this.shopSlug, this.storage));
      void replayRes;

      const res = await this.fetch(`${this.apiBase}/api/shops/${encodeURIComponent(this.shopSlug)}/sync`, {
        method: 'GET',
        headers: {
          'x-shop-pin': String(this.pin),
          Accept: 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        this._setStatus(SYNC_STATUS.AUTH_REQUIRED);
        this._emit('auth', true);
        return null;
      }
      if (!res.ok) {
        this._setStatus(SYNC_STATUS.ERROR);
        return null;
      }

      const data = await res.json();
      if (data && data.success) {
        this._emit('auth', false);
        const currentLocal = loadLocalShopState(this.shopSlug, this.storage);
        const deletedIds = getLocalDeletedIds(this.shopSlug, this.storage);
        const pendingOutbox = getOutbox(this.shopSlug, this.storage);
        const mergedAppointments = mergeSyncedAppointments(
          data.appointments,
          currentLocal.appointments,
          deletedIds,
          pendingOutbox
        );
        const mergedClients = mergeSyncedClients(
          data.clients,
          currentLocal.clients,
          deletedIds
        );
        const mergedSales = mergeSyncedSales(data.dailySales, currentLocal.sales);
        saveLocalShopState(
          this.shopSlug,
          {
            config: data.config ? { ...data.config, pin: this.pin } : currentLocal.config,
            appointments: mergedAppointments,
            queue: Array.isArray(data.queue) && data.queue.length > 0 ? data.queue : currentLocal.queue,
            clients: mergedClients,
            sales: mergedSales,
            lastSync: Date.now(),
          },
          this.storage
        );
        this._setStatus(SYNC_STATUS.ONLINE);
        this._emit('data', data);
        return data;
      }
      return null;
    } catch {
      this._setStatus(SYNC_STATUS.OFFLINE);
      return null;
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.timer) clearInterval(this.timer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._onlineHandler);
      window.removeEventListener('offline', this._offlineHandler);
    }
  }
}

export async function dispatchSalonAction(shopSlug, pin, action, payload, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';

  if (!fetchFn || !pin) {
    enqueueOutboxAction(shopSlug, action, payload, storage);
    return { success: true, queued: true };
  }

  try {
    const res = await fetchFn(`${apiBase}/api/shops/${encodeURIComponent(shopSlug)}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-pin': String(pin),
      },
      body: JSON.stringify({ action, payload }),
    });
    if (res.ok) {
      return await res.json();
    }
    enqueueOutboxAction(shopSlug, action, payload, storage);
    return { success: false, queued: true, status: res.status };
  } catch {
    enqueueOutboxAction(shopSlug, action, payload, storage);
    return { success: true, queued: true, offline: true };
  }
}

export function getLocalShopsIndex(customStorage) {
  const storage = getEffectiveStorage(customStorage);
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}_shops_index`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return [
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
      barbers: SHOP_CAMPODONICO_NAILS_CONFIG.barbers,
      services: SHOP_CAMPODONICO_NAILS_CONFIG.services,
      schedule: SHOP_CAMPODONICO_NAILS_CONFIG.schedule,
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
      barbers: SHOP_PELUQUERIA_ESTETICA_CONFIG.barbers,
      services: SHOP_PELUQUERIA_ESTETICA_CONFIG.services,
      schedule: SHOP_PELUQUERIA_ESTETICA_CONFIG.schedule,
    },
  ];
}

export function saveLocalShopsIndex(shops, customStorage) {
  const storage = getEffectiveStorage(customStorage);
  try {
    storage.setItem(`${STORAGE_PREFIX}_shops_index`, JSON.stringify(shops));
  } catch {
    // ignore
  }
}

export async function fetchAdminShops(adminKey, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';
  if (!fetchFn) return { success: true, shops: getLocalShopsIndex(storage) };
  try {
    const res = await fetchFn(`${apiBase}/api/admin/shops`, {
      method: 'GET',
      headers: { 'x-admin-key': adminKey, Accept: 'application/json' },
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && Array.isArray(data.shops)) {
      saveLocalShopsIndex(data.shops, storage);
      return data;
    }
    if (res.status === 401) return { success: false, error: 'Clave maestra incorrecta', status: 401 };
  } catch {
    // offline fallback
  }
  return { success: true, shops: getLocalShopsIndex(storage), fallback: true };
}

export async function provisionShop(shopData, adminKey, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';
  if (fetchFn) {
    try {
      const res = await fetchFn(`${apiBase}/api/admin/shops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(shopData),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const list = getLocalShopsIndex(storage);
        if (!list.some((s) => s.slug === data.slug)) {
          saveLocalShopsIndex([...list, data.shop], storage);
        }
        return data;
      }
      if (data && data.error) return data;
    } catch {
      // local fallback
    }
  }
  const list = getLocalShopsIndex(storage);
  if (list.some((s) => s.slug === shopData.slug)) {
    return { success: false, error: 'Ya existe un salón con ese slug' };
  }
  const created = { ...shopData, status: 'active', createdAt: Date.now() };
  saveLocalShopsIndex([...list, created], storage);
  saveLocalShopState(created.slug, { config: created, appointments: [], queue: [], clients: [] }, storage);
  return { success: true, slug: created.slug, shop: created, fallback: true };
}

export async function updateShopStatus(shopSlug, status, adminKey, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';
  if (fetchFn) {
    try {
      const res = await fetchFn(`${apiBase}/api/admin/shops/${encodeURIComponent(shopSlug)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const list = getLocalShopsIndex(storage).map((s) => (s.slug === shopSlug ? { ...s, status } : s));
        saveLocalShopsIndex(list, storage);
        return data;
      }
    } catch {
      // fallback
    }
  }
  const list = getLocalShopsIndex(storage).map((s) => (s.slug === shopSlug ? { ...s, status } : s));
  saveLocalShopsIndex(list, storage);
  return { success: true, slug: shopSlug, status, fallback: true };
}

export async function updateShopConfig(shopSlug, updates, adminKey, options = {}) {
  const storage = getEffectiveStorage(options.storage);
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  const apiBase = options.apiBase || '';
  if (fetchFn) {
    try {
      const res = await fetchFn(`${apiBase}/api/admin/shops/${encodeURIComponent(shopSlug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const list = getLocalShopsIndex(storage).map((s) => (s.slug === shopSlug ? { ...s, ...data.shop } : s));
        saveLocalShopsIndex(list, storage);
        return data;
      }
      if (data && data.error) return data;
    } catch {
      // fallback
    }
  }
  const list = getLocalShopsIndex(storage).map((s) => (s.slug === shopSlug ? { ...s, ...updates } : s));
  saveLocalShopsIndex(list, storage);
  return { success: true, slug: shopSlug, shop: { slug: shopSlug, ...updates }, fallback: true };
}
