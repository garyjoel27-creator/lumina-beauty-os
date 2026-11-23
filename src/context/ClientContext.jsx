import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useShop } from './ShopContext';
import { dispatchSalonAction, loadLocalShopState, saveLocalShopState } from '../lib/syncService';
import { buildWhatsAppUrl } from '../lib/shopUtils';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRetentionRadarAlert(client, vertical = 'nails', referenceDate = Date.now()) {
  if (!client || !Array.isArray(client.treatments) || client.treatments.length === 0) {
    return { status: 'new', daysSince: 0, dueNow: false, label: 'Nueva clienta', message: '' };
  }
  const latest = client.treatments[0];
  const ts = Number(latest.timestamp) || Date.now();
  const daysSince = Math.max(0, Math.floor((referenceDate - ts) / DAY_MS));
  const minCycle = vertical === 'nails' ? 18 : 21;
  const maxCycle = vertical === 'nails' ? 21 : 28;
  const isUrgent = daysSince >= maxCycle;
  const isDue = daysSince >= minCycle;

  const firstName = String(client.name || 'guapa').split(' ')[0];
  const waText =
    vertical === 'nails'
      ? `¡Hola ${firstName}! 💅 Hace ${daysSince} días que hicimos tus uñas (${client.nailShape || 'Almendra'} · ${client.nailColor || 'tu tono'}). ¿Te guardamos huequito esta semana para tu relleno acrílico y dejarlas perfectas? ✨`
      : `¡Hola ${firstName}! 💇‍♀️ Hace ${daysSince} días de tu última visita (${latest.name || 'tu tratamiento'}). Ya toca mimar tu cabello/piel con tu retoque. ¿Te reservo cita esta semana? ✨`;

  return {
    status: isUrgent ? 'urgent' : isDue ? 'due' : 'fresh',
    daysSince,
    dueNow: isDue,
    minCycle,
    maxCycle,
    label:
      vertical === 'nails'
        ? isUrgent
          ? `Relleno urgente · ${daysSince}d`
          : isDue
          ? `Toca relleno · ${daysSince}d`
          : `Impecable · hace ${daysSince}d`
        : isUrgent
        ? `Retoque urgente · ${daysSince}d`
        : isDue
        ? `Toca retoque · ${daysSince}d`
        : `Al día · hace ${daysSince}d`,
    whatsappUrl: buildWhatsAppUrl(client.phone, waText),
  };
}

