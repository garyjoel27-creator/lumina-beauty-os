import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Undo2,
  GripVertical,
  Trash2,
  CheckCircle2,
  Ban,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { soundFx } from '../lib/soundFx';

const PIXELS_PER_HOUR = 76;
const STEP_MIN = 15;

function timeToMinutes(t = '09:30') {
  const [h, m] = String(t).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 9 * 60 + 30;
  return h * 60 + m;
}

function minutesToTime(total) {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, Math.round(total)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function computeOverlapLayout(appointments) {
  const placed = [];
  const sorted = [...appointments].sort((a, b) => {
    const sa = timeToMinutes(a.timeSlot || a.time);
    const sb = timeToMinutes(b.timeSlot || b.time);
    return sa - sb || (Number(b.durationMinutes) || 60) - (Number(a.durationMinutes) || 60);
  });

  // Group overlapping clusters
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const apt of sorted) {
    const start = timeToMinutes(apt.timeSlot || apt.time);
    const end = start + Math.max(30, Number(apt.durationMinutes) || 60);
    if (currentCluster.length === 0 || start < clusterEnd) {
      currentCluster.push({ apt, start, end });
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [{ apt, start, end }];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  for (const cluster of clusters) {
    const colEnds = [];
    const assigned = [];
    for (const item of cluster) {
      let col = colEnds.findIndex((e) => e <= item.start);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.end);
      } else {
        colEnds[col] = item.end;
      }
      assigned.push({ apt: item.apt, col });
    }
    const totalCols = Math.max(1, colEnds.length);
    for (const a of assigned) {
      placed.push({ apt: a.apt, col: a.col, totalCols });
    }
  }
  return placed;
}

