import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  Crown,
  Check,
  Plus,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useClients, getRetentionRadarAlert } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import { NailShapeIcon, NailColorSwatch } from '../components/ClientBentoCard';
import PhotoCompare from '../components/PhotoCompare';
import ClientModal from '../components/ClientModal';
import { NAIL_SHAPES, NAIL_POLISH_COLORS, COLORIMETRY_PRESETS } from '../lib/shopUtils';
import { soundFx } from '../lib/soundFx';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    clients,
    updateClient,
    deleteClient,
    addTreatment,
    repeatLastSessionToday,
    consumeBonoSession,
  } = useClients();
  const { activeVertical } = useShop();

  const client = clients.find((c) => String(c.id) === String(id));
  const isNails = activeVertical === 'nails';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newName, setNewName] = useState(isNails ? 'Relleno acrílico' : 'Retoque Color Orgánico');
  const [newFormula, setNewFormula] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newShape, setNewShape] = useState(client?.nailShape || 'Almendra');
  const [newColor, setNewColor] = useState(client?.nailColor || 'Milky White');
  const [savedToast, setSavedToast] = useState(false);

  if (!client) {
    return (
      <div className="pearl-card p-10 text-center">
        <p className="text-xl font-serif text-[#6E5A54]">No encontramos esta ficha de clienta.</p>
        <button type="button" onClick={() => navigate('/clients')} className="btn-editorial mt-4 cursor-pointer">
          Volver al Directorio 3D
        </button>
      </div>
    );
  }

  const radar = getRetentionRadarAlert(client, activeVertical);
  const photoTreatment = client.treatments?.find((t) => t.beforePhoto && t.afterPhoto);

  const handleAddSession = (e) => {
    e.preventDefault();
    const formulaText =
      newFormula.trim() ||
      (isNails
        ? `Forma ${newShape} · Esmalte ${newColor}`
        : client.colorFormula || 'Protocolo habitual');

    addTreatment(client.id, {
      name: newName,
      formula: formulaText,
      notes: newNotes.trim(),
      nailShape: isNails ? newShape : undefined,
      nailColor: isNails ? newColor : undefined,
      colorFormula: !isNails ? formulaText : undefined,
    });
    soundFx.playSuccess();
    setNewFormula('');
    setNewNotes('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Navegación superior */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="btn-silk cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Directorio 3D</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="btn-silk cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              deleteClient(client.id);
              navigate('/clients');
            }}
            className="p-2.5 rounded-xl bg-[#FDECEB] border border-[#E8B2AE] text-[#9E3836] cursor-pointer"
            title="Eliminar ficha"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Hero Ficha */}
      <div className="pearl-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={client.avatar}
            alt={client.name}
            className="w-18 h-18 rounded-3xl object-cover border-2 border-[#E9D9CF] shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C59B5F]">
              {radar.label}
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#2A201D] truncate">{client.name}</h2>
            <p className="text-xs text-[#6E5A54] mt-0.5">{client.phone}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              soundFx.playSuccess();
              repeatLastSessionToday(client.id);
              setSavedToast(true);
              setTimeout(() => setSavedToast(false), 2200);
            }}
            className="btn-editorial cursor-pointer"
          >
            <Sparkles size={15} />
            <span>{isNails ? '✓ Repetir su diseño hoy' : '✓ Repetir su fórmula hoy'}</span>
          </button>

          <a
            href={radar.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#EDF5F0] border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center gap-1.5"
          >
            <MessageCircle size={15} />
            <span>WhatsApp (+34)</span>
          </a>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 rounded-2xl bg-[#EDF5F0] border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center gap-2">
          <Check size={15} /> Sesión guardada en el historial de {client.name}.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna Izquierda: Diseño / Fórmula + Alertas + Bono VIP */}
        <div className="space-y-5">
          {isNails ? (
            <div className="pearl-card p-5 space-y-3">
              <h3 className="text-lg font-serif font-bold text-[#2A201D]">Diseño de Uñas Actual</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center gap-2.5">
                  <NailShapeIcon shapeName={client.nailShape} size={24} />
                  <div>
                    <span className="text-[10px] text-[#9A847D] uppercase block">Forma</span>
                    <span className="text-xs font-bold text-[#2A201D]">{client.nailShape || 'Almendra'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center gap-2.5">
                  <NailColorSwatch colorName={client.nailColor} size={22} />
                  <div>
                    <span className="text-[10px] text-[#9A847D] uppercase block">Esmalte</span>
                    <span className="text-xs font-bold text-[#2A201D]">{client.nailColor || 'Milky White'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pearl-card p-5 space-y-2.5">
              <h3 className="text-lg font-serif font-bold text-[#2A201D]">
                {client.formulaType === 'cabin' ? 'Protocolo de Cabina' : 'Fórmula de Colorimetría'}
              </h3>
              <p className="text-xs font-mono font-semibold text-[#2A201D] bg-[#FAF4EE] p-3 rounded-xl border border-[#E9D9CF]">
                {client.colorFormula || client.treatments?.[0]?.formula}
              </p>
            </div>
          )}

          {client.allergyAlert && (
            <div className="pearl-card p-4 bg-[#FFF6F2] border-[#F0D5C8] flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-[#C87A72] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E4742]">
                  Alerta Sensibilidad / Cutícula
                </p>
                <p className="text-xs text-[#4A3934] mt-0.5">{client.allergyAlert}</p>
              </div>
            </div>
          )}

          {/* Bonos VIP */}
          {(client.bonos || []).map((b) => {
            const rem = Math.max(0, b.total - b.used);
            return (
              <div key={b.id} className="vip-silk-card p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2A201D] flex items-center gap-1.5">
                    <Crown size={15} className="text-[#C59B5F]" />
                    {b.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#8A6732]">
                    {rem} / {b.total} libres
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C87A72] to-[#C59B5F]"
                    style={{ width: `${Math.round((b.used / b.total) * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  disabled={rem === 0}
                  onClick={() => {
                    soundFx.playClick();
                    consumeBonoSession(client.id, b.id);
                  }}
                  className="w-full py-2 rounded-xl bg-white hover:bg-[#FAF4EE] disabled:opacity-50 border border-[#E9D9CF] text-xs font-bold text-[#8E4742] cursor-pointer"
                >
                  {rem > 0 ? 'Sellar 1 sesión del Bono VIP' : 'Bono completado ✨'}
                </button>
              </div>
            );
          })}

          {photoTreatment && (
            <div className="pearl-card p-4 space-y-2">
              <h4 className="text-sm font-serif font-bold text-[#2A201D]">Antes &amp; Después</h4>
              <PhotoCompare
                beforePhoto={photoTreatment.beforePhoto}
                afterPhoto={photoTreatment.afterPhoto}
              />
            </div>
          )}
        </div>

        {/* Columna Derecha: Registrar Nueva Sesión + Historial */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleAddSession} className="pearl-card p-5 space-y-3.5">
            <h3 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
              <Plus size={17} className="text-[#C87A72]" />
              <span>Registrar Visita / Nueva Fórmula</span>
            </h3>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del servicio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm"
            />

            {isNails ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {NAIL_SHAPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewShape(s.label)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                        newShape === s.label
                          ? 'bg-[#F7EAE7] border-[#C87A72] text-[#8E4742]'
                          : 'bg-white border-[#E9D9CF] text-[#6E5A54]'
                      }`}
                    >
                      <NailShapeIcon shapeName={s.label} size={16} />
                      <span>{s.short}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NAIL_POLISH_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewColor(c.name)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                        newColor === c.name
                          ? 'bg-[#F7EAE7] border-[#C87A72] text-[#2A201D]'
                          : 'bg-white border-[#E9D9CF] text-[#6E5A54]'
                      }`}
                    >
                      <NailColorSwatch colorName={c.name} size={14} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {COLORIMETRY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewFormula(p.formula)}
                    className="px-2.5 py-1 rounded-full bg-[#FAF4EE] hover:bg-[#F7EAE7] border border-[#E9D9CF] text-[11px] font-bold text-[#4A3934] cursor-pointer"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={newFormula}
              onChange={(e) => setNewFormula(e.target.value)}
              placeholder={
                isNails
                  ? 'Detalles extra (ej. Refuerzo Rubber + Top Coat Glass)'
                  : 'Fórmula exacta (ej. Base 7.1 + 8.3 · 20 vol · Matiz 9.21)'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-mono"
            />

            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notas personales para la próxima visita..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
            />

            <button type="submit" className="btn-editorial cursor-pointer">
              <Check size={15} />
              <span>Guardar en Historial</span>
            </button>
          </form>

          {/* Historial */}
          <div className="pearl-card p-5 space-y-3">
            <h3 className="text-xl font-serif font-bold text-[#2A201D]">
              Historial de Visitas ({client.treatments?.length || 0})
            </h3>
            <div className="space-y-3">
              {(client.treatments || []).map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#2A201D]">{t.name}</span>
                    <span className="text-[11px] font-mono text-[#9A847D]">{t.date}</span>
                  </div>
                  <p className="text-xs font-mono text-[#6E5A54] mt-1">{t.formula}</p>
                  {t.notes && <p className="text-xs italic text-[#8E4742] mt-1">“{t.notes}”</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={(payload) => updateClient(client.id, payload)}
        vertical={activeVertical}
        initialClient={client}
      />
    </div>
  );
};

export default ClientProfile;
