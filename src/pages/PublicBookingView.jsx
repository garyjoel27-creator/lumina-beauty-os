import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Phone,
  AtSign,
  CheckCircle2,
  MessageCircle,
  User,
  AlertCircle,
  ShieldCheck,
  CalendarPlus,
  Bookmark,
  Copy,
  Check,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import LegalComplianceModal from '../components/LegalComplianceModal';
import {
  buildCustomerPortalUrl,
  buildWhatsAppUrl,
  clearPublicClientProfile,
  downloadAppointmentIcs,
  getShopLocalDateTime,
  getShopVertical,
  loadSavedPublicClientProfile,
  normalizeShopSlug,
  savePublicClientProfile,
} from '../lib/shopUtils';

const CATEGORY_LABELS = {
  all: 'Todos',
  acrilico: 'Uñas Acrílicas',
  manicura: 'Manicura',
  pedicura: 'Pedicura & Spa',
  retiro: 'Retiros / Reparación',
  facial: 'Cabina Facial',
  peluqueria: 'Peluquería',
  corporal: 'Corporal',
  mirada: 'Cejas & Pestañas',
};

function getNextOpenDates(shop, nowMs, count = 10) {
  const openDays = shop?.schedule?.workDays || [1, 2, 3, 4, 5, 6];
  const localNow = getShopLocalDateTime(shop, new Date(nowMs));
  const [y, m, d] = localNow.isoDate.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const list = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 0; i < 21 && list.length < count; i++) {
    const dt = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const dow = dt.getUTCDay();
    const hbd = shop?.schedule?.hoursByDay?.[dow] || shop?.schedule?.hoursByDay?.[String(dow)] || {};
    if (hbd.closed || !openDays.includes(dow)) continue;
    const iso = dt.toISOString().split('T')[0];
    list.push({
      iso,
      label: i === 0 ? 'Hoy' : dayNames[dow],
      dayNum: dt.getUTCDate(),
      month: monthNames[dt.getUTCMonth()],
    });
  }
  return list;
}

function toMins(t = '09:30') {
  const [h, m] = String(t).split(':').map(Number);
  return isNaN(h) || isNaN(m) ? 570 : h * 60 + m;
}