const VisualAgendaTimeline = ({
  appointments = [],
  services = [],
  specialists = [],
  schedule = {},
  selectedDate,
  onChangeDate,
  onAddAppointment,
  onRescheduleAppointment,
  onDeleteAppointment,
}) => {
  const startHour = Number(schedule?.startHour ?? 9);
  const endHour = Number(schedule?.endHour ?? 20);
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalHeight = (endHour - startHour) * PIXELS_PER_HOUR;

  const [dragState, setDragState] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [form, setForm] = useState({
    isBlock: false,
    clientName: '',
    clientPhone: '',
    serviceId: services[0]?.id || '',
    barberId: specialists[0]?.id || 'any',
    timeSlot: '10:00',
    durationMinutes: services[0]?.durationMinutes || 60,
    notes: '',
  });

  const timelineRef = useRef(null);

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate && a.status !== 'rejected' && a.status !== 'expired')
      .sort((a, b) => timeToMinutes(a.timeSlot || a.time) - timeToMinutes(b.timeSlot || b.time));
  }, [appointments, selectedDate]);

  const laidOutAppointments = useMemo(() => computeOverlapLayout(dayAppointments), [dayAppointments]);

  const hours = useMemo(() => {
    const arr = [];
    for (let h = startHour; h <= endHour; h++) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  const openCreateSheet = (slotTime = '10:00', isBlock = false) => {
    soundFx.playClick();
    const firstSvc = services[0];
    setEditingApt(null);
    setForm({
      isBlock,
      clientName: isBlock ? 'Descanso / Bloqueo' : '',
      clientPhone: '',
      serviceId: firstSvc?.id || '',
      barberId: specialists[0]?.id || 'any',
      timeSlot: slotTime,
      durationMinutes: isBlock ? 30 : firstSvc?.durationMinutes || 60,
      notes: '',
    });
    setSheetOpen(true);
  };

  const openEditSheet = (apt) => {
    soundFx.playClick();
    setEditingApt(apt);
    setForm({
      isBlock: Boolean(apt.isBlock),
      clientName: apt.clientName || '',
      clientPhone: apt.clientPhone || '',
      serviceId: apt.serviceId || services[0]?.id || '',
      barberId: apt.barberId || specialists[0]?.id || 'any',
      timeSlot: apt.timeSlot || apt.time || '10:00',
      durationMinutes: Number(apt.durationMinutes) || 60,
      notes: apt.notes || '',
    });
    setSheetOpen(true);
  };

  const pushUndo = (apt) => {
    setUndoStack((prev) => [
      {
        id: apt.id,
        timeSlot: apt.timeSlot || apt.time,
        durationMinutes: Number(apt.durationMinutes) || 60,
        date: apt.date,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    soundFx.playClick();
    const [last, ...rest] = undoStack;
    setUndoStack(rest);
    onRescheduleAppointment?.(last.id, {
      timeSlot: last.timeSlot,
      durationMinutes: last.durationMinutes,
      date: last.date,
    });
  };

  const handlePointerStart = (e, apt, mode) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    soundFx.triggerHaptic(8);
    setDragState({
      aptId: apt.id,
      mode, // 'move' | 'resize'
      startY: e.clientY,
      origStartMin: timeToMinutes(apt.timeSlot || apt.time),
      origDuration: Number(apt.durationMinutes) || 60,
      previewStartMin: timeToMinutes(apt.timeSlot || apt.time),
      previewDuration: Number(apt.durationMinutes) || 60,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    const dy = e.clientY - dragState.startY;
    const deltaMins = Math.round(((dy / PIXELS_PER_HOUR) * 60) / STEP_MIN) * STEP_MIN;
    if (dragState.mode === 'move') {
      const nextStart = Math.max(
        startMinutes,
        Math.min(endMinutes - dragState.origDuration, dragState.origStartMin + deltaMins)
      );
      setDragState((prev) => (prev ? { ...prev, previewStartMin: nextStart } : null));
    } else {
      const nextDur = Math.max(15, Math.min(240, dragState.origDuration + deltaMins));
      setDragState((prev) => (prev ? { ...prev, previewDuration: nextDur } : null));
    }
  };

  const handlePointerEnd = () => {
    if (!dragState) return;
    const apt = dayAppointments.find((a) => a.id === dragState.aptId);
    if (
      apt &&
      (dragState.previewStartMin !== dragState.origStartMin ||
        dragState.previewDuration !== dragState.origDuration)
    ) {
      pushUndo(apt);
      soundFx.playSuccess();
      onRescheduleAppointment?.(apt.id, {
        timeSlot: minutesToTime(dragState.previewStartMin),
        durationMinutes: dragState.previewDuration,
      });
    }
    setDragState(null);
  };

  const handleSaveSheet = (e) => {
    e.preventDefault();
    const matchedSvc = services.find((s) => s.id === form.serviceId);
    const matchedSp = specialists.find((b) => b.id === form.barberId);
    const payload = {
      isBlock: form.isBlock,
      clientName: form.isBlock ? form.clientName || 'Bloqueo de Agenda' : form.clientName || 'Clienta Salón',
      clientPhone: form.clientPhone,
      serviceId: form.isBlock ? 'block' : matchedSvc?.id || form.serviceId,
      serviceName: form.isBlock ? 'Bloqueo / Descanso' : matchedSvc?.name || 'Tratamiento Beauty',
      price: form.isBlock ? 0 : matchedSvc?.price ?? 35,
      barberId: form.barberId,
      barberName: matchedSp?.name || 'Especialista',
      date: selectedDate,
      timeSlot: form.timeSlot,
      durationMinutes: Number(form.durationMinutes) || 60,
      notes: form.notes,
      status: 'confirmed',
    };

    if (editingApt) {
      pushUndo(editingApt);
      onRescheduleAppointment?.(editingApt.id, payload);
    } else {
      onAddAppointment?.(payload);
    }
    soundFx.playSuccess();
    setSheetOpen(false);
  };

  return (
    <div className="pearl-card p-4 sm:p-5">
      {/* Cabecera Agenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#EFE3DB]">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
            <Calendar size={18} className="text-[#C87A72]" />
            <span>Agenda Visual Táctil</span>
          </h3>
          <p className="text-[11px] text-[#6E5A54] mt-0.5">
            Desliza libremente · Usa el asa 44×44 para mover hora o estirar duración
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onChangeDate?.(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-bold text-[#2A201D]"
          />

          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-2 rounded-xl bg-[#F6EFE3] border border-[#DFC79C] text-[#7A5A28] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Undo2 size={14} />
              <span>Deshacer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openCreateSheet('11:00', true)}
            className="px-2.5 py-2 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] text-[#6E5A54] hover:text-[#2A201D] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Ban size={13} />
            <span className="hidden sm:inline">Bloquear</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateSheet('11:00', false)}
            className="btn-editorial !py-2 !px-3 !text-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Lienzo Timeline (scroll vertical 1 dedo libre) */}
      <div className="mt-4 relative overflow-y-auto max-h-[540px] pr-1">
        <div
          ref={timelineRef}
          className="relative pl-14 select-none"
          style={{ height: `${totalHeight}px` }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {/* Líneas de hora */}
          {hours.map((h) => {
            const top = (h - startHour) * PIXELS_PER_HOUR;
            const slotStr = `${String(h).padStart(2, '0')}:00`;
            return (
              <div
                key={h}
                style={{ top: `${top}px` }}
                className="absolute left-0 right-0 flex items-start group"
              >
                <span className="w-12 text-[11px] font-mono font-semibold text-[#9A847D] -mt-2 text-right pr-2 shrink-0">
                  {slotStr}
                </span>
                <button
                  type="button"
                  onClick={() => openCreateSheet(slotStr, false)}
                  className="flex-1 border-t border-dashed border-[#E9D9CF] h-[76px] text-left hover:bg-[#FAF4EE]/60 transition-colors cursor-pointer"
                  aria-label={`Crear cita a las ${slotStr}`}
                />
              </div>
            );
          })}

          {/* Bloques de Citas (con soporte de columnas paralelas para citas simultáneas) */}
          {laidOutAppointments.map(({ apt, col, totalCols }) => {
            const isDragging = dragState?.aptId === apt.id;
            const effectiveStart = isDragging
              ? dragState.previewStartMin
              : timeToMinutes(apt.timeSlot || apt.time);
            const effectiveDur = isDragging
              ? dragState.previewDuration
              : Number(apt.durationMinutes) || 60;

            const topPx = Math.max(0, ((effectiveStart - startMinutes) / 60) * PIXELS_PER_HOUR);
            const isCompact = effectiveDur <= 30;
            const heightPx = Math.max(isCompact ? 68 : 76, (effectiveDur / 60) * PIXELS_PER_HOUR - 4);
            const isBlock = Boolean(apt.isBlock);
            const isPending = apt.status === 'pending';

            const leftExpr =
              totalCols > 1
                ? `calc(3.5rem + (${col} * (100% - 3.75rem) / ${totalCols}))`
                : '3.5rem';
            const widthExpr =
              totalCols > 1
                ? `calc((100% - 3.75rem) / ${totalCols} - 4px)`
                : 'calc(100% - 3.75rem)';

            return (
              <div
                key={apt.id}
                style={{ top: `${topPx}px`, height: `${heightPx}px`, left: leftExpr, width: widthExpr }}
                onClick={() => openEditSheet(apt)}
                className={`absolute rounded-2xl border px-2.5 py-1.5 flex flex-col justify-between overflow-hidden transition-shadow cursor-pointer ${
                  isDragging ? 'z-30 shadow-xl ring-2 ring-[#C87A72]' : 'z-10 shadow-sm'
                } ${
                  isBlock
                    ? 'bg-[#F3EBE4]/95 border-[#D8C6B9] text-[#6E5A54]'
                    : isPending
                    ? 'bg-[#FBF3E4]/95 border-[#DFC79C] text-[#5C431C]'
                    : 'bg-gradient-to-r from-[#FFF7F5] to-[#FDF2EE] border-[#E3BDB6] text-[#2A201D]'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-[#9E4E4D]">
                        {minutesToTime(effectiveStart)} · {effectiveDur}m
                      </span>
                      {isPending && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#C59B5F] text-white">
                          QR Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold truncate leading-tight mt-0.5">{apt.clientName}</p>
                    {!isCompact && (
                      <p className="text-[11px] text-[#6E5A54] truncate">
                        {apt.serviceName} {apt.barberName ? `· ${apt.barberName.split(' ')[0]}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Asa Táctil 44x44px para mover con 1 dedo sin bloquear scroll */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onPointerDown={(e) => handlePointerStart(e, apt, 'move')}
                      onClick={(e) => e.stopPropagation()}
                      style={{ touchAction: 'none' }}
                      className="w-11 h-11 rounded-xl bg-white/90 hover:bg-white border border-[#E9D9CF] text-[#B86566] flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
                      title="Arrastra para mover hora"
                      aria-label="Mover cita"
                    >
                      <GripVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Asa Inferior para Estirar / Recortar Duración */}
                <button
                  type="button"
                  onPointerDown={(e) => handlePointerStart(e, apt, 'resize')}
                  onClick={(e) => e.stopPropagation()}
                  style={{ touchAction: 'none' }}
                  className="self-center px-3 py-0.5 rounded-full bg-white/85 border border-[#E9D9CF] text-[10px] font-bold text-[#9A847D] hover:text-[#B86566] flex items-center gap-1 cursor-ns-resize shrink-0"
                  title="Arrastra verticalmente para cambiar duración"
                >
                  <ArrowUpDown size={10} />
                  <span>Duración</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Centrado para Crear / Editar / Borrar Cita */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-[#2A201D]/35 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#FFFDFB] border border-[#E9D9CF] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE3DB]">
              <h4 className="text-xl font-serif font-bold text-[#2A201D]">
                {editingApt ? 'Editar Cita en Agenda' : form.isBlock ? 'Nuevo Bloqueo / Descanso' : 'Nueva Cita en Salón'}
              </h4>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-xl bg-[#FAF4EE] text-[#6E5A54] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSheet} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isBlock: false }))}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    !form.isBlock
                      ? 'bg-[#F7EAE7] border-[#C87A72] text-[#8E4742]'
                      : 'bg-white border-[#E9D9CF] text-[#6E5A54]'
                  }`}
                >
                  Cita de Clienta
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isBlock: true, clientName: f.clientName || 'Descanso' }))}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    form.isBlock
                      ? 'bg-[#F6EFE3] border-[#C59B5F] text-[#7A5A28]'
                      : 'bg-white border-[#E9D9CF] text-[#6E5A54]'
                  }`}
                >
                  Bloqueo / Pausa
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                  {form.isBlock ? 'Motivo del bloqueo' : 'Nombre de la clienta'}
                </label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder={form.isBlock ? 'Ej. Almuerzo / Formación' : 'Ej. Valeria Betancor'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                />
              </div>

              {!form.isBlock && (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                      Teléfono (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={form.clientPhone}
                      onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                      placeholder="638 877 945"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                      Tratamiento
                    </label>
                    <select
                      value={form.serviceId}
                      onChange={(e) => {
                        const svc = services.find((s) => s.id === e.target.value);
                        setForm((f) => ({
                          ...f,
                          serviceId: e.target.value,
                          durationMinutes: svc?.durationMinutes || f.durationMinutes,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price}€ · {s.durationMinutes}m)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={form.timeSlot}
                    onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                    Duración (min)
                  </label>
                  <select
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                  >
                    {[15, 30, 45, 60, 75, 90, 105, 120, 150].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {specialists.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                    Especialista
                  </label>
                  <select
                    value={form.barberId}
                    onChange={(e) => setForm((f) => ({ ...f, barberId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
                  >
                    {specialists.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {editingApt && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playAlert();
                      onDeleteAppointment?.(editingApt.id);
                      setSheetOpen(false);
                    }}
                    className="px-3.5 py-3 rounded-xl bg-[#FDECEB] text-[#9E3836] border border-[#E8B2AE] text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Borrar</span>
                  </button>
                )}
                <button type="submit" className="btn-editorial flex-1 py-3 cursor-pointer">
                  <CheckCircle2 size={15} />
                  <span>{editingApt ? 'Guardar Cambios' : 'Confirmar en Agenda'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAgendaTimeline;
