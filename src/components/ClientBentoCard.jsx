import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Sparkles,
  AlertTriangle,
  Crown,
  MessageCircle,
  Check,
  ArrowUpRight,
  Palette,
  FlaskConical,
} from 'lucide-react';
import { NAIL_SHAPES, NAIL_POLISH_COLORS } from '../lib/shopUtils';
import { getRetentionRadarAlert } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import { soundFx } from '../lib/soundFx';

export function NailShapeIcon({ shapeName = 'Almendra', size = 20 }) {
  const lower = String(shapeName || '').toLowerCase();
  const shape =
    NAIL_SHAPES.find((s) => lower.includes(s.id) || lower.includes(s.short.toLowerCase())) ||
    NAIL_SHAPES[0];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d={shape.path} fill="#F7EAE7" stroke="#B86566" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 17.5 C10.5 16.5 13.5 16.5 15 17.5" stroke="#C59B5F" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function NailColorSwatch({ colorName = 'Milky White', size = 18 }) {
  const lower = String(colorName || '').toLowerCase();
  const found =
    NAIL_POLISH_COLORS.find(
      (c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.id.replace('-', ' '))
    ) || NAIL_POLISH_COLORS[0];
  return (
    <span
      className="inline-block rounded-full shrink-0 shadow-inner"
      style={{
        width: size,
        height: size,
        background: found.swatch,
        border: `1.5px solid ${found.border}`,
      }}
      title={found.name}
    />
  );
}

