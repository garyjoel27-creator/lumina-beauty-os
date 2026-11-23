import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_SHOP_SLUG,
  SHOP_CAMPODONICO_NAILS_CONFIG,
  SHOP_PELUQUERIA_ESTETICA_CONFIG,
  normalizeShopSlug,
  validateTenantConfig,
  resolveTenantSlug,
  isPublicBookingPath,
  getShopVertical,
} from '../lib/shopUtils';
import {
  SyncEngine,
  fetchAdminShops,
  provisionShop,
  updateShopStatus as apiUpdateShopStatus,
  updateShopConfig as apiUpdateShopConfig,
  getLocalShopsIndex,
  getEffectiveStorage,
  SYNC_STATUS,
} from '../lib/syncService';

export const ShopContext = createContext(null);

function getFallbackShopForSlug(slug, storage = null, stripPin = false) {
  const cleanSlug = normalizeShopSlug(slug) || DEFAULT_SHOP_SLUG;
  let base;
  if (cleanSlug === 'campodonico-nails' || cleanSlug === 'default') {
    base = { ...SHOP_CAMPODONICO_NAILS_CONFIG };
  } else if (cleanSlug === 'peluqueria-estetica' || cleanSlug === 'salon-estetica') {
    base = { ...SHOP_PELUQUERIA_ESTETICA_CONFIG, slug: cleanSlug };
  } else {
    let indexed = null;
    if (storage) {
      try {
        const list = getLocalShopsIndex(storage);
        indexed = Array.isArray(list) ? list.find((s) => s.slug === cleanSlug) : null;
      } catch {
        // ignore
      }
    }
    const isPeluqueria = indexed?.vertical === 'peluqueria';
    const template = isPeluqueria ? SHOP_PELUQUERIA_ESTETICA_CONFIG : SHOP_CAMPODONICO_NAILS_CONFIG;
    base = {
      ...template,
      ...(indexed || {}),
      slug: cleanSlug,
      name: indexed?.name || cleanSlug.replace(/-/g, ' ').toUpperCase(),
      pin: indexed?.pin || '',
      phone: indexed?.phone || '',
      address: indexed?.address || '',
      barbers:
        Array.isArray(indexed?.barbers) && indexed.barbers.length > 0
          ? indexed.barbers
          : [{ id: 's1', name: 'Especialista Titular', chair: 'ESTACIÓN 1', specialty: 'Beauty Atelier', available: true }],
      services:
        Array.isArray(indexed?.services) && indexed.services.length > 0 ? indexed.services : template.services,
    };
  }
  if (stripPin) {
    const { pin: _omitted, ...safe } = base;
    return safe;
  }
  return base;
}