export function buildInitialNailsClients(now = Date.now()) {
  return [
    {
      id: 'n-1',
      name: 'Valeria Betancor',
      phone: '638 877 945',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      treatment: 'Relleno acrílico',
      nailShape: 'Almendra',
      nailColor: 'Baby Boomer',
      nailSize: 'Talla M',
      allergyAlert: 'Cutícula fina y sensible · Usar fresa llama grano extrafino',
      lastVisit: 'Hace 20 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [{ id: 'b-n1', title: 'Bono 4 Rellenos Acrílico VIP', total: 4, used: 2 }],
      treatments: [
        {
          id: 'tn-1',
          name: 'Relleno acrílico',
          formula: 'Forma Almendra · Talla M · Degradado Baby Boomer + Top Coat Glass',
          notes: 'Le encanta brillo espejo duradero y aceite de almendras al terminar.',
          nailShape: 'Almendra',
          nailColor: 'Baby Boomer',
          date: 'Hace 20 días',
          timestamp: now - 20 * DAY_MS,
          price: 35,
          beforePhoto: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=600',
          afterPhoto: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600',
        },
      ],
    },
    {
      id: 'n-2',
      name: 'Lucía Perdomo',
      phone: '628 441 122',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      treatment: 'Uñas acrílicas Talla S',
      nailShape: 'Cuadrada',
      nailColor: 'Milky White',
      nailSize: 'Talla S',
      allergyAlert: 'Sin alergias conocidas · Prefiere lámpara modo Low Heat',
      lastVisit: 'Hace 19 días',
      reliabilityScore: 98,
      noShowCount: 0,
      bonos: [{ id: 'b-n2', title: 'Bono Manicura & Pedicura Spa', total: 5, used: 3 }],
      treatments: [
        {
          id: 'tn-2',
          name: 'Uñas acrílicas Talla S',
          formula: 'Forma Cuadrada suave · Talla S · Milky White Translúcido + Perla',
          notes: 'Acabado limpio estilo Clean Girl. Siempre añade Pedicura Spa.',
          nailShape: 'Cuadrada',
          nailColor: 'Milky White',
          date: 'Hace 19 días',
          timestamp: now - 19 * DAY_MS,
          price: 45,
          beforePhoto: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=600',
          afterPhoto: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&q=80&w=600',
        },
      ],
    },
    {
      id: 'n-3',
      name: 'Camila Cabrera',
      phone: '655 912 308',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300',
      treatment: 'Uñas acrílicas Talla M/L',
      nailShape: 'Coffin / Bailarina',
      nailColor: 'Rojo Burdeos',
      nailSize: 'Talla M/L',
      allergyAlert: 'Sensible al primer con ácido · Usar Primer Sin Ácido HEMA-Free',
      lastVisit: 'Hace 22 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [{ id: 'b-n3', title: 'Club VIP Acrílico Mensual', total: 6, used: 1 }],
      treatments: [
        {
          id: 'tn-3',
          name: 'Uñas acrílicas Talla M/L',
          formula: 'Forma Coffin / Bailarina · Talla L · Rojo Burdeos Intenso + Brillo',
          notes: 'Le encantan tonos oscuros elegantes en otoño/invierno y Glazed Pearl en verano.',
          nailShape: 'Coffin / Bailarina',
          nailColor: 'Rojo Burdeos',
          date: 'Hace 22 días',
          timestamp: now - 22 * DAY_MS,
          price: 50,
        },
      ],
    },
    {
      id: 'n-4',
      name: 'Ainhoa Morales',
      phone: '619 304 881',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=300',
      treatment: 'Manicura semipermanente con refuerzo',
      nailShape: 'Almendra',
      nailColor: 'Glazed Pearl',
      nailSize: 'Natural',
      allergyAlert: 'Ninguna · Base Rubber extrafuerte en índice derecho',
      lastVisit: 'Hace 10 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [],
      treatments: [
        {
          id: 'tn-4',
          name: 'Manicura semipermanente con refuerzo',
          formula: 'Base Rubber Cover Pink + Polvo Glazed Pearl efecto perla nacarada',
          notes: 'Combinó con Higiene facial profunda en la misma tarde.',
          nailShape: 'Almendra',
          nailColor: 'Glazed Pearl',
          date: 'Hace 10 días',
          timestamp: now - 10 * DAY_MS,
          price: 25,
        },
      ],
    },
  ];
}