const ClientBentoCard = ({ client, vertical = 'nails', onRepeatToday }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [repeatedOk, setRepeatedOk] = useState(false);
  const navigate = useNavigate();

  const { activeShopSlug } = useShop();
  const isNails = vertical === 'nails';
  const radar = getRetentionRadarAlert(client, vertical, Date.now(), activeShopSlug);
  const latest = client.treatments?.[0];
  const activeBono = client.bonos?.[0];
  const bonoRemaining = activeBono ? Math.max(0, activeBono.total - activeBono.used) : 0;

  const handleFlip = (e) => {
    e.stopPropagation();
    soundFx.playFlip();
    soundFx.triggerHaptic(10);
    setIsFlipped((prev) => !prev);
  };

  const handleRepeat = (e) => {
    e.stopPropagation();
    soundFx.playSuccess();
    soundFx.triggerHaptic(15);
    if (onRepeatToday) onRepeatToday(client.id);
    setRepeatedOk(true);
    setTimeout(() => setRepeatedOk(false), 2400);
  };

  const repeatLabel = isNails ? '✓ Repetir su diseño hoy' : '✓ Repetir su fórmula hoy';

  return (
    <div className="perspective-1200 min-h-[385px] w-full">
      <div
        className={`relative w-full h-full min-h-[385px] transform-style-3d flip-transition ${
          isFlipped ? 'rotate-y-180' : 'rotate-y-0'
        }`}
      >
        {/* CARA FRONTAL — Resumen Editorial Luminoso */}
        <div
          className={`absolute inset-0 backface-hidden pearl-card p-5 flex flex-col justify-between ${
            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          {/* Cabecera clienta */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-[#E9D9CF] shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-serif font-bold text-[#2A201D] leading-tight truncate">
                    {client.name}
                  </h3>
                  <p className="text-xs text-[#6E5A54] font-medium truncate">{client.phone}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  radar.status === 'urgent'
                    ? 'bg-[#FDECEB] text-[#9E3836] border border-[#E8B2AE]'
                    : radar.status === 'due'
                    ? 'bg-[#F6EFE3] text-[#8A6732] border border-[#DFC79C]'
                    : 'bg-[#EDF5F0] text-[#366852] border border-[#BDD8C9]'
                }`}
              >
                {radar.label}
              </span>
            </div>

            {/* Tarjeta Visual Específica por Edición */}
            {isNails ? (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A847D] flex items-center gap-1">
                    <Palette size={12} className="text-[#C87A72]" />
                    Diseño de Uñas Guardado
                  </span>
                  <span className="text-[11px] font-bold text-[#8E4742]">{client.nailSize || 'Talla M'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/90 rounded-xl p-2.5 border border-[#EFE3DB] flex items-center space-x-2">
                    <NailShapeIcon shapeName={client.nailShape} size={22} />
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#9A847D] block">Forma</span>
                      <span className="text-xs font-bold text-[#2A201D] truncate block">
                        {client.nailShape || 'Almendra'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-[#EFE3DB] flex items-center space-x-2">
                    <NailColorSwatch colorName={client.nailColor} size={20} />
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#9A847D] block">Esmalte</span>
                      <span className="text-xs font-bold text-[#2A201D] truncate block">
                        {client.nailColor || 'Milky White'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A847D] flex items-center gap-1">
                    <FlaskConical size={12} className="text-[#C59B5F]" />
                    {client.formulaType === 'cabin' ? 'Protocolo de Cabina Facial' : 'Fórmula de Colorimetría'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#8A6732] border border-[#E9D9CF]">
                    {client.formulaType === 'cabin' ? 'Cabina' : 'Color'}
                  </span>
                </div>
                <p className="text-xs font-mono font-semibold text-[#2A201D] bg-white/90 px-3 py-2 rounded-xl border border-[#EFE3DB] leading-relaxed">
                  {client.colorFormula || latest?.formula || 'Base 7.1 + 8.3 · 20 vol · Matiz 9.21'}
                </p>
              </div>
            )}

            {/* Alerta Cutícula / Alergias + Bono VIP */}
            <div className="mt-3 space-y-2">
              {client.allergyAlert && (
                <div className="px-3 py-2 rounded-xl bg-[#FFF6F2] border border-[#F0D5C8] flex items-start space-x-2 text-[11px] text-[#7A3E36]">
                  <AlertTriangle size={13} className="text-[#C87A72] shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-snug">{client.allergyAlert}</span>
                </div>
              )}

              {activeBono && (
                <div className="px-3 py-2 rounded-xl vip-silk-card flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#2A201D] flex items-center gap-1.5 truncate">
                    <Crown size={13} className="text-[#C59B5F] shrink-0" />
                    <span className="truncate">{activeBono.title}</span>
                  </span>
                  <span className="font-mono font-bold text-[#8A6732] shrink-0 ml-2">
                    {bonoRemaining}/{activeBono.total}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pie de tarjeta con Botón de Giro 3D 100% visible */}
          <div className="pt-3 mt-3 border-t border-[#EFE3DB] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleFlip}
              data-testid="flip-card-btn"
              className="flex-1 px-3 py-2.5 min-h-[40px] rounded-xl bg-[#FAF4EE] hover:bg-[#F3E6DC] border border-[#E4D0C4] text-xs font-bold text-[#2A201D] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCw size={14} className="text-[#C87A72]" />
              <span>Girar Ficha 3D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                navigate(`/clients/${client.id}`);
              }}
              className="px-3 py-2.5 min-h-[40px] rounded-xl bg-white hover:bg-[#FAF4EE] border border-[#E9D9CF] text-xs font-bold text-[#B86566] flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <span>Perfil</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* CARA TRASERA 3D — Receta Exacta, Repetir Hoy & WhatsApp Radar */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 pearl-card p-5 flex flex-col justify-between bg-[#FFFDFB]/95 ${
            isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE3DB]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C87A72]">
                  {isNails ? 'Ficha Técnica · Nail Art' : 'Ficha Técnica · Color & Cabina'}
                </span>
                <h4 className="text-base font-serif font-bold text-[#2A201D]">{client.name}</h4>
              </div>
              <button
                type="button"
                onClick={handleFlip}
                className="p-2 rounded-xl bg-[#FAF4EE] hover:bg-[#F3E6DC] border border-[#E9D9CF] text-[#4A3934] cursor-pointer"
                aria-label="Volver al frente"
              >
                <RotateCw size={15} />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A847D] block">
                  Último Servicio ({latest?.date || client.lastVisit})
                </span>
                <p className="text-xs font-bold text-[#2A201D] mt-0.5">{latest?.name || client.treatment}</p>
                <p className="text-[11px] font-mono text-[#6E5A54] mt-1 leading-relaxed">
                  {latest?.formula || client.colorFormula || 'Sin notas técnicas registradas'}
                </p>
              </div>

              {latest?.notes && (
                <p className="text-[11px] italic text-[#6E5A54] px-1 line-clamp-2">“{latest.notes}”</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#EFE3DB]">
            <button
              type="button"
              onClick={handleRepeat}
              className={`w-full py-2.5 px-3 min-h-[42px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                repeatedOk
                  ? 'bg-[#5C8A74] text-white'
                  : 'btn-editorial'
              }`}
            >
              {repeatedOk ? (
                <>
                  <Check size={15} />
                  <span>¡Registrado hoy!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{repeatLabel}</span>
                </>
              )}
            </button>

            <a
              href={radar.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2.5 px-3 min-h-[40px] rounded-xl bg-[#EDF5F0] hover:bg-[#DFF0E6] border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle size={14} />
              <span>
                {isNails ? 'WhatsApp Radar Relleno (+34)' : 'WhatsApp Radar Retoque (+34)'}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBentoCard;