export function ShopProvider({ children, initialSlug = null, customStorage = null, customFetch = null }) {
  let routerLocation = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerLocation = useLocation();
  } catch {
    if (typeof window !== 'undefined') routerLocation = window.location;
  }

  const storage = useMemo(() => getEffectiveStorage(customStorage), [customStorage]);

  const isPublicRoute = useMemo(() => {
    const pathname = routerLocation?.pathname || (typeof window !== 'undefined' ? window.location?.pathname : '');
    return isPublicBookingPath(pathname);
  }, [routerLocation?.pathname]);

  const initialResolvedSlug = useMemo(() => {
    if (initialSlug) return normalizeShopSlug(initialSlug);
    return resolveTenantSlug(routerLocation, storage);
  }, [initialSlug, routerLocation, storage]);

  const [activeShopSlug, setActiveShopSlug] = useState(initialResolvedSlug);
  const [activeShop, setActiveShop] = useState(() => {
    try {
      const raw = storage.getItem(`lumina_beauty_${initialResolvedSlug}_config`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isPublicRoute) {
          const { pin: _p, ...safe } = parsed;
          return safe;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return getFallbackShopForSlug(initialResolvedSlug, storage, isPublicRoute);
  });

  const [shopsList, setShopsList] = useState(() => getLocalShopsIndex(storage));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [outboxCount, setOutboxCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [needsPinSync, setNeedsPinSync] = useState(false);

  const resolvedPin = useMemo(() => {
    if (isPublicRoute) return '';
    try {
      const search = routerLocation?.search || (typeof window !== 'undefined' ? window.location.search : '');
      if (search) {
        const params = new URLSearchParams(search);
        const urlPin = params.get('pin');
        if (urlPin && /^\d{4}$/.test(urlPin)) {
          storage.setItem(`lumina_beauty_${activeShopSlug}_verified_pin`, urlPin);
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            params.delete('pin');
            const cleanQuery = params.toString();
            const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash || ''}`;
            window.history.replaceState({}, '', cleanUrl);
          }
          return urlPin;
        }
      }
      const savedPin = storage.getItem(`lumina_beauty_${activeShopSlug}_verified_pin`);
      if (savedPin && /^\d{4}$/.test(savedPin)) return savedPin;
      const rawCfg = storage.getItem(`lumina_beauty_${activeShopSlug}_config`);
      if (rawCfg) {
        const parsedCfg = JSON.parse(rawCfg);
        if (parsedCfg?.pin && /^\d{4}$/.test(String(parsedCfg.pin))) return String(parsedCfg.pin);
      }
    } catch {
      // ignore
    }
    if (activeShop?.slug === activeShopSlug && activeShop?.pin && /^\d{4}$/.test(String(activeShop.pin))) {
      return String(activeShop.pin);
    }
    const fallback = getFallbackShopForSlug(activeShopSlug, storage, false);
    return fallback?.pin || '';
  }, [isPublicRoute, activeShopSlug, activeShop?.slug, activeShop?.pin, routerLocation?.search, storage]);

  const activeVertical = useMemo(
    () => getShopVertical(activeShop, activeShopSlug),
    [activeShop, activeShopSlug]
  );

  const isPaused = useMemo(
    () => String(activeShop?.status || '').toLowerCase() === 'paused',
    [activeShop]
  );

  const syncEngineRef = useRef(null);

  // Hydrate public shop config from Netlify Blobs
  useEffect(() => {
    const fetchFn = customFetch || (typeof fetch !== 'undefined' ? fetch : null);
    if (!activeShopSlug || !fetchFn) return;
    let cancelled = false;
    fetchFn(`/api/shops/${encodeURIComponent(activeShopSlug)}/public-state`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        return { ok: res.ok, status: res.status, data };
      })
      .then(({ ok, status, data }) => {
        if (cancelled) return;
        if ((status === 403 || status === 404) && (data?.paused || data?.error === 'shop_inactive')) {
          setActiveShop((prev) => ({
            ...(prev?.slug === activeShopSlug ? prev : {}),
            ...(data?.shop || {}),
            slug: activeShopSlug,
            status: 'paused',
          }));
          return;
        }
        if (!ok || !data || !data.success || !data.shop) return;
        setActiveShop((prev) => {
          const samePrev = prev?.slug === activeShopSlug ? prev : {};
          const merged = { ...samePrev, ...data.shop, slug: activeShopSlug };
          if (isPublicRoute) {
            delete merged.pin;
          } else {
            const privatePin = samePrev?.pin || resolvedPin || '';
            if (privatePin) merged.pin = privatePin;
            try {
              storage.setItem(`lumina_beauty_${activeShopSlug}_config`, JSON.stringify(merged));
            } catch {
              // ignore
            }
          }
          if (prev && JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeShopSlug, isPublicRoute, resolvedPin, storage, customFetch]);

  // SyncEngine ONLY runs on private salon routes (NEVER on /r/:shopSlug or /reservar)
  useEffect(() => {
    if (isPublicRoute) {
      if (syncEngineRef.current) {
        syncEngineRef.current.destroy();
        syncEngineRef.current = null;
      }
      return;
    }

    const engine = new SyncEngine({
      shopSlug: activeShopSlug,
      pin: resolvedPin || activeShop?.pin || '',
      storage,
      fetch: customFetch,
    });
    syncEngineRef.current = engine;

    const unsubs = [
      engine.on('status', (st) => setSyncStatus(st)),
      engine.on('auth', (req) => setNeedsPinSync(Boolean(req))),
      engine.on('outbox', (obx) => setOutboxCount(Array.isArray(obx) ? obx.length : 0)),
      engine.on('data', (data) => {
        if (data?.config) {
          setActiveShop((prev) => {
            const samePrev = prev?.slug === activeShopSlug ? prev : {};
            const nextShop = {
              ...samePrev,
              ...data.config,
              pin: data.config.pin || samePrev?.pin || resolvedPin || '',
            };
            if (prev && JSON.stringify(prev) === JSON.stringify(nextShop)) return prev;
            return nextShop;
          });
        }
        setLastSyncTime(Date.now());
      }),
      engine.on('error', (err) => setError(err?.message || 'Error de sincronización')),
    ];

    engine.start();

    return () => {
      unsubs.forEach((u) => u());
      engine.destroy();
      syncEngineRef.current = null;
    };
  }, [isPublicRoute, activeShopSlug, resolvedPin, activeShop?.pin, storage, customFetch]);

  const loadShopConfig = useCallback(
    (slug, forPublic = isPublicRoute) => {
      const cleanSlug = normalizeShopSlug(slug) || DEFAULT_SHOP_SLUG;
      try {
        const raw = storage.getItem(`lumina_beauty_${cleanSlug}_config`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const fallback = getFallbackShopForSlug(cleanSlug, storage, false);
          const savedPin = !forPublic ? storage.getItem(`lumina_beauty_${cleanSlug}_verified_pin`) : '';
          const merged = {
            ...fallback,
            ...parsed,
            slug: cleanSlug,
            pin: parsed.pin || savedPin || fallback.pin || '',
          };
          if (forPublic) delete merged.pin;
          setActiveShop((prev) => (prev && JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));
          return merged;
        }
      } catch {
        // ignore
      }
      const fallback = getFallbackShopForSlug(cleanSlug, storage, forPublic);
      setActiveShop((prev) => (prev && JSON.stringify(prev) === JSON.stringify(fallback) ? prev : fallback));
      return fallback;
    },
    [storage, isPublicRoute]
  );

  const switchShop = useCallback(
    (rawSlug, pin = null) => {
      const cleanSlug = normalizeShopSlug(rawSlug) || DEFAULT_SHOP_SLUG;
      try {
        if (!isPublicRoute) {
          storage.setItem('lumina_beauty_active_shop_slug', cleanSlug);
        }
        if (pin && /^\d{4}$/.test(String(pin))) {
          storage.setItem(`lumina_beauty_${cleanSlug}_verified_pin`, String(pin));
        }
      } catch {
        // ignore
      }
      if (cleanSlug !== activeShopSlug) setActiveShopSlug(cleanSlug);
      const cfg = loadShopConfig(cleanSlug, isPublicRoute);
      if (syncEngineRef.current && !isPublicRoute) {
        syncEngineRef.current.switchShop(cleanSlug, pin || cfg?.pin || '');
      }
    },
    [activeShopSlug, isPublicRoute, storage, loadShopConfig]
  );

  useEffect(() => {
    const pathname = routerLocation?.pathname || (typeof window !== 'undefined' ? window.location?.pathname : '');
    const search = routerLocation?.search || (typeof window !== 'undefined' ? window.location?.search : '');
    const hasExplicitUrlTenant = /^\/r\/[^/?#]+/i.test(pathname || '') || /[?&](shop|shopSlug)=/i.test(search || '');
    const targetSlug = hasExplicitUrlTenant && initialResolvedSlug ? initialResolvedSlug : activeShopSlug;
    if (targetSlug && targetSlug !== activeShopSlug) setActiveShopSlug(targetSlug);
    if (!isPublicRoute && targetSlug) {
      try {
        storage.setItem('lumina_beauty_active_shop_slug', targetSlug);
      } catch {
        // ignore
      }
    }
    loadShopConfig(targetSlug, isPublicRoute);
  }, [initialResolvedSlug, activeShopSlug, isPublicRoute, routerLocation?.pathname, routerLocation?.search, storage, loadShopConfig]);

  const updateLocalShopSchedule = useCallback(
    (schedulePatch) => {
      setActiveShop((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          schedule: {
            ...(prev.schedule || {}),
            ...schedulePatch,
            hoursByDay: {
              ...(prev.schedule?.hoursByDay || {}),
              ...(schedulePatch?.hoursByDay || {}),
            },
          },
        };
        try {
          storage.setItem(`lumina_beauty_${activeShopSlug}_config`, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [activeShopSlug, storage]
  );

  const refreshShops = useCallback(
    async (adminKey = 'lumina-beauty-admin-2026') => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchAdminShops(adminKey, { storage, fetch: customFetch });
        if (res.success && Array.isArray(res.shops)) setShopsList(res.shops);
        return res;
      } catch (err) {
        setError(err?.message || 'Error al listar salones');
        const fallbackList = getLocalShopsIndex(storage);
        setShopsList(fallbackList);
        return { success: false, shops: fallbackList };
      } finally {
        setIsLoading(false);
      }
    },
    [storage, customFetch]
  );

  const createShop = useCallback(
    async (shopData, adminKey = 'lumina-beauty-admin-2026') => {
      setError(null);
      const validation = validateTenantConfig(shopData);
      if (!validation.valid) {
        setError(validation.error);
        return { success: false, error: validation.error };
      }
      setIsLoading(true);
      try {
        const result = await provisionShop(shopData, adminKey, { storage, fetch: customFetch });
        if (!result.success) {
          setError(result.error);
          return result;
        }
        await refreshShops(adminKey);
        return result;
      } catch (err) {
        const msg = err?.message || 'Error al crear salón';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [storage, customFetch, refreshShops]
  );

  const toggleShopStatus = useCallback(
    async (slug, adminKey = 'lumina-beauty-admin-2026') => {
      const cleanSlug = normalizeShopSlug(slug);
      const current = shopsList.find((s) => s.slug === cleanSlug) || (cleanSlug === activeShopSlug ? activeShop : null);
      const currentStatus = String(current?.status || '').toLowerCase();
      const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
      setShopsList((prev) => prev.map((s) => (s.slug === cleanSlug ? { ...s, status: newStatus } : s)));
      if (cleanSlug === activeShopSlug) setActiveShop((prev) => (prev ? { ...prev, status: newStatus } : prev));
      try {
        return await apiUpdateShopStatus(cleanSlug, newStatus, adminKey, { storage, fetch: customFetch });
      } catch (err) {
        setShopsList((prev) => prev.map((s) => (s.slug === cleanSlug ? { ...s, status: currentStatus } : s)));
        if (cleanSlug === activeShopSlug) setActiveShop((prev) => (prev ? { ...prev, status: currentStatus } : prev));
        return { success: false, error: err?.message };
      }
    },
    [shopsList, activeShopSlug, activeShop, storage, customFetch]
  );

  const updateShop = useCallback(
    async (slug, updates, adminKey = 'lumina-beauty-admin-2026') => {
      const cleanSlug = normalizeShopSlug(slug);
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiUpdateShopConfig(cleanSlug, updates, adminKey, { storage, fetch: customFetch });
        if (res.success) {
          if (cleanSlug === activeShopSlug && res.shop) setActiveShop(res.shop);
          await refreshShops(adminKey);
        }
        return res;
      } catch (err) {
        setError(err?.message || 'Error al actualizar salón');
        return { success: false, error: err?.message };
      } finally {
        setIsLoading(false);
      }
    },
    [activeShopSlug, storage, customFetch, refreshShops]
  );

  const verifyAndUnlockShopPin = useCallback(
    async (pinAttempt) => {
      const cleanPin = String(pinAttempt || '').trim();
      if (!/^\d{4}$/.test(cleanPin)) return { success: false, error: 'PIN inválido (4 dígitos)' };
      const fetchFn = customFetch || (typeof fetch !== 'undefined' ? fetch : null);
      const expectedLocal = activeShop?.pin || getFallbackShopForSlug(activeShopSlug, storage, false)?.pin || '2023';

      if (fetchFn) {
        try {
          const res = await fetchFn(`/api/shops/${encodeURIComponent(activeShopSlug)}/sync`, {
            method: 'GET',
            headers: { 'x-shop-pin': cleanPin, Accept: 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            storage.setItem(`lumina_beauty_${activeShopSlug}_verified_pin`, cleanPin);
            if (data?.config) {
              const merged = { ...data.config, pin: cleanPin };
              setActiveShop(merged);
              storage.setItem(`lumina_beauty_${activeShopSlug}_config`, JSON.stringify(merged));
            }
            setNeedsPinSync(false);
            if (syncEngineRef.current) {
              syncEngineRef.current.pin = cleanPin;
              syncEngineRef.current.forceSync();
            }
            setLastSyncTime(Date.now());
            return { success: true };
          }
          if (res.status === 401) return { success: false, error: 'PIN incorrecto para este salón' };
        } catch {
          // offline fallback check
        }
      }

      if (cleanPin === String(expectedLocal)) {
        storage.setItem(`lumina_beauty_${activeShopSlug}_verified_pin`, cleanPin);
        setNeedsPinSync(false);
        return { success: true };
      }
      return { success: false, error: 'PIN incorrecto para este salón' };
    },
    [activeShopSlug, activeShop?.pin, storage, customFetch]
  );

  const forceSyncNow = useCallback(async () => {
    if (syncEngineRef.current) return await syncEngineRef.current.forceSync();
    return null;
  }, []);

  const value = useMemo(
    () => ({
      activeShopSlug,
      activeShop,
      activeVertical,
      shopsList,
      isLoading,
      error,
      isPaused,
      isPublicRoute,
      resolvedPin,
      syncStatus,
      outboxCount,
      lastSyncTime,
      needsPinSync,
      switchShop,
      createShop,
      updateShop,
      toggleShopStatus,
      refreshShops,
      verifyAndUnlockShopPin,
      forceSyncNow,
      updateLocalShopSchedule,
    }),
    [
      activeShopSlug,
      activeShop,
      activeVertical,
      shopsList,
      isLoading,
      error,
      isPaused,
      isPublicRoute,
      resolvedPin,
      syncStatus,
      outboxCount,
      lastSyncTime,
      needsPinSync,
      switchShop,
      createShop,
      updateShop,
      toggleShopStatus,
      refreshShops,
      verifyAndUnlockShopPin,
      forceSyncNow,
      updateLocalShopSchedule,
    ]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within a ShopProvider');
  return ctx;
}