const PublicBookingView = () => {
  const { shopSlug: routeSlug } = useParams();
  const { activeShop, activeShopSlug, isPaused } = useShop();

  const slug = normalizeShopSlug(routeSlug || activeShopSlug) || 'campodonico-nails';
  const [remoteShop, setRemoteShop] = useState(null);
  const [busyIntervals, setBusyIntervals] = useState([]);
  const [queueInfo, setQueueInfo] = useState({ count: 0, waitMinutes: 0 });
  const [pausedRemote, setPausedRemote] = useState(false);

  const shop = remoteShop || activeShop;
  const vertical = getShopVertical(shop, slug);
  const isNails = vertical === 'nails';
  const walkInAllowed = shop?.walkInOpen !== false;
  const [nowMs] = useState(() => Date.now());

  const services = useMemo(() => shop?.services || [], [shop?.services]);
  const specialists = useMemo(() => shop?.barbers || [], [shop?.barbers]);
  const upcomingDates = useMemo(() => getNextOpenDates(shop, nowMs, 10), [shop, nowMs]);

  const [bookingMode, setBookingMode] = useState('appointment'); // appointment | walkin
  const effectiveBookingMode = walkInAllowed ? bookingMode : 'appointment';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('any');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [savedProfile, setSavedProfile] = useState(() => loadSavedPublicClientProfile(slug));
  const [clientName, setClientName] = useState(() => savedProfile?.clientName || '');
  const [clientPhone, setClientPhone] = useState(() => savedProfile?.clientPhone || '');
  const [notes, setNotes] = useState('');
  // RGPD 1st-Layer Consent — BOTH UNCHECKED BY DEFAULT
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedWhatsapp, setAcceptedWhatsapp] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  const portalUrl = useMemo(() => buildCustomerPortalUrl('', slug), [slug]);

  useEffect(() => {
    const profile = loadSavedPublicClientProfile(slug);
    setSavedProfile(profile);
    if (profile?.clientName) setClientName(profile.clientName);
    if (profile?.clientPhone) setClientPhone(profile.clientPhone);
  }, [slug]);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleResetSavedProfile = () => {
    clearPublicClientProfile(slug);
    setSavedProfile(null);
    setClientName('');
    setClientPhone('');
  };

  const handleCopyPortalLink = async () => {
    try {
      await navigator.clipboard?.writeText(portalUrl);
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 2500);
    } catch {
      setCopiedPortalLink(true);
      setTimeout(() => setCopiedPortalLink(false), 2500);
    }
  };

  const handleTriggerInstall = async () => {
    if (!installPromptEvent) return;
    try {
      await installPromptEvent.prompt();
      setInstallPromptEvent(null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (services.length > 0 && !services.some((s) => s.id === selectedServiceId)) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (upcomingDates.length > 0 && !upcomingDates.some((d) => d.iso === selectedDate)) {
      setSelectedDate(upcomingDates[0].iso);
    }
  }, [upcomingDates, selectedDate]);

  // Fetch public-state ONLY (NEVER calls /sync — 100% isolated!)
  useEffect(() => {
    if (!slug || !selectedDate) return;
    let cancelled = false;
    fetch(`/api/shops/${encodeURIComponent(slug)}/public-state?date=${encodeURIComponent(selectedDate)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        return { ok: res.ok, status: res.status, data };
      })
      .then(({ ok, status, data }) => {
        if (cancelled) return;
        if (status === 403 && data?.paused) {
          setPausedRemote(true);
          if (data.shop) setRemoteShop(data.shop);
          return;
        }
        if (ok && data?.success) {
          setPausedRemote(false);
          if (data.shop) setRemoteShop(data.shop);
          setBusyIntervals(Array.isArray(data.busyIntervals) ? data.busyIntervals : []);
          if (data.queue) setQueueInfo(data.queue);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, selectedDate]);

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );

  // Compute exact available time slots respecting multi-hour service durations (e.g., 90m, 105m, 120m)
  // and per-specialist concurrency (matching backend booking.js)
  const slots = useMemo(() => {
    if (!selectedDate || !shop) return [];
    const parts = selectedDate.split('-').map(Number);
    const dow = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
    const hbd = shop.schedule?.hoursByDay?.[dow] || shop.schedule?.hoursByDay?.[String(dow)] || {};
    if (hbd.closed) return [];

    const openM = toMins(hbd.openTime || shop.schedule?.openTime || '09:30');
    const closeM = toMins(hbd.closeTime || shop.schedule?.closeTime || '19:30');
    const step = Number(shop.schedule?.slotMinutes || 30);
    const dur = Number(selectedService?.durationMinutes) || 60;
    const localNow = getShopLocalDateTime(shop, new Date(nowMs));
    const spList = specialists.length > 0 ? specialists : [{ id: 's1' }];

    const overlaps = (b, m, slotEnd) => {
      const bStart = toMins(b.start);
      const bEnd = bStart + (Number(b.durationMinutes) || 30);
      return m < bEnd && slotEnd > bStart;
    };

    const arr = [];
    for (let m = openM; m + dur <= closeM; m += step) {
      const hStr = String(Math.floor(m / 60)).padStart(2, '0');
      const mStr = String(m % 60).padStart(2, '0');
      const time = `${hStr}:${mStr}`;
      const isPast = selectedDate === localNow.isoDate && m <= localNow.totalMinutes;
      const slotEnd = m + dur;

      let collides = false;
      if (selectedBarberId !== 'any' || spList.length <= 1) {
        collides = busyIntervals.some((b) => {
          if (selectedBarberId !== 'any' && b.barberId && b.barberId !== 'any' && b.barberId !== selectedBarberId) {
            return false;
          }
          return overlaps(b, m, slotEnd);
        });
      } else {
        const hasGlobalBlock = busyIntervals.some(
          (b) => (!b.barberId || b.barberId === 'any') && overlaps(b, m, slotEnd)
        );
        if (hasGlobalBlock) {
          collides = true;
        } else {
          const anyFreeSpecialist = spList.some(
            (sp) => !busyIntervals.some((b) => b.barberId === sp.id && overlaps(b, m, slotEnd))
          );
          collides = !anyFreeSpecialist;
        }
      }

      arr.push({ time, available: !isPast && !collides });
    }
    return arr;
  }, [selectedDate, shop, selectedService, busyIntervals, selectedBarberId, specialists, nowMs]);

  useEffect(() => {
    const valid = slots.find((s) => s.time === selectedSlot && s.available);
    if (!valid) {
      const first = slots.find((s) => s.available);
      setSelectedSlot(first ? first.time : '');
    }
  }, [slots, selectedSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg('Por favor indica tu nombre y teléfono WhatsApp.');
      return;
    }
    if (effectiveBookingMode === 'appointment' && !selectedSlot) {
      setErrorMsg('Selecciona una hora disponible para tu tratamiento.');
      return;
    }
    if (!acceptedPrivacy) {
      setErrorMsg('Debes aceptar la política de privacidad para reservar.');
      return;
    }

    setSubmitting(true);
    try {
      const spObj = specialists.find((b) => b.id === selectedBarberId);
      const res = await fetch(`/api/shops/${encodeURIComponent(slug)}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: effectiveBookingMode,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          serviceId: selectedService?.id,
          serviceName: selectedService?.name,
          durationMinutes: selectedService?.durationMinutes,
          price: selectedService?.price,
          barberId: selectedBarberId,
          barberName: selectedBarberId !== 'any' ? spObj?.name || '' : '',
          date: selectedDate,
          timeSlot: selectedSlot,
          notes: notes.trim(),
          rgpdConsent: {
            acceptedPrivacy: true,
            acceptedWhatsapp: Boolean(acceptedWhatsapp),
            acceptedAt: new Date().toISOString(),
            policyVersion: '2026.1',
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.message || 'No pudimos completar la reserva. Prueba otro horario.');
      } else {
        const nextSaved = {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          lastServiceId: selectedService?.id || '',
          lastServiceName: selectedService?.name || '',
        };
        savePublicClientProfile(slug, nextSaved);
        setSavedProfile(nextSaved);
        setConfirmation({
          mode: effectiveBookingMode,
          serviceName: selectedService?.name,
          durationMinutes: Number(selectedService?.durationMinutes) || 60,
          date: selectedDate,
          timeSlot: selectedSlot,
          specialist: data?.appointment?.barberName || spObj?.name || 'Especialista disponible',
          message: data.message,
          position: data.position,
        });
      }
    } catch {
      const nextSaved = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        lastServiceId: selectedService?.id || '',
        lastServiceName: selectedService?.name || '',
      };
      savePublicClientProfile(slug, nextSaved);
      setSavedProfile(nextSaved);
      // Offline graceful confirmation
      setConfirmation({
        mode: effectiveBookingMode,
        serviceName: selectedService?.name,
        durationMinutes: Number(selectedService?.durationMinutes) || 60,
        date: selectedDate,
        timeSlot: selectedSlot,
        specialist: 'Equipo del Salón',
        message: 'Solicitud lista. Confírmala también por WhatsApp con el salón.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isPaused || pausedRemote) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF6F2] text-[#2A201D] flex items-center justify-center p-5">
        <div className="max-w-md w-full pearl-card p-8 text-center">
          <Sparkles size={28} className="text-[#C59B5F] mx-auto" />
          <h1 className="text-3xl font-serif font-bold mt-3">{shop?.name || 'Salón en Pausa'}</h1>
          <p className="text-sm text-[#6E5A54] mt-2">
            Las reservas online están temporalmente pausadas. Contáctanos directamente por teléfono o WhatsApp.
          </p>
          {shop?.phone && (
            <a
              href={buildWhatsAppUrl(shop.phone, 'Hola, me gustaría consultar disponibilidad de cita ✨')}
              className="btn-editorial mt-5"
            >
              <MessageCircle size={16} /> Escribir al salón
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF6F2] text-[#2A201D] relative overflow-x-hidden pb-14">
      {/* Banner Editorial Luminoso */}
      <div className="relative h-52 sm:h-64 overflow-hidden border-b border-[#E9D9CF]">
        <img
          src={
            isNails
              ? 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=85&w=1600'
              : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=85&w=1600'
          }
          alt={shop?.name || 'Atelier Beauty'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F2] via-[#FAF6F2]/65 to-[#FAF6F2]/30" />
        <div className="absolute inset-x-0 bottom-4 max-w-2xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E9D9CF] text-[10px] font-bold uppercase tracking-[0.22em] text-[#B86566]">
            <Sparkles size={11} />
            {isNails ? 'Atelier de Uñas & Spa' : 'Peluquería & Estética'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A201D] mt-2 leading-tight">
            {shop?.name || 'LUMINA BEAUTY'}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#6E5A54] mt-1.5">
            {shop?.address && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#C87A72]" /> {shop.address}
              </span>
            )}
            {shop?.phone && (
              <span className="flex items-center gap-1 font-semibold">
                <Phone size={12} className="text-[#C59B5F]" /> {shop.phone}
              </span>
            )}
            {shop?.instagramSalon && (
              <span className="flex items-center gap-1 text-[#B86566] font-semibold">
                <AtSign size={12} /> {shop.instagramSalon}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-5">
        {confirmation ? (
          <div className="pearl-card p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EDF5F0] text-[#5C8A74] flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#2A201D]">¡Solicitud Enviada!</h2>
            <p className="text-sm text-[#6E5A54]">{confirmation.message}</p>

            <div className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] text-left space-y-1.5 text-xs">
              <p><strong>Tratamiento:</strong> {confirmation.serviceName}</p>
              {confirmation.mode === 'appointment' ? (
                <p><strong>Cita:</strong> {confirmation.date} a las {confirmation.timeSlot}</p>
              ) : (
                <p><strong>Turno Express:</strong> Posición #{confirmation.position || 1}</p>
              )}
              <p><strong>Especialista:</strong> {confirmation.specialist}</p>
            </div>

            {shop?.phone && (
              <a
                href={buildWhatsAppUrl(
                  shop.phone,
                  `Hola ${shop.name} ✨ Acabo de reservar ${confirmation.serviceName} (${confirmation.date} ${confirmation.timeSlot || 'Turno Hoy'}). Mi nombre es ${clientName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial w-full py-3"
              >
                <MessageCircle size={16} /> Confirmar por WhatsApp
              </a>
            )}

            {/* Kit "No Pierdas Tu Acceso" para futuras reservas */}
            <div
              data-testid="repeat-booking-kit"
              className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] text-left space-y-2.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#B86566] flex items-center gap-1.5">
                <Bookmark size={13} />
                <span>Guarda tu cita y tu enlace para repetir sin QR</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {confirmation.mode === 'appointment' && (
                  <button
                    type="button"
                    data-testid="download-ics-btn"
                    onClick={() =>
                      downloadAppointmentIcs(
                        {
                          title: `${confirmation.serviceName} · ${shop?.name || 'Salón'}`,
                          description: `Especialista: ${confirmation.specialist}`,
                          location: shop?.address || '',
                          date: confirmation.date,
                          timeSlot: confirmation.timeSlot,
                          durationMinutes: confirmation.durationMinutes || 60,
                          bookingUrl: portalUrl,
                        },
                        `cita-${slug}-${confirmation.date}.ics`
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#F7EAE7] border border-[#E9D9CF] text-xs font-bold text-[#2A201D] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CalendarPlus size={15} className="text-[#C87A72]" />
                    <span>Guardar en mi Calendario</span>
                  </button>
                )}

                <a
                  data-testid="save-link-wa-btn"
                  href={buildWhatsAppUrl(
                    '',
                    `✨ Mi enlace directo para reservar cita en ${shop?.name || 'el salón'} sin QR:\n${portalUrl}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#EDF5F0] border border-[#D4E4DA] text-xs font-bold text-[#2A201D] flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle size={15} className="text-[#5C8A74]" />
                  <span>Guardarme enlace en WhatsApp</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyPortalLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E9D9CF] text-[11px] font-bold text-[#4A3934] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPortalLink ? <Check size={13} className="text-[#5C8A74]" /> : <Copy size={13} />}
                  <span>{copiedPortalLink ? '¡Enlace copiado!' : 'Copiar enlace de reservas'}</span>
                </button>

                {installPromptEvent && (
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#C87A72] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone size={13} />
                    <span>Instalar en mi móvil</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#6E5A54] leading-snug">
                💡 <strong>Truco:</strong> En tu móvil toca <em>Compartir → Añadir a pantalla de inicio</em> y tendrás el icono de {shop?.name || 'este salón'} siempre a mano.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setAcceptedPrivacy(false);
                setAcceptedWhatsapp(false);
              }}
              className="text-xs font-bold text-[#6E5A54] hover:text-[#2A201D] cursor-pointer"
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {savedProfile?.clientName && (
              <div
                data-testid="returning-client-banner"
                className="pearl-card px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[#F7EAE7]/80 border-[#E5C8C2]"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-[#2A201D]">
                    ✨ ¡Hola de nuevo, {savedProfile.clientName.split(' ')[0]}!
                  </p>
                  <p className="text-[11px] text-[#6E5A54]">
                    Tus datos están pre-rellenados para reservar en 5 segundos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetSavedProfile}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E9D9CF] text-[11px] font-bold text-[#6E5A54] hover:text-[#2A201D] inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw size={11} />
                  <span>Cambiar datos</span>
                </button>
              </div>
            )}
            {/* Selector Modo */}
            <div className={`pearl-card p-1.5 grid ${walkInAllowed ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
              <button
                type="button"
                onClick={() => setBookingMode('appointment')}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  effectiveBookingMode === 'appointment'
                    ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                    : 'text-[#6E5A54]'
                }`}
              >
                <Calendar size={14} /> Elegir Día y Hora {!walkInAllowed && '· Solo Cita Previa'}
              </button>
              {walkInAllowed && (
                <button
                  type="button"
                  onClick={() => setBookingMode('walkin')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    effectiveBookingMode === 'walkin'
                      ? 'bg-gradient-to-r from-[#C59B5F] to-[#B86566] text-white shadow-sm'
                      : 'text-[#6E5A54]'
                  }`}
                >
                  <Clock size={14} /> Turno Express ({queueInfo.count} espera)
                </button>
              )}
            </div>

            {/* 1. Carta de Tratamientos con Filtros por Categoría */}
            <div className="pearl-card p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold text-[#2A201D]">1. Elige tu Tratamiento</h2>
                <span className="text-[11px] text-[#9A847D]">{filteredServices.length} opciones</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 border cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#C87A72] text-white border-[#C87A72]'
                        : 'bg-[#FAF4EE] text-[#6E5A54] border-[#E9D9CF]'
                    }`}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredServices.map((svc) => {
                  const active = svc.id === selectedServiceId;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#F7EAE7] border-[#C87A72] shadow-sm'
                          : 'bg-[#FFFDFB] border-[#E9D9CF] hover:border-[#C87A72]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#2A201D] leading-snug">{svc.name}</span>
                        <span className="text-sm font-serif font-bold text-[#B86566] shrink-0">
                          {svc.priceLabel || `${svc.price}€`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#9A847D] mt-1 block">
                        ⏱ {svc.durationMinutes} min
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Especialista + Fecha y Hora */}
            {effectiveBookingMode === 'appointment' && (
              <div className="pearl-card p-5 space-y-4">
                <h2 className="text-xl font-serif font-bold text-[#2A201D]">2. Especialista, Día y Hora</h2>

                {specialists.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBarberId('any')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        selectedBarberId === 'any'
                          ? 'bg-[#C87A72] text-white border-[#C87A72]'
                          : 'bg-[#FAF4EE] text-[#4A3934] border-[#E9D9CF]'
                      }`}
                    >
                      Cualquier Especialista
                    </button>
                    {specialists.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setSelectedBarberId(sp.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                          selectedBarberId === sp.id
                            ? 'bg-[#C87A72] text-white border-[#C87A72]'
                            : 'bg-[#FAF4EE] text-[#4A3934] border-[#E9D9CF]'
                        }`}
                      >
                        <User size={12} />
                        <span>{sp.name.split('(')[0].trim()}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Días */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {upcomingDates.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`px-3.5 py-2 rounded-2xl border text-center min-w-[66px] shrink-0 cursor-pointer transition-all ${
                        selectedDate === d.iso
                          ? 'bg-gradient-to-b from-[#C87A72] to-[#B86566] text-white border-[#B86566] shadow-sm'
                          : 'bg-[#FAF4EE] text-[#2A201D] border-[#E9D9CF]'
                      }`}
                    >
                      <span className="text-[10px] uppercase block opacity-85">{d.label}</span>
                      <span className="text-base font-serif font-bold block leading-tight">{d.dayNum}</span>
                      <span className="text-[10px] block opacity-80">{d.month}</span>
                    </button>
                  ))}
                </div>

                {/* Horas disponibles reales */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.length === 0 ? (
                    <p className="col-span-full text-xs text-[#9A847D] py-3 text-center">
                      No hay horarios disponibles para esta duración en el día seleccionado.
                    </p>
                  ) : (
                    slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                          !s.available
                            ? 'bg-[#F2ECE7] text-[#B8ABA5] border-transparent line-through cursor-not-allowed'
                            : selectedSlot === s.time
                            ? 'bg-[#C87A72] text-white border-[#C87A72] shadow-sm cursor-pointer'
                            : 'bg-white text-[#2A201D] border-[#E9D9CF] hover:border-[#C87A72] cursor-pointer'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. Tus Datos */}
            <div className="pearl-card p-5 space-y-3.5">
              <h2 className="text-xl font-serif font-bold text-[#2A201D]">
                {effectiveBookingMode === 'appointment' ? '3. Tus Datos para Confirmar' : '2. Tus Datos'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm"
                />
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Tu móvil WhatsApp (ej. 638 877 945)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm"
                />
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isNails
                    ? 'Opcional: forma/color deseado (ej. Almendra Milky White)'
                    : 'Opcional: notas sobre tu cabello o piel'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
              />

              {/* Información Básica RGPD (1ª capa · Art. 13 RGPD) + 2 Checkboxes Desmarcados */}
              <div
                data-testid="rgpd-booking-section"
                className="p-3.5 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-3 text-left"
              >
                <div className="p-3 rounded-xl bg-white border border-[#EFE3DB] text-[11px] text-[#4A3934] space-y-1 leading-relaxed">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#B86566] flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    <span>Información básica sobre Protección de Datos (1ª capa · Art. 13 RGPD)</span>
                  </p>
                  <p><strong className="text-[#2A201D]">Responsable:</strong> {shop?.name || 'LUMINA BEAUTY'}</p>
                  <p><strong className="text-[#2A201D]">Finalidad:</strong> Gestión de la cita y atención al cliente.</p>
                  <p><strong className="text-[#2A201D]">Legitimación:</strong> Ejecución del servicio y consentimiento expreso.</p>
                  <p><strong className="text-[#2A201D]">Destinatarios:</strong> No cesión a terceros salvo obligación legal; infraestructura cloud segura (Netlify, EU-US Data Privacy Framework).</p>
                  <p>
                    <strong className="text-[#2A201D]">Derechos:</strong> Acceso, Rectificación, Supresión, Portabilidad y Oposición ante el establecimiento.{' '}
                    <button
                      type="button"
                      onClick={() => setIsLegalModalOpen(true)}
                      className="text-[#B86566] underline hover:text-[#2A201D] font-bold cursor-pointer"
                    >
                      Ver Política de Privacidad y Aviso Legal
                    </button>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 text-xs text-[#2A201D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => {
                        setAcceptedPrivacy(e.target.checked);
                        if (e.target.checked) setErrorMsg('');
                      }}
                      className="mt-0.5 w-4 h-4 accent-[#C87A72] shrink-0 cursor-pointer"
                    />
                    <span className="leading-snug">
                      <strong className="text-[#8E4742]">(Obligatorio)</strong> He leído la información básica de privacidad y acepto el tratamiento de mis datos para gestionar mi cita.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-[#6E5A54] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedWhatsapp}
                      onChange={(e) => setAcceptedWhatsapp(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#C87A72] shrink-0 cursor-pointer"
                    />
                    <span className="leading-snug">
                      <strong className="text-[#4A3934]">(Opcional)</strong> Acepto recibir recordatorios de cita o avisos de hueco libre por WhatsApp.
                    </span>
                  </label>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FDECEB] border border-[#E8B2AE] text-[#9E3836] text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-editorial w-full py-3.5 text-sm cursor-pointer disabled:opacity-60"
              >
                <Sparkles size={16} />
                <span>
                  {submitting
                    ? 'Enviando solicitud...'
                    : effectiveBookingMode === 'appointment'
                    ? `Reservar ${selectedService?.name || ''} · ${selectedSlot || ''}`
                    : 'Apuntarme al Turno Express'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-[#E9D9CF] text-center text-[11px] text-[#9A847D] flex flex-wrap items-center justify-center gap-2">
          <span>LUMINA // BEAUTY &amp; SALON · Reserva Online</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setIsLegalModalOpen(true)}
            className="text-[#8E4742] hover:text-[#2A201D] underline font-semibold cursor-pointer"
          >
            Política de Privacidad y Aviso Legal
          </button>
        </div>
      </div>

      <LegalComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        shop={shop}
        shopSlug={slug}
        publicOnly={true}
      />
    </div>
  );
};

export default PublicBookingView;
