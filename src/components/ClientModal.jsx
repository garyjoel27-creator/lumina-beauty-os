import React, { useState } from 'react';
import { X, Sparkles, Check, Palette, FlaskConical } from 'lucide-react';
import { NAIL_SHAPES, NAIL_POLISH_COLORS, COLORIMETRY_PRESETS } from '../lib/shopUtils';
import { NailShapeIcon, NailColorSwatch } from './ClientBentoCard';
import { soundFx } from '../lib/soundFx';

const ClientModal = ({ isOpen, onClose, onSave, vertical = 'nails', initialClient = null }) => {
  const isNails = vertical === 'nails';

  const [name, setName] = useState(initialClient?.name || '');
  const [phone, setPhone] = useState(initialClient?.phone || '');
  const [nailShape, setNailShape] = useState(initialClient?.nailShape || 'Almendra');
  const [nailColor, setNailColor] = useState(initialClient?.nailColor || 'Milky White');
  const [nailSize, setNailSize] = useState(initialClient?.nailSize || 'Talla M');
  const [formulaType, setFormulaType] = useState(initialClient?.formulaType || 'color');
  const [colorFormula, setColorFormula] = useState(
    initialClient?.colorFormula || 'Base 7.1 + 8.3 · 20 vol · Matiz 9.21'
  );
  const [allergyAlert, setAllergyAlert] = useState(initialClient?.allergyAlert || '');
  const [notes, setNotes] = useState(initialClient?.treatments?.[0]?.notes || '');
  const [bonoTitle, setBonoTitle] = useState(initialClient?.bonos?.[0]?.title || '');
  const [bonoTotal, setBonoTotal] = useState(initialClient?.bonos?.[0]?.total || 4);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    soundFx.playSuccess();

    const now = Date.now();
    const formulaSummary = isNails
      ? `Forma ${nailShape} · ${nailSize} · ${nailColor}`
      : colorFormula;

    const clientPayload = {
      ...(initialClient || {}),
      name: name.trim(),
      phone: phone.trim() || '600 000 000',
      treatment: isNails ? `Uñas ${nailShape} · ${nailColor}` : formulaType === 'cabin' ? 'Protocolo Cabina Facial' : 'Colorimetría & Estilismo',
      nailShape: isNails ? nailShape : undefined,
      nailColor: isNails ? nailColor : undefined,
      nailSize: isNails ? nailSize : undefined,
      formulaType: !isNails ? formulaType : undefined,
      colorFormula: !isNails ? colorFormula : undefined,
      allergyAlert: allergyAlert.trim(),
      bonos: bonoTitle.trim()
        ? [{ id: initialClient?.bonos?.[0]?.id || `b-${now}`, title: bonoTitle.trim(), total: Number(bonoTotal) || 4, used: initialClient?.bonos?.[0]?.used || 0 }]
        : initialClient?.bonos || [],
      treatments: initialClient?.treatments?.length
        ? initialClient.treatments
        : [
            {
              id: `t-${now}`,
              name: isNails ? 'Uñas acrílicas / Manicura' : formulaType === 'cabin' ? 'Cabina Facial' : 'Colorimetría Salón',
              formula: formulaSummary,
              notes: notes.trim() || 'Ficha creada en LUMINA Beauty',
              nailShape: isNails ? nailShape : undefined,
              nailColor: isNails ? nailColor : undefined,
              date: 'Hoy',
              timestamp: now,
              price: isNails ? 35 : 48,
            },
          ],
    };

    onSave?.(clientPayload);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A201D]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#FFFDFB] border border-[#E9D9CF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE3DB]">
          <h3 className="text-2xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
            <Sparkles size={18} className="text-[#C87A72]" />
            <span>{initialClient ? 'Editar Ficha 3D' : 'Nueva Clienta VIP'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF4EE] text-[#6E5A54] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Valeria Betancor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                Móvil WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="638 877 945"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
              />
            </div>
          </div>

          {isNails ? (
            <div className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#8E4742] flex items-center gap-1.5">
                <Palette size={13} /> Selector Visual de Uñas &amp; Esmalte
              </p>

              {/* Formas de Uña */}
              <div>
                <span className="text-[10px] font-bold text-[#6E5A54] block mb-1.5">Forma favorita</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {NAIL_SHAPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNailShape(s.label)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-all ${
                        nailShape === s.label
                          ? 'bg-white border-[#C87A72] text-[#8E4742] shadow-sm'
                          : 'bg-white/60 border-[#E9D9CF] text-[#6E5A54]'
                      }`}
                    >
                      <NailShapeIcon shapeName={s.label} size={22} />
                      <span className="truncate">{s.short}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tonos reales */}
              <div>
                <span className="text-[10px] font-bold text-[#6E5A54] block mb-1.5">Tono de esmalte</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {NAIL_POLISH_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNailColor(c.name)}
                      className={`px-2.5 py-2 rounded-xl border flex items-center gap-2 text-[11px] font-bold cursor-pointer transition-all ${
                        nailColor === c.name
                          ? 'bg-white border-[#C87A72] text-[#2A201D] shadow-sm'
                          : 'bg-white/60 border-[#E9D9CF] text-[#6E5A54]'
                      }`}
                    >
                      <NailColorSwatch colorName={c.name} size={16} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {['Natural', 'Talla S', 'Talla M', 'Talla M/L'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setNailSize(sz)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      nailSize === sz
                        ? 'bg-[#C87A72] text-white border-[#C87A72]'
                        : 'bg-white text-[#6E5A54] border-[#E9D9CF]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A6732] flex items-center gap-1.5">
                <FlaskConical size={13} /> Fórmula de Colorimetría / Cabina Facial
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormulaType('color')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    formulaType === 'color'
                      ? 'bg-white border-[#C87A72] text-[#8E4742]'
                      : 'bg-white/60 border-[#E9D9CF] text-[#6E5A54]'
                  }`}
                >
                  💇‍♀️ Colorimetría Capilar
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaType('cabin')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    formulaType === 'cabin'
                      ? 'bg-white border-[#C59B5F] text-[#8A6732]'
                      : 'bg-white/60 border-[#E9D9CF] text-[#6E5A54]'
                  }`}
                >
                  ✨ Protocolo Cabina Facial
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {COLORIMETRY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setFormulaType(p.kind);
                      setColorFormula(p.formula);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F7EAE7] border border-[#E9D9CF] text-[10px] font-bold text-[#4A3934] cursor-pointer"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={colorFormula}
                onChange={(e) => setColorFormula(e.target.value)}
                placeholder="Ej. Base 7.1 + 8.3 · 20 vol · Matiz 9.21"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E9D9CF] text-xs font-mono text-[#2A201D]"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
              {isNails ? 'Alertas de cutícula / alergias' : 'Alertas de piel / alergias'}
            </label>
            <input
              type="text"
              value={allergyAlert}
              onChange={(e) => setAllergyAlert(e.target.value)}
              placeholder={
                isNails
                  ? 'Ej. Cutícula sensible · Usar Primer HEMA-Free'
                  : 'Ej. Cuero cabelludo sensible · Sin amoníaco'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm text-[#2A201D]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                Bono VIP (opcional)
              </label>
              <input
                type="text"
                value={bonoTitle}
                onChange={(e) => setBonoTitle(e.target.value)}
                placeholder={isNails ? 'Bono 4 Rellenos VIP' : 'Bono 5 Sesiones Facial'}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
                Sesiones
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={bonoTotal}
                onChange={(e) => setBonoTotal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A54] block mb-1">
              Notas de preferencia
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Prefiere té verde · Le gusta música suave"
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs text-[#2A201D]"
            />
          </div>

          <button type="submit" className="btn-editorial w-full py-3 cursor-pointer">
            <Check size={16} />
            <span>Guardar Ficha 3D</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