export function buildInitialPeluqueriaClients(now = Date.now()) {
  return [
    {
      id: 'p-1',
      name: 'Sofía Cabrera',
      phone: '638 877 945',
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=300',
      treatment: 'Mechas Balayage / Babylights + Matiz',
      formulaType: 'color',
      colorFormula: 'Base 7.1 + 8.3 · 20 vol · Matiz 9.21',
      cabinProtocol: 'Cabello fino con porosidad media · Sellar con Olaplex Nº2',
      allergyAlert: 'Cuero cabelludo sensible · Aplicar aceite protector previo al tinte',
      lastVisit: 'Hace 26 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [{ id: 'b-p1', title: 'Bono 4 Brushing & Hidratación Seda', total: 4, used: 2 }],
      treatments: [
        {
          id: 'tp-1',
          name: 'Mechas Balayage / Babylights + Matiz',
          formula: 'Base 7.1 + 8.3 · 20 vol · Matiz 9.21 (15 min) + Ondas editoriales',
          notes: 'Aclaración suave sin amoníaco; le encanta el tono vainilla champagne.',
          date: 'Hace 26 días',
          timestamp: now - 26 * DAY_MS,
          price: 85,
          beforePhoto: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
          afterPhoto: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
        },
      ],
    },
    {
      id: 'p-2',
      name: 'Martina Estévez',
      phone: '645 991 200',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      treatment: 'Higiene Facial Profunda + Ultrasonidos',
      formulaType: 'cabin',
      colorFormula: 'Piel mixta sensible · Vitamina C + Ácido Hialurónico',
      cabinProtocol: 'Ultrasonidos potencia baja · Velo calmante de centella asiática',
      allergyAlert: 'Alergia a perfumes cítricos sintéticos · Usar línea botánica pura',
      lastVisit: 'Hace 24 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [{ id: 'b-p2', title: 'Bono 5 Sesiones Radiofrecuencia Facial', total: 5, used: 2 }],
      treatments: [
        {
          id: 'tp-2',
          name: 'Higiene Facial Profunda + Ultrasonidos',
          formula: 'Piel mixta sensible · Vitamina C + Ácido Hialurónico + Mascarilla Seda',
          notes: 'Piel muy luminosa tras sesión; próxima cita combinar con Radiofrecuencia.',
          date: 'Hace 24 días',
          timestamp: now - 24 * DAY_MS,
          price: 45,
        },
      ],
    },
    {
      id: 'p-3',
      name: 'Elena Domínguez',
      phone: '672 110 495',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
      treatment: 'Color / Tinte de Raíz Orgánico',
      formulaType: 'color',
      colorFormula: 'Base 6.0 + 6.1 (1:1) · 20 vol · 35 min',
      cabinProtocol: 'Cobertura de cana 100% sin amoníaco · Baño de brillo en medios',
      allergyAlert: 'Sin alergias · Prefiere agua templada en lavacabezas',
      lastVisit: 'Hace 29 días',
      reliabilityScore: 96,
      noShowCount: 0,
      bonos: [{ id: 'b-p3', title: 'Club Color Orgánico Mensual', total: 6, used: 4 }],
      treatments: [
        {
          id: 'tp-3',
          name: 'Color / Tinte de Raíz Orgánico',
          formula: 'Base 6.0 + 6.1 · 20 vol · Gloss miel 7.3 en puntas (10 min)',
          notes: 'Retoque riguroso cada 3–4 semanas.',
          date: 'Hace 29 días',
          timestamp: now - 29 * DAY_MS,
          price: 38,
        },
      ],
    },
    {
      id: 'p-4',
      name: 'Claudia Santana',
      phone: '611 584 229',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300',
      treatment: 'Hidratación / Keratina / Botox Capilar',
      formulaType: 'color',
      colorFormula: 'Botox Capilar Seda + Keratina Orgánica · 190°C',
      cabinProtocol: 'Sellado térmico suave + Diseño de Cejas & Lifting de Pestañas',
      allergyAlert: 'Sin alergias conocidas',
      lastVisit: 'Hace 12 días',
      reliabilityScore: 100,
      noShowCount: 0,
      bonos: [],
      treatments: [
        {
          id: 'tp-4',
          name: 'Hidratación / Keratina / Botox Capilar',
          formula: 'Keratina orgánica + Ácido Hialurónico capilar · Brushing liso sedoso',
          notes: 'Se llevó Champú Orgánico Sin Sulfatos para casa.',
          date: 'Hace 12 días',
          timestamp: now - 12 * DAY_MS,
          price: 55,
        },
      ],
    },
  ];
}

function getDemoClientsForSlug(slug) {
  if (slug === 'campodonico-nails') return buildInitialNailsClients();
  if (slug === 'peluqueria-estetica') return buildInitialPeluqueriaClients();
  return []; // New custom salons provisioned in /admin always start clean
}

