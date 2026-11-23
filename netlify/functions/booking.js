import {
  getShopConfig,
  getShopAppointments,
  setShopAppointments,
  getShopQueue,
  setShopQueue,
  normalizePhone,
  withShopLock,
} from './lib/blobsClient.js';

export const config = {
  path: ['/api/shops/:shopSlug/public-state', '/api/shops/:shopSlug/booking'],
};

function getScheduleMinutes(timeVal, defaultVal) {
  if (typeof timeVal === 'number') return timeVal * 60;
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    const [h, m] = timeVal.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return defaultVal;
}

function getShopLocalNow(shop = null, nowMs = Date.now()) {
  const dateObj = new Date(nowMs);
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
    const h = Number(map.hour === '24' ? '0' : map.hour);
    const m = Number(map.minute);
    return {
      isoDate: `${map.year}-${map.month}-${map.day}`,
      totalMinutes: h * 60 + m,
      timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      timeZone,
    };
  } catch {
    const isoDate = dateObj.toISOString().split('T')[0];
    const h = dateObj.getUTCHours();
    const m = dateObj.getUTCMinutes();
    return {
      isoDate,
      totalMinutes: h * 60 + m,
      timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      timeZone: 'UTC',
    };
  }
}

function getAppointmentDuration(apt, shop) {
  if (apt?.durationMinutes && !isNaN(Number(apt.durationMinutes))) {
    return Math.max(15, Number(apt.durationMinutes));
  }
  if (apt?.serviceId && Array.isArray(shop?.services)) {
    const svc = shop.services.find((s) => s.id === apt.serviceId || s.name === apt.serviceId);
    if (svc?.durationMinutes) return Math.max(15, Number(svc.durationMinutes));
  }
  return Number(shop?.schedule?.slotMinutes || shop?.schedule?.slotIntervalMinutes || 30);
}

function appointmentMatchesSpecialist(apt, specialistObj, allSpecialists = []) {
  if (!apt) return false;
  if (allSpecialists.length <= 1) return true;
  if (apt.isBlock && (!apt.barberId || apt.barberId === 'any')) return true;
  const aptId = String(apt.barberId || apt.specialistId || '').trim();
  const aptName = String(apt.barberName || apt.specialistName || '').trim().toLowerCase();
  if (!aptId || aptId === 'any') return true;
  if (specialistObj?.id && aptId === String(specialistObj.id)) return true;
  if (
    specialistObj?.name &&
    (aptName === String(specialistObj.name).toLowerCase() ||
      aptId.toLowerCase() === String(specialistObj.name).toLowerCase())
  ) {
    return true;
  }
  const matchesKnown = allSpecialists.some(
    (s) => String(s.id) === aptId || String(s.name || '').toLowerCase() === aptName
  );
  if (!matchesKnown && allSpecialists[0]?.id === specialistObj?.id) return true;
  return false;
}

