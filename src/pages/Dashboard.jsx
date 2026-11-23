import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Check,
  X,
  MessageCircle,
  Euro,
  ShoppingBag,
  Star,
  Clock,
  Sliders,
  QrCode,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useClients } from '../context/ClientContext';
import VisualAgendaTimeline from '../components/VisualAgendaTimeline';
import {
  RETAIL_COSMETICS,
  buildWhatsAppUrl,
  getShopLocalDateTime,
} from '../lib/shopUtils';
import {
  loadLocalShopState,
  saveLocalShopState,
  dispatchSalonAction,
  calculateHoldExpiration,
  getShopStorageKeys,
} from '../lib/syncService';
import { soundFx } from '../lib/soundFx';

const DAY_LABELS = [
  { id: 1, short: 'Lun', full: 'Lunes' },
  { id: 2, short: 'Mar', full: 'Martes' },
  { id: 3, short: 'Mié', full: 'Miércoles' },
  { id: 4, short: 'Jue', full: 'Jueves' },
  { id: 5, short: 'Vie', full: 'Viernes' },
  { id: 6, short: 'Sáb', full: 'Sábado' },
];

const Dashboard = () => {
  const outlet = useOutletContext() || {};
  const {
    activeShop,
    activeShopSlug,
    activeVertical,
    resolvedPin,
    lastSyncTime,
    updateLocalShopSchedule,
  } = useShop();
  const { clients, walkInQueue, radarDueClients, addToWalkInQueue, removeFromWalkInQueue } = useClients();

  const isNails = activeVertical === 'nails';
  const todayIso = useMemo(() => getShopLocalDateTime(activeShop, new Date()).isoDate, [activeShop]);
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const [appointments, setAppointments] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [commissionRate, setCommissionRate] = useState(50); // 50/50, 60/40, 40/60
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState(false);

  // Quick charge form
  const [chargeForm, setChargeForm] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    specialistName: '',
    productId: '',
    method: 'tarjeta',
  });

  // Walk-in form
  const [walkInName, setWalkInName] = useState('');
  const [walkInService, setWalkInService] = useState('');

  // Schedule editor state
  const [draftSchedule, setDraftSchedule] = useState({
    workDays: [1, 2, 3, 4, 5, 6],
    hoursByDay: {},
  });

  const cosmeticsCatalog = isNails ? RETAIL_COSMETICS.nails : RETAIL_COSMETICS.peluqueria;
  const services = useMemo(() => activeShop?.services || [], [activeShop?.services]);
  const specialists = useMemo(() => activeShop?.barbers || [], [activeShop?.barbers]);

  // Sync defaults when edition/shop changes
  useEffect(() => {
    setChargeForm((prev) => ({
      ...prev,
      serviceId: services[0]?.id || '',
      specialistName: specialists[0]?.name || 'Especialista',
      productId: '',
    }));
    setWalkInService(services[0]?.name || '');
  }, [activeShopSlug, services, specialists]);

  // Load draft schedule from activeShop
  useEffect(() => {
    const sch = activeShop?.schedule || {};
    const hbd = sch.hoursByDay || {};
    const nextHbd = {};
    DAY_LABELS.forEach((d) => {
      const existing = hbd[d.id] || hbd[String(d.id)] || {};
      nextHbd[d.id] = {
        openTime: existing.openTime || sch.openTime || '09:30',
        closeTime: existing.closeTime || sch.closeTime || (d.id === 6 ? '15:00' : '19:30'),
        closed: Boolean(existing.closed),
      };
    });
    setDraftSchedule({
      workDays: Array.isArray(sch.workDays) ? sch.workDays : [1, 2, 3, 4, 5, 6],
      hoursByDay: nextHbd,
    });
  }, [activeShop]);

  // Load appointments, sales, and review queue per tenant
  useEffect(() => {
    const state = loadLocalShopState(activeShopSlug);
    const keys = getShopStorageKeys(activeShopSlug);
    let list = Array.isArray(state.appointments) ? state.appointments : [];
    const seedKey = `lumina_beauty_apts_seeded_${activeShopSlug}_v1`;
    let seeded = false;
    try {
      seeded = localStorage.getItem(seedKey) === '1';
    } catch {
      seeded = false;
    }

    if (list.length === 0 && !seeded) {
      const now = Date.now();
      if (activeShopSlug === 'campodonico-nails') {
        list = [
          {
            id: `apt-nails-1-${now}`,
            shopSlug: activeShopSlug,
            clientName: 'Valeria Betancor',
            clientPhone: '638 877 945',
            barberId: 'nails-master',
            barberName: 'Camila (Uñas & Nail Art)',
            serviceId: 'cn3',
            serviceName: 'Relleno acrílico',
            durationMinutes: 75,
            price: 35,
            date: todayIso,
            timeSlot: '10:30',
            status: 'confirmed',
            createdAt: now,
          },
          {
            id: `apt-nails-2-${now + 1}`,
            shopSlug: activeShopSlug,
            clientName: 'Lucía Perdomo',
            clientPhone: '628 441 122',
            barberId: 'spa-specialist',
            barberName: 'Nadia (Manicura, Pedicura & Facial)',
            serviceId: 'cn6',
            serviceName: 'Pedicura completa & Spa',
            durationMinutes: 60,
            price: 30,
            date: todayIso,
            timeSlot: '12:30',
            status: 'pending',
            createdAt: now,
            holdExpiresAt: calculateHoldExpiration(now, 10),
          },
          {
            id: `apt-nails-3-${now + 2}`,
            shopSlug: activeShopSlug,
            clientName: 'Camila Cabrera',
            clientPhone: '655 912 308',
            barberId: 'nails-master',
            barberName: 'Camila (Uñas & Nail Art)',
            serviceId: 'cn2',
            serviceName: 'Uñas acrílicas Talla M/L',
            durationMinutes: 105,
            price: 50,
            date: todayIso,
            timeSlot: '16:00',
            status: 'confirmed',
            createdAt: now,
          },
        ];
        saveLocalShopState(activeShopSlug, { appointments: list });
        try {
          localStorage.setItem(seedKey, '1');
        } catch {
          // ignore
        }
      } else if (activeShopSlug === 'peluqueria-estetica') {
        list = [
          {
            id: `apt-pelu-1-${now}`,
            shopSlug: activeShopSlug,
            clientName: 'Sofía Cabrera',
            clientPhone: '638 877 945',
            barberId: 'estilista-color',
            barberName: 'Elena (Colorimetría & Balayage)',
            serviceId: 'pe3',
            serviceName: 'Mechas Balayage / Babylights + Matiz',
            durationMinutes: 120,
            price: 85,
            date: todayIso,
            timeSlot: '10:00',
            status: 'confirmed',
            createdAt: now,
          },
          {
            id: `apt-pelu-2-${now + 1}`,
            shopSlug: activeShopSlug,
            clientName: 'Martina Estévez',
            clientPhone: '645 991 200',
            barberId: 'cabina-facial',
            barberName: 'Valeria (Cabina Facial & Mirada)',
            serviceId: 'pe6',
            serviceName: 'Radiofrecuencia Facial',
            durationMinutes: 60,
            price: 50,
            date: todayIso,
            timeSlot: '13:00',
            status: 'pending',
            createdAt: now,
            holdExpiresAt: calculateHoldExpiration(now, 10),
          },
          {
            id: `apt-pelu-3-${now + 2}`,
            shopSlug: activeShopSlug,
            clientName: 'Elena Domínguez',
            clientPhone: '672 110 495',
            barberId: 'estilista-corte',
            barberName: 'Sofía (Corte, Brushing & Keratina)',
            serviceId: 'pe4',
            serviceName: 'Hidratación / Keratina / Botox Capilar',
            durationMinutes: 75,
            price: 55,
            date: todayIso,
            timeSlot: '16:30',
            status: 'confirmed',
            createdAt: now,
          },
        ];
        saveLocalShopState(activeShopSlug, { appointments: list });
        try {
          localStorage.setItem(seedKey, '1');
        } catch {
          // ignore
        }
      }
    }

    setAppointments(list);

    try {
      const rawSales = localStorage.getItem(keys.sales);
      setDailySales(rawSales ? JSON.parse(rawSales) : []);
      const rawReviews = localStorage.getItem(keys.reviews);
      setReviewQueue(rawReviews ? JSON.parse(rawReviews) : []);
    } catch {
      setDailySales([]);
      setReviewQueue([]);
    }
  }, [activeShopSlug, todayIso, lastSyncTime]);

  const persistAppointments = (nextList) => {
    setAppointments(nextList);
    saveLocalShopState(activeShopSlug, { appointments: nextList });
  };

  const handleApproveAppointment = (apt) => {
    soundFx.playSuccess();
    const next = appointments.map((a) =>
      a.id === apt.id ? { ...a, status: 'confirmed', holdExpiresAt: null } : a
    );
    persistAppointments(next);
    dispatchSalonAction(activeShopSlug, resolvedPin, 'approve', { appointmentId: apt.id });
  };

  const handleRejectAppointment = (apt) => {
    soundFx.playAlert();
    const next = appointments.map((a) =>
      a.id === apt.id ? { ...a, status: 'rejected', holdExpiresAt: null } : a
    );
    persistAppointments(next);
    dispatchSalonAction(activeShopSlug, resolvedPin, 'reject', { appointmentId: apt.id });
  };

  const handleAddAppointment = (payload) => {
    const created = {
      ...payload,
      id: `apt-man-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      shopSlug: activeShopSlug,
      createdAt: Date.now(),
    };
    persistAppointments([...appointments, created]);
    dispatchSalonAction(activeShopSlug, resolvedPin, 'add_appointment', created);
  };

  const handleRescheduleAppointment = (aptId, patch) => {
    const next = appointments.map((a) => (a.id === aptId ? { ...a, ...patch } : a));
    persistAppointments(next);
    dispatchSalonAction(activeShopSlug, resolvedPin, 'reschedule', { appointmentId: aptId, ...patch });
  };

  const handleDeleteAppointment = (aptId) => {
    persistAppointments(appointments.filter((a) => a.id !== aptId));
    dispatchSalonAction(activeShopSlug, resolvedPin, 'delete_appointment', { appointmentId: aptId });
  };

  const handleRegisterSale = (e) => {
    e.preventDefault();
    const svc = services.find((s) => s.id === chargeForm.serviceId) || services[0];
    const prod = cosmeticsCatalog.find((p) => p.id === chargeForm.productId);
    const now = Date.now();
    const sale = {
      id: `sale-${now}`,
      clientName: chargeForm.clientName.trim() || 'Clienta en Salón',
      clientPhone: chargeForm.clientPhone.trim(),
      serviceName: svc?.name || 'Tratamiento',
      amount: Number(svc?.price) || 35,
      productName: prod?.name || '',
      productAmount: prod ? Number(prod.price) : 0,
      specialist: chargeForm.specialistName || specialists[0]?.name || 'Especialista',
      method: chargeForm.method,
      timestamp: now,
    };

    const nextSales = [sale, ...dailySales];
    setDailySales(nextSales);
    const keys = getShopStorageKeys(activeShopSlug);
    try {
      localStorage.setItem(keys.sales, JSON.stringify(nextSales));
    } catch {
      // ignore
    }

    // Programar recordatorio automático de Reseña Google 5⭐ a los 30 minutos
    const reviewItem = {
      id: `rev-${now}`,
      clientName: sale.clientName,
      clientPhone: sale.clientPhone || activeShop?.phone || '638877945',
      serviceName: sale.serviceName,
      createdAt: now,
      sendAfter: now + 30 * 60 * 1000, // 30 minutos
    };
    const nextReviews = [reviewItem, ...reviewQueue].slice(0, 8);
    setReviewQueue(nextReviews);
    try {
      localStorage.setItem(keys.reviews, JSON.stringify(nextReviews));
    } catch {
      // ignore
    }

    soundFx.playSuccess();
    setChargeForm((prev) => ({ ...prev, clientName: '', clientPhone: '', productId: '' }));
  };

  const handleRemoveReview = (id) => {
    const next = reviewQueue.filter((r) => r.id !== id);
    setReviewQueue(next);
    const keys = getShopStorageKeys(activeShopSlug);
    try {
      localStorage.setItem(keys.reviews, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleSaveSchedule = () => {
    soundFx.playSuccess();
    const workDays = DAY_LABELS.filter((d) => !draftSchedule.hoursByDay[d.id]?.closed).map((d) => d.id);
    const nextSch = {
      ...(activeShop?.schedule || {}),
      workDays,
      daysOpen: workDays,
      hoursByDay: draftSchedule.hoursByDay,
    };
    updateLocalShopSchedule(nextSch);
    dispatchSalonAction(activeShopSlug, resolvedPin, 'update_shop_schedule', { schedule: nextSch });
    setScheduleSavedMsg(true);
    setTimeout(() => setScheduleSavedMsg(false), 2200);
  };

  const handleAddWalkIn = (e) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    soundFx.playSuccess();
    addToWalkInQueue({
      name: walkInName.trim(),
      service: walkInService || services[0]?.name || 'Servicio Express',
      barber: specialists[0]?.name || 'Especialista',
    });
    setWalkInName('');
  };

  // Cash Close + Team Commissions Calculation (50/50, 60/40, 40/60 + 20% retail bonus)
  const cashierSummary = useMemo(() => {
    let totalServices = 0;
    let totalProducts = 0;
    let cashTotal = 0;
    let cardBizumTotal = 0;
    const bySpecialist = {};

    specialists.forEach((sp) => {
      bySpecialist[sp.name] = { count: 0, servicesRev: 0, productsRev: 0 };
    });

    dailySales.forEach((s) => {
      const srv = Number(s.amount) || 0;
      const prd = Number(s.productAmount) || 0;
      totalServices += srv;
      totalProducts += prd;
      if (s.method === 'efectivo') cashTotal += srv + prd;
      else cardBizumTotal += srv + prd;

      const spName = s.specialist || specialists[0]?.name || 'Especialista';
      if (!bySpecialist[spName]) bySpecialist[spName] = { count: 0, servicesRev: 0, productsRev: 0 };
      bySpecialist[spName].count += 1;
      bySpecialist[spName].servicesRev += srv;
      bySpecialist[spName].productsRev += prd;
    });

    const rows = Object.entries(bySpecialist).map(([name, d]) => {
      const teamShare = Math.round((d.servicesRev * commissionRate) / 100);
      const retailBonus = Math.round(d.productsRev * 0.2);
      const payout = teamShare + retailBonus;
      const salonNet = d.servicesRev + d.productsRev - payout;
      return { name, count: d.count, total: d.servicesRev + d.productsRev, payout, salonNet };
    });

    return {
      grandTotal: totalServices + totalProducts,
      totalServices,
      totalProducts,
      cashTotal,
      cardBizumTotal,
      rows,
    };
  }, [dailySales, commissionRate, specialists]);

  const pendingQr = useMemo(
    () => appointments.filter((a) => a.status === 'pending'),
    [appointments]
  );

  const todayCount = useMemo(
    () =>
      appointments.filter(
        (a) => a.date === selectedDate && !a.isBlock && a.status !== 'rejected' && a.status !== 'expired'
      ).length,
    [appointments, selectedDate]
  );

  return (
    <div className="space-y-6">
      {/* Cabecera Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C59B5F]">
            <Sparkles size={13} />
            {isNails ? 'Edición Uñas, Manicura & Pedicura' : 'Edición Peluquería & Estética (Sin Uñas)'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A201D] leading-tight mt-0.5">
            {activeShop?.name || 'LUMINA BEAUTY'}
          </h2>
          <p className="text-xs text-[#6E5A54] mt-1">
            {activeShop?.address} · Tel. {activeShop?.phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsScheduleOpen((v) => !v);
            }}
            className="btn-silk cursor-pointer"
          >
            <Sliders size={14} className="text-[#C87A72]" />
            <span>Horarios L–S</span>
          </button>

          <button
            type="button"
            onClick={() => outlet.openQRPoster?.()}
            className="btn-editorial cursor-pointer"
          >
            <QrCode size={15} />
            <span>Mi Cartel QR</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="pearl-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A847D]">Citas Hoy</p>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2A201D] mt-1">{todayCount}</p>
          <p className="text-[11px] text-[#6E5A54] mt-0.5">{pendingQr.length} pendientes QR</p>
        </div>

        <div className="pearl-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A847D]">Caja Hoy</p>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#B86566] mt-1">
            {cashierSummary.grandTotal}€
          </p>
          <p className="text-[11px] text-[#6E5A54] mt-0.5">
            Cosmética: {cashierSummary.totalProducts}€
          </p>
        </div>

        <div className="pearl-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A847D]">Clientas 3D</p>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2A201D] mt-1">{clients.length}</p>
          <Link to="/clients" className="text-[11px] font-bold text-[#C87A72] hover:underline mt-0.5 inline-block">
            Abrir directorio →
          </Link>
        </div>

        <div className="pearl-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A847D]">
            {isNails ? 'Radar Relleno' : 'Radar Retoque'}
          </p>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#C59B5F] mt-1">
            {radarDueClients.length}
          </p>
          <p className="text-[11px] text-[#6E5A54] mt-0.5">
            {isNails ? 'Ciclo 18–21 días' : 'Ciclo 21–28 días'}
          </p>
        </div>
      </div>

      {/* Editor Táctil de Horarios Lunes–Sábado */}
      {isScheduleOpen && (
        <div className="pearl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#2A201D]">Horario del Salón (Lunes – Sábado)</h3>
              <p className="text-xs text-[#6E5A54]">Los cambios actualizan al instante el Portal Público QR</p>
            </div>
            <button
              type="button"
              onClick={handleSaveSchedule}
              className="btn-editorial cursor-pointer"
            >
              <Check size={15} />
              <span>{scheduleSavedMsg ? '¡Guardado!' : 'Guardar Horario'}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DAY_LABELS.map((d) => {
              const cfg = draftSchedule.hoursByDay[d.id] || { openTime: '09:30', closeTime: '19:30', closed: false };
              return (
                <div key={d.id} className="p-3 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2A201D]">{d.full}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSchedule((prev) => ({
                          ...prev,
                          hoursByDay: {
                            ...prev.hoursByDay,
                            [d.id]: { ...cfg, closed: !cfg.closed },
                          },
                        }))
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        cfg.closed ? 'bg-[#FDECEB] text-[#9E3836]' : 'bg-[#EDF5F0] text-[#366852]'
                      }`}
                    >
                      {cfg.closed ? 'Cerrado' : 'Abierto'}
                    </button>
                  </div>
                  {!cfg.closed && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={cfg.openTime}
                        onChange={(e) =>
                          setDraftSchedule((prev) => ({
                            ...prev,
                            hoursByDay: { ...prev.hoursByDay, [d.id]: { ...cfg, openTime: e.target.value } },
                          }))
                        }
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#E9D9CF] text-xs font-mono"
                      />
                      <input
                        type="time"
                        value={cfg.closeTime}
                        onChange={(e) =>
                          setDraftSchedule((prev) => ({
                            ...prev,
                            hoursByDay: { ...prev.hoursByDay, [d.id]: { ...cfg, closeTime: e.target.value } },
                          }))
                        }
                        className="px-2 py-1.5 rounded-lg bg-white border border-[#E9D9CF] text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bandeja 1-Toque de Reservas QR Pendientes */}
      {pendingQr.length > 0 && (
        <div className="pearl-card p-4 sm:p-5 border-[#DFC79C] bg-[#FFFDF8]/92">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
              <Clock size={17} className="text-[#C59B5F]" />
              <span>Solicitudes QR por Aprobar ({pendingQr.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingQr.map((apt) => {
              const confirmWa = buildWhatsAppUrl(
                apt.clientPhone,
                `¡Hola ${apt.clientName}! ✨ Tu cita en ${activeShop?.name} para ${apt.serviceName} el ${apt.date} a las ${apt.timeSlot} está CONFIRMADA. ¡Te esperamos!`
              );
              return (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#2A201D]">{apt.clientName}</span>
                      <span className="text-xs font-mono font-bold text-[#9E4E4D]">
                        {apt.date} · {apt.timeSlot}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E5A54] mt-0.5">
                      {apt.serviceName} ({apt.durationMinutes || 60} min)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveAppointment(apt)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#5C8A74] hover:bg-[#4C7863] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Aceptar</span>
                    </button>
                    <a
                      href={confirmWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-white border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle size={14} />
                      <span>WA</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRejectAppointment(apt)}
                      className="py-2 px-2.5 rounded-xl bg-[#FDECEB] text-[#9E3836] border border-[#E8B2AE] text-xs font-bold cursor-pointer"
                      aria-label="Rechazar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda Visual Táctil Booksy-Style */}
      <VisualAgendaTimeline
        appointments={appointments}
        services={services}
        specialists={specialists}
        schedule={activeShop?.schedule}
        selectedDate={selectedDate}
        onChangeDate={setSelectedDate}
        onAddAppointment={handleAddAppointment}
        onRescheduleAppointment={handleRescheduleAppointment}
        onDeleteAppointment={handleDeleteAppointment}
      />

      {/* Cierre de Caja + Comisiones del Equipo + Cosmética + Recordatorio Reseñas 5⭐ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cobro Rápido + Venta de Cosmética */}
        <div className="pearl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
              <Euro size={18} className="text-[#C87A72]" />
              <span>Caja, Comisiones &amp; Cosmética</span>
            </h3>
            <div className="flex items-center gap-1 bg-[#FAF4EE] p-1 rounded-xl border border-[#E9D9CF]">
              {[
                { rate: 50, label: '50/50' },
                { rate: 60, label: '60/40' },
                { rate: 40, label: '40/60' },
              ].map((opt) => (
                <button
                  key={opt.rate}
                  type="button"
                  onClick={() => setCommissionRate(opt.rate)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    commissionRate === opt.rate
                      ? 'bg-[#C87A72] text-white'
                      : 'text-[#6E5A54] hover:text-[#2A201D]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegisterSale} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={chargeForm.clientName}
                onChange={(e) => setChargeForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Nombre clienta"
                className="px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              />
              <input
                type="tel"
                value={chargeForm.clientPhone}
                onChange={(e) => setChargeForm((f) => ({ ...f, clientPhone: e.target.value }))}
                placeholder="Móvil (para reseña 5⭐)"
                className="px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={chargeForm.serviceId}
                onChange={(e) => setChargeForm((f) => ({ ...f, serviceId: e.target.value }))}
                className="px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price}€)
                  </option>
                ))}
              </select>

              <select
                value={chargeForm.specialistName}
                onChange={(e) => setChargeForm((f) => ({ ...f, specialistName: e.target.value }))}
                className="px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              >
                {specialists.map((sp) => (
                  <option key={sp.id} value={sp.name}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={chargeForm.productId}
                onChange={(e) => setChargeForm((f) => ({ ...f, productId: e.target.value }))}
                className="px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              >
                <option value="">+ Cosmética en {isNails ? 'mesa' : 'tocador'} (opcional)</option>
                {cosmeticsCatalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (+{c.price}€)
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-1">
                {['tarjeta', 'efectivo', 'bizum'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChargeForm((f) => ({ ...f, method: m }))}
                    className={`py-2 rounded-xl text-[11px] font-bold uppercase border cursor-pointer ${
                      chargeForm.method === m
                        ? 'bg-[#F7EAE7] border-[#C87A72] text-[#8E4742]'
                        : 'bg-white border-[#E9D9CF] text-[#6E5A54]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-editorial w-full py-2.5 cursor-pointer">
              <ShoppingBag size={15} />
              <span>Cobrar Servicio &amp; Programar Reseña 5⭐</span>
            </button>
          </form>

          {/* Reparto de Comisiones */}
          <div className="pt-3 border-t border-[#EFE3DB] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6E5A54]">
              <span>Efectivo: <strong className="text-[#2A201D]">{cashierSummary.cashTotal}€</strong></span>
              <span>Tarjeta/Bizum: <strong className="text-[#2A201D]">{cashierSummary.cardBizumTotal}€</strong></span>
            </div>
            {cashierSummary.rows.map((r) => (
              <div
                key={r.name}
                className="px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-[#2A201D] truncate block">{r.name.split('(')[0]}</span>
                  <span className="text-[10px] text-[#6E5A54]">{r.count} servicios · {r.total}€ bruto</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-[#8E4742] block">Equipo: {r.payout}€</span>
                  <span className="text-[10px] text-[#5C8A74]">Salón: {r.salonNet}€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Radar de Relleno/Retoque + Reseñas Google 5⭐ + Lista Express */}
        <div className="space-y-5">
          {/* Recordatorio Reseñas Google 5⭐ a los 30 min */}
          <div className="pearl-card p-5 space-y-3">
            <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
              <Star size={17} className="text-[#C59B5F] fill-[#C59B5F]" />
              <span>Reseñas Google 5⭐ (Recordatorio 30m)</span>
            </h3>
            {reviewQueue.length === 0 ? (
              <p className="text-xs text-[#6E5A54]">
                Al cobrar un servicio, aparecerá aquí el envío de WhatsApp programado a los 30 min con tu enlace de reseñas Google.
              </p>
            ) : (
              <div className="space-y-2">
                {reviewQueue.slice(0, 3).map((entry) => {
                  const reviewUrl = activeShop?.googleReviewUrl || 'https://g.page/r/';
                  const waLink = buildWhatsAppUrl(
                    entry.clientPhone,
                    `¡Hola ${entry.clientName}! ✨ Gracias por tu visita hoy en ${activeShop?.name}. Si te ha encantado tu ${entry.serviceName}, nos haría muchísima ilusión tu reseña 5⭐ aquí: ${reviewUrl}`
                  );
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2A201D] truncate">{entry.clientName}</p>
                        <p className="text-[11px] text-[#6E5A54] truncate">{entry.serviceName} · 30m</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#EDF5F0] text-[#2B5944] border border-[#BDD8C9] text-[11px] font-bold flex items-center gap-1"
                        >
                          <MessageCircle size={12} /> Enviar 5⭐
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveReview(entry.id)}
                          className="p-1.5 rounded-lg text-[#9A847D] hover:text-[#9E3836] cursor-pointer"
                          aria-label="Descartar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Radar de Relleno / Retoque con WhatsApp Directo */}
          <div className="pearl-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
                <Users size={17} className="text-[#C87A72]" />
                <span>{isNails ? 'Radar de Relleno (18–21 días)' : 'Radar de Retoque (21–28 días)'}</span>
              </h3>
              <Link to="/clients" className="text-xs font-bold text-[#B86566] hover:underline">
                Ver todas
              </Link>
            </div>
            {radarDueClients.length === 0 ? (
              <p className="text-xs text-[#6E5A54]">Todas tus clientas están al día ✨</p>
            ) : (
              <div className="space-y-2">
                {radarDueClients.slice(0, 4).map(({ client, radar }) => (
                  <div
                    key={client.id}
                    className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2A201D] truncate">{client.name}</p>
                      <p className="text-[11px] text-[#8E4742] truncate">
                        {radar.label} · {isNails ? `${client.nailShape} (${client.nailColor})` : client.treatment}
                      </p>
                    </div>
                    <a
                      href={radar.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#EDF5F0] hover:bg-[#DFF0E6] border border-[#BDD8C9] text-[#2B5944] text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <MessageCircle size={13} />
                      <span>Avisar</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista Express Sin Cita */}
          <div className="pearl-card p-5 space-y-3">
            <h3 className="text-lg font-serif font-bold text-[#2A201D]">Lista Express Hoy ({walkInQueue.length})</h3>
            <form onSubmit={handleAddWalkIn} className="flex gap-2">
              <input
                type="text"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Clienta sin cita..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
              />
              <button type="submit" className="btn-editorial !py-2 !px-3 cursor-pointer shrink-0">
                <Plus size={14} /> Añadir
              </button>
            </form>
            {walkInQueue.length > 0 && (
              <div className="space-y-1.5">
                {walkInQueue.map((q) => (
                  <div
                    key={q.id}
                    className="px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#2A201D] truncate">
                      {q.name} <span className="font-normal text-[#6E5A54]">· {q.service}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromWalkInQueue(q.id)}
                      className="text-[11px] font-bold text-[#5C8A74] hover:underline shrink-0 ml-2 cursor-pointer"
                    >
                      Atender ✓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