export function ClientProvider({ children }) {
  const { activeShopSlug, activeVertical, resolvedPin, isPublicRoute, lastSyncTime } = useShop();
  const [clients, setClients] = useState([]);
  const [walkInQueue, setWalkInQueue] = useState([]);
  const [hydratedSlug, setHydratedSlug] = useState(null);

  useEffect(() => {
    if (isPublicRoute) {
      setClients([]);
      setWalkInQueue([]);
      setHydratedSlug(null);
      return;
    }

    const state = loadLocalShopState(activeShopSlug);
    const seedFlagKey = `lumina_beauty_clients_seeded_${activeShopSlug}_v1`;
    let alreadySeeded = false;
    try {
      alreadySeeded = window.localStorage.getItem(seedFlagKey) === '1';
    } catch {
      alreadySeeded = false;
    }

    let resolvedClients = Array.isArray(state.clients) ? state.clients : [];
    if (resolvedClients.length === 0 && !alreadySeeded) {
      const demos = getDemoClientsForSlug(activeShopSlug);
      if (demos.length > 0) {
        resolvedClients = demos;
        saveLocalShopState(activeShopSlug, { clients: resolvedClients });
        try {
          window.localStorage.setItem(seedFlagKey, '1');
        } catch {
          // ignore
        }
      }
    }

    setClients(resolvedClients);
    setWalkInQueue(Array.isArray(state.queue) ? state.queue : []);
    setHydratedSlug(activeShopSlug);
  }, [activeShopSlug, isPublicRoute, lastSyncTime]);

  const persistClients = useCallback(
    (nextClients) => {
      setClients(nextClients);
      saveLocalShopState(activeShopSlug, { clients: nextClients });
    },
    [activeShopSlug]
  );

  const addClient = useCallback(
    (clientData) => {
      const now = Date.now();
      const newClient = {
        ...clientData,
        id: clientData.id || `c-${now}`,
        avatar:
          clientData.avatar ||
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
        lastVisit: clientData.lastVisit || 'Hoy',
        reliabilityScore: clientData.reliabilityScore ?? 100,
        noShowCount: clientData.noShowCount ?? 0,
        bonos: Array.isArray(clientData.bonos) ? clientData.bonos : [],
        treatments: Array.isArray(clientData.treatments) ? clientData.treatments : [],
      };
      const next = [newClient, ...clients];
      persistClients(next);
      dispatchSalonAction(activeShopSlug, resolvedPin, 'upsert_client', { client: newClient });
      return newClient;
    },
    [clients, persistClients, activeShopSlug, resolvedPin]
  );

  const updateClient = useCallback(
    (clientId, patch) => {
      let updatedObj = null;
      const next = clients.map((c) => {
        if (String(c.id) !== String(clientId)) return c;
        updatedObj = { ...c, ...patch };
        return updatedObj;
      });
      persistClients(next);
      if (updatedObj) {
        dispatchSalonAction(activeShopSlug, resolvedPin, 'upsert_client', { client: updatedObj });
      }
      return updatedObj;
    },
    [clients, persistClients, activeShopSlug, resolvedPin]
  );

  const deleteClient = useCallback(
    (clientId) => {
      const next = clients.filter((c) => String(c.id) !== String(clientId));
      persistClients(next);
      dispatchSalonAction(activeShopSlug, resolvedPin, 'delete_client', { clientId });
    },
    [clients, persistClients, activeShopSlug, resolvedPin]
  );

  const addTreatment = useCallback(
    (clientId, treatmentData) => {
      const now = Date.now();
      const entry = {
        ...treatmentData,
        id: treatmentData.id || `t-${now}`,
        date:
          treatmentData.date ||
          new Date(now).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: treatmentData.timestamp || now,
      };
      let updatedObj = null;
      const next = clients.map((c) => {
        if (String(c.id) !== String(clientId)) return c;
        updatedObj = {
          ...c,
          treatment: entry.name || c.treatment,
          nailShape: entry.nailShape || c.nailShape,
          nailColor: entry.nailColor || c.nailColor,
          colorFormula: entry.colorFormula || c.colorFormula,
          lastVisit: 'Hoy',
          treatments: [entry, ...(c.treatments || [])],
        };
        return updatedObj;
      });
      persistClients(next);
      if (updatedObj) {
        dispatchSalonAction(activeShopSlug, resolvedPin, 'upsert_client', { client: updatedObj });
      }
      return entry;
    },
    [clients, persistClients, activeShopSlug, resolvedPin]
  );

  const repeatLastSessionToday = useCallback(
    (clientId) => {
      const target = clients.find((c) => String(c.id) === String(clientId));
      if (!target) return null;
      const last = target.treatments?.[0];
      return addTreatment(clientId, {
        name: last?.name || target.treatment || (activeVertical === 'nails' ? 'Relleno acrílico' : 'Retoque de Color'),
        formula:
          last?.formula ||
          (activeVertical === 'nails'
            ? `${target.nailShape || 'Almendra'} · ${target.nailColor || 'Milky White'}`
            : target.colorFormula || 'Misma fórmula habitual'),
        notes: 'Repetido en 1 toque desde ficha 3D',
        nailShape: target.nailShape,
        nailColor: target.nailColor,
        colorFormula: target.colorFormula,
        price: last?.price || 35,
      });
    },
    [clients, addTreatment, activeVertical]
  );

  const consumeBonoSession = useCallback(
    (clientId, bonoId) => {
      let updatedObj = null;
      const next = clients.map((c) => {
        if (String(c.id) !== String(clientId)) return c;
        const nextBonos = (c.bonos || []).map((b) =>
          b.id === bonoId && b.used < b.total ? { ...b, used: b.used + 1 } : b
        );
        updatedObj = { ...c, bonos: nextBonos };
        return updatedObj;
      });
      persistClients(next);
      if (updatedObj) {
        dispatchSalonAction(activeShopSlug, resolvedPin, 'upsert_client', { client: updatedObj });
      }
    },
    [clients, persistClients, activeShopSlug, resolvedPin]
  );

  const addToWalkInQueue = useCallback(
    (entry) => {
      const item = {
        ...entry,
        id: entry.id || `wq-${Date.now()}`,
        status: 'waiting',
        timeIn:
          entry.timeIn ||
          new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
      };
      const next = [...walkInQueue, item];
      setWalkInQueue(next);
      saveLocalShopState(activeShopSlug, { queue: next });
      dispatchSalonAction(activeShopSlug, resolvedPin, 'add_walkin', item);
      return item;
    },
    [walkInQueue, activeShopSlug, resolvedPin]
  );

  const removeFromWalkInQueue = useCallback(
    (queueId) => {
      const next = walkInQueue.filter((q) => String(q.id) !== String(queueId));
      setWalkInQueue(next);
      saveLocalShopState(activeShopSlug, { queue: next });
      dispatchSalonAction(activeShopSlug, resolvedPin, 'remove_walkin', { queueId });
    },
    [walkInQueue, activeShopSlug, resolvedPin]
  );

  const radarDueClients = useMemo(() => {
    return clients
      .map((c) => ({ client: c, radar: getRetentionRadarAlert(c, activeVertical) }))
      .filter((x) => x.radar.dueNow)
      .sort((a, b) => b.radar.daysSince - a.radar.daysSince);
  }, [clients, activeVertical]);

  const value = useMemo(
    () => ({
      clients,
      walkInQueue,
      hydratedSlug,
      radarDueClients,
      addClient,
      updateClient,
      deleteClient,
      addTreatment,
      repeatLastSessionToday,
      consumeBonoSession,
      addToWalkInQueue,
      removeFromWalkInQueue,
    }),
    [
      clients,
      walkInQueue,
      hydratedSlug,
      radarDueClients,
      addClient,
      updateClient,
      deleteClient,
      addTreatment,
      repeatLastSessionToday,
      consumeBonoSession,
      addToWalkInQueue,
      removeFromWalkInQueue,
    ]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}