function generateTimeSlots(openTime = '09:30', closeTime = '19:30', intervalMinutes = 30) {
  const slots = [];
  const openMins = getScheduleMinutes(openTime, 9 * 60 + 30);
  const endMinutes = getScheduleMinutes(closeTime, 19 * 60 + 30);
  const step = Number(intervalMinutes) || 30;
  let currentMinutes = openMins;

  while (currentMinutes + step <= endMinutes) {
    const h = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const m = String(currentMinutes % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    currentMinutes += step;
  }
  return slots;
}

export default async function handler(request, context) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-shop-pin, x-admin-key',
      },
    });
  }

  let shopSlug = context?.params?.shopSlug;
  if (!shopSlug) {
    const match = url.pathname.match(/\/api\/shops\/([^/]+)/);
    shopSlug = match ? match[1] : url.searchParams.get('shop') || url.searchParams.get('shopSlug');
  }

  if (!shopSlug) {
    return new Response(
      JSON.stringify({ success: false, error: 'missing_shop_slug', message: 'Identificador de salón no especificado.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const shop = await getShopConfig(shopSlug);
  if (!shop) {
    return new Response(
      JSON.stringify({ success: false, error: 'shop_not_found', message: 'Este salón no existe.' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  if (String(shop.status || '').toLowerCase() === 'paused') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'shop_inactive',
        paused: true,
        message: 'Este salón está temporalmente en pausa.',
        shop: {
          slug: shop.slug,
          name: shop.name,
          subtitle: shop.subtitle || '',
          vertical: shop.vertical || 'nails',
          address: shop.address,
          phone: shop.phone,
          status: 'paused',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // --- ROUTE 1: GET /api/shops/:shopSlug/public-state ---
  if (method === 'GET' && (url.pathname.includes('/public-state') || url.searchParams.get('action') === 'public-state')) {
    const now = Date.now();
    const localNow = getShopLocalNow(shop, now);
    const targetDate = url.searchParams.get('date') || localNow.isoDate;
    const requestedServiceId = url.searchParams.get('serviceId');
    const requestedDurationParam = Number(url.searchParams.get('durationMinutes'));

    const appointments = await getShopAppointments(shopSlug);
    const queue = await getShopQueue(shopSlug);

    const dayAppointments = appointments.filter((a) => {
      if (a.date !== targetDate) return false;
      if (a.status === 'confirmed' || a.status === 'seated') return true;
      if (a.status === 'pending' && a.holdExpiresAt && a.holdExpiresAt > now) return true;
      return false;
    });

    const targetDateParts = String(targetDate).split('-').map(Number);
    const isValidTargetDate = targetDateParts.length === 3 && !targetDateParts.some(isNaN);
    const targetDayOfWeek = isValidTargetDate
      ? new Date(Date.UTC(targetDateParts[0], targetDateParts[1] - 1, targetDateParts[2])).getUTCDay()
      : new Date().getDay();

    const openDays = shop.schedule?.workDays || shop.schedule?.daysOpen || [1, 2, 3, 4, 5, 6];
    const daySchedule =
      shop.schedule?.hoursByDay?.[targetDayOfWeek] ||
      shop.schedule?.hoursByDay?.[String(targetDayOfWeek)] ||
      {};
    const isDayOpen =
      !daySchedule.closed &&
      (openDays.includes(targetDayOfWeek) || (targetDayOfWeek === 0 && openDays.includes(7)));

    const dayOpenTime = daySchedule.openTime ?? shop.schedule?.openTime ?? '09:30';
    const dayCloseTime = daySchedule.closeTime ?? shop.schedule?.closeTime ?? '19:30';
    const closeMinutes = getScheduleMinutes(dayCloseTime, 19 * 60 + 30);
    const defaultStep = Number(shop.schedule?.slotMinutes || shop.schedule?.slotIntervalMinutes || 30);

    let effectiveReqDuration = defaultStep;
    if (!isNaN(requestedDurationParam) && requestedDurationParam >= 15) {
      effectiveReqDuration = requestedDurationParam;
    } else if (requestedServiceId && Array.isArray(shop.services)) {
      const matchedSvc = shop.services.find((s) => s.id === requestedServiceId || s.name === requestedServiceId);
      if (matchedSvc?.durationMinutes) effectiveReqDuration = Number(matchedSvc.durationMinutes);
    }

    const timeSlots = isDayOpen ? generateTimeSlots(dayOpenTime, dayCloseTime, defaultStep) : [];
    const specialists =
      Array.isArray(shop.barbers) && shop.barbers.length > 0
        ? shop.barbers
        : [{ id: 's1', name: 'Especialista Titular' }];

    const availability = timeSlots.map((time) => {
      const slotStart = getScheduleMinutes(time, 0);
      const slotEnd = slotStart + effectiveReqDuration;
      const fitsBeforeClose = slotEnd <= closeMinutes;
      const isPast = targetDate === localNow.isoDate && slotStart <= localNow.totalMinutes;

      const specialistAvailability = specialists.map((sp) => {
        if (!fitsBeforeClose) return { barberId: sp.id, available: false };
        const isBooked = dayAppointments.some((a) => {
          if (!appointmentMatchesSpecialist(a, sp, specialists)) return false;
          const aptTime = a.timeSlot || a.time;
          const aptStart = getScheduleMinutes(aptTime, -1);
          if (aptStart < 0) return false;
          const aptEnd = aptStart + getAppointmentDuration(a, shop);
          return slotStart < aptEnd && slotEnd > aptStart;
        });
        return { barberId: sp.id, available: !isBooked };
      });

      const anyAvailable = fitsBeforeClose && specialistAvailability.some((s) => s.available);
      return { time, available: anyAvailable, isPast, barbers: specialistAvailability };
    });

    const busyIntervals = dayAppointments.map((a) => ({
      start: a.timeSlot || a.time,
      durationMinutes: getAppointmentDuration(a, shop),
      barberId: specialists.length <= 1 ? specialists[0]?.id || 'any' : a.barberId || 'any',
      isBlock: Boolean(a.isBlock),
    }));

    const activeWaitingQueue = queue.filter((q) => q.status === 'waiting');
    const anonymizedQueue = {
      count: activeWaitingQueue.length,
      waitMinutes: activeWaitingQueue.reduce((acc, q) => acc + (Number(q.waitMinutes) || 25), 0),
      entries: activeWaitingQueue.map((_q, idx) => ({
        position: idx + 1,
        waitMinutes: (idx + 1) * 25,
      })),
    };

    // Strict GDPR & Privacy boundary: NEVER expose pin or client list
    const publicState = {
      success: true,
      shop: {
        slug: shop.slug,
        name: shop.name,
        subtitle: shop.subtitle || '',
        vertical: shop.vertical || 'nails',
        theme: shop.theme || 'quiet-luxury',
        address: shop.address,
        phone: shop.phone,
        logo: shop.logo,
        status: shop.status || 'active',
        walkInOpen: shop.walkInOpen !== false,
        description: shop.description || '',
        instagramSalon: shop.instagramSalon || '',
        googleReviewUrl: shop.googleReviewUrl || '',
        barbers: shop.barbers,
        services: shop.services,
        schedule: shop.schedule,
      },
      date: targetDate,
      closedOnDate: !isDayOpen,
      availability,
      busyIntervals,
      queue: anonymizedQueue,
    };

    return new Response(JSON.stringify(publicState), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  // --- ROUTE 2: POST /api/shops/:shopSlug/booking ---
  if (method === 'POST' && (url.pathname.includes('/booking') || url.searchParams.get('action') === 'booking')) {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_json', message: 'Solicitud inválida.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { type, clientName, clientPhone, indicativeStyle } = body;
    if (!clientName || !clientPhone) {
      return new Response(
        JSON.stringify({ success: false, error: 'validation_error', message: 'Nombre y teléfono son obligatorios.' }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (body.rgpdConsent?.acceptedPrivacy !== true) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'rgpd_consent_required',
          message: 'Debes aceptar la política de privacidad para reservar.',
        }),
        { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const rgpdConsentRecord = {
      acceptedPrivacy: true,
      acceptedWhatsapp: Boolean(body.rgpdConsent?.acceptedWhatsapp),
      acceptedAt:
        typeof body.rgpdConsent?.acceptedAt === 'string' && body.rgpdConsent.acceptedAt
          ? body.rgpdConsent.acceptedAt
          : new Date().toISOString(),
      policyVersion: String(body.rgpdConsent?.policyVersion || '2026.1'),
    };

    const normalizedClientPhone = normalizePhone(clientPhone);

    if (type === 'appointment') {
      const { barberId, serviceId, date, timeSlot, time, notes } = body;
      const slotTime = timeSlot || time;
      if (!date || !slotTime) {
        return new Response(
          JSON.stringify({ success: false, error: 'missing_time_slot', message: 'Fecha y hora requeridas.' }),
          { status: 422, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const openDays = shop.schedule?.workDays || shop.schedule?.daysOpen || [1, 2, 3, 4, 5, 6];
      const dateParts = String(date).split('-').map(Number);
      if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        return new Response(
          JSON.stringify({ success: false, error: 'shop_closed_on_date', message: 'Fecha inválida.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
      const dayOfWeek = dateObj.getUTCDay();
      const dayHrs = shop.schedule?.hoursByDay?.[dayOfWeek] || shop.schedule?.hoursByDay?.[String(dayOfWeek)] || {};
      const isOpen = !dayHrs.closed && (openDays.includes(dayOfWeek) || (dayOfWeek === 0 && openDays.includes(7)));
      if (!isOpen) {
        return new Response(
          JSON.stringify({ success: false, error: 'shop_closed_on_date', message: 'El salón permanece cerrado este día.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const [sh, sm] = String(slotTime).split(':').map(Number);
      if (isNaN(sh) || isNaN(sm)) {
        return new Response(
          JSON.stringify({ success: false, error: 'outside_business_hours', message: 'Formato de hora inválido.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const matchedService = Array.isArray(shop.services)
        ? shop.services.find((s) => s.id === serviceId || s.name === serviceId)
        : null;
      const durationMinutes = Math.max(
        15,
        Math.min(
          240,
          Number(body.durationMinutes) ||
            Number(matchedService?.durationMinutes) ||
            Number(shop.schedule?.slotMinutes || shop.schedule?.slotIntervalMinutes || 30)
        )
      );

      const slotMinutes = sh * 60 + sm;
      const openMinutes = getScheduleMinutes(dayHrs.openTime ?? shop.schedule?.openTime, 9 * 60 + 30);
      const closeMinutes = getScheduleMinutes(dayHrs.closeTime ?? shop.schedule?.closeTime, 19 * 60 + 30);

      if (slotMinutes < openMinutes || slotMinutes >= closeMinutes || slotMinutes + durationMinutes > closeMinutes) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'outside_business_hours',
            message:
              slotMinutes + durationMinutes > closeMinutes && slotMinutes < closeMinutes
                ? `El tratamiento (${durationMinutes} min) supera la hora de cierre (${dayHrs.closeTime || shop.schedule?.closeTime || '19:30'}).`
                : 'Horario fuera del horario del salón.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      return await withShopLock(shopSlug, async () => {
        const appointments = await getShopAppointments(shopSlug);
        const now = Date.now();
        const specialists =
          Array.isArray(shop.barbers) && shop.barbers.length > 0
            ? shop.barbers
            : [{ id: 's1', name: 'Especialista' }];

        const reqStart = slotMinutes;
        const reqEnd = slotMinutes + durationMinutes;

        const activeDayApts = appointments.filter((a) => {
          if (a.date !== date) return false;
          if (a.status === 'confirmed' || a.status === 'seated') return true;
          if (a.status === 'pending' && a.holdExpiresAt && a.holdExpiresAt > now) return true;
          return false;
        });

        const overlapsApt = (a) => {
          const aptStart = getScheduleMinutes(a.timeSlot || a.time, -1);
          if (aptStart < 0) return false;
          const aptEnd = aptStart + getAppointmentDuration(a, shop);
          return reqStart < aptEnd && reqEnd > aptStart;
        };

        let collision = false;
        let assigned = null;

        if (specialists.length <= 1) {
          collision = activeDayApts.some((a) => overlapsApt(a));
          assigned = specialists[0];
        } else if (barberId && barberId !== 'any') {
          const target = specialists.find((b) => b.id === barberId || b.name === barberId) || { id: barberId, name: barberId };
          assigned = target;
          collision = activeDayApts.some((a) => overlapsApt(a) && appointmentMatchesSpecialist(a, target, specialists));
        } else {
          const globalCollision = activeDayApts.some((a) => overlapsApt(a) && (!a.barberId || a.barberId === 'any'));
          if (globalCollision) {
            collision = true;
          } else {
            const free = specialists.find((b) => !activeDayApts.some((a) => overlapsApt(a) && appointmentMatchesSpecialist(a, b, specialists)));
            if (!free) collision = true;
            else assigned = free;
          }
        }

        if (collision) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'slot_unavailable',
              message: 'La franja seleccionada ya está reservada o coincide con otra cita.',
            }),
            { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const holdDurationMs = 10 * 60 * 1000;
        const resolvedId =
          barberId && barberId !== 'any'
            ? barberId
            : assigned?.id || specialists[0]?.id || 'any';
        const resolvedName =
          barberId && barberId !== 'any'
            ? body.barberName || assigned?.name || resolvedId
            : assigned?.name || specialists[0]?.name || 'Especialista disponible';

        const newAppointment = {
          id: `apt-${now}-${Math.random().toString(36).slice(2, 7)}`,
          shopSlug,
          type: 'appointment',
          clientName: String(clientName).trim(),
          clientPhone: normalizedClientPhone,
          rawPhone: clientPhone,
          barberId: resolvedId,
          barberName: resolvedName,
          serviceId: matchedService?.id || serviceId || shop.services?.[0]?.id || 'service-1',
          serviceName: body.serviceName || matchedService?.name || serviceId || 'Tratamiento Beauty',
          durationMinutes,
          price: body.price ?? matchedService?.price ?? 35,
          priceLabel: matchedService?.priceLabel || (matchedService?.price !== undefined ? `${matchedService.price}€` : ''),
          date,
          timeSlot: slotTime,
          time: slotTime,
          indicativeStyle: indicativeStyle || '',
          notes: notes || '',
          rgpdConsent: rgpdConsentRecord,
          status: 'pending',
          createdAt: now,
          holdExpiresAt: now + holdDurationMs,
        };

        appointments.push(newAppointment);
        await setShopAppointments(shopSlug, appointments);

        return new Response(
          JSON.stringify({
            success: true,
            bookingId: newAppointment.id,
            status: 'pending',
            holdExpiresAt: newAppointment.holdExpiresAt,
            appointment: newAppointment,
            message: 'Solicitud recibida con cariño. El salón confirmará tu cita en unos instantes.',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      });
    }

    if (type === 'walkin') {
      if (shop.walkInOpen === false) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'walkin_closed',
            message: 'Este salón atiende actualmente solo con cita previa. Elige día y hora en el calendario.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      const { barberId, serviceId } = body;
      return await withShopLock(shopSlug, async () => {
        const queue = await getShopQueue(shopSlug);
        const now = Date.now();
        const localNow = getShopLocalNow(shop, now);
        const waitingCount = queue.filter((q) => q.status === 'waiting').length;
        const position = waitingCount + 1;
        const waitMinutes = position * 25;

        const newQueueItem = {
          id: `wq-${now}-${Math.random().toString(36).slice(2, 7)}`,
          shopSlug,
          type: 'walkin',
          name: String(clientName).trim(),
          phone: normalizedClientPhone,
          rawPhone: clientPhone,
          barber: barberId || (shop.barbers?.length === 1 ? shop.barbers[0].name : 'Cualquier Especialista'),
          service: serviceId || shop.services?.[0]?.name || 'Servicio Express',
          indicativeStyle: indicativeStyle || '',
          rgpdConsent: rgpdConsentRecord,
          position,
          waitMinutes,
          status: 'waiting',
          timeIn: localNow.timeStr,
          createdAt: now,
        };

        queue.push(newQueueItem);
        await setShopQueue(shopSlug, queue);

        return new Response(
          JSON.stringify({
            success: true,
            bookingId: newQueueItem.id,
            status: 'waiting',
            position,
            waitMinutes,
            message: `¡Te hemos reservado turno! Eres la #${position} en lista (~${waitMinutes} min).`,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'invalid_type', message: 'Tipo de reserva inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
