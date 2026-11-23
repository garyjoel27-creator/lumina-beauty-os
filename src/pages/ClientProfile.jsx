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
  ShieldCheck,
  Download,
  PenTool,
  ShieldAlert,
} from 'lucide-react';
import { useClients, getRetentionRadarAlert } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import { NailShapeIcon, NailColorSwatch } from '../components/ClientBentoCard';
import PhotoCompare from '../components/PhotoCompare';
import ClientModal from '../components/ClientModal';
import RGPDConsentModal from '../components/RGPDConsentModal';
import { NAIL_SHAPES, NAIL_POLISH_COLORS, COLORIMETRY_PRESETS } from '../lib/shopUtils';
import { soundFx } from '../lib/soundFx';

const SessionRecorderForm = ({ client, isNails, onSaveSession }) => {
  const [newName, setNewName] = useState(isNails ? 'Relleno acrílico' : 'Retoque Color Orgánico');
  const [newFormula, setNewFormula] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newShape, setNewShape] = useState(client?.nailShape || 'Almendra');
  const [newColor, setNewColor] = useState(client?.nailColor || 'Milky White');

  const handleSubmit = (e) => {
    e.preventDefault();
    const formulaText =
      newFormula.trim() ||
      (isNails
        ? `Forma ${newShape} · Esmalte ${newColor}`
        : client.colorFormula || 'Protocolo habitual');

    onSaveSession({
      name: newName,
      formula: formulaText,
      notes: newNotes.trim(),
      nailShape: isNails ? newShape : undefined,
      nailColor: isNails ? newColor : undefined,
      colorFormula: !isNails ? formulaText : undefined,
    });
    setNewFormula('');
    setNewNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="pearl-card p-5 space-y-3.5">
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
  );
};

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
  const { activeShop, activeShopSlug, activeVertical } = useShop();

  const client = clients.find((c) => String(c.id) === String(id));
  const isNails = activeVertical === 'nails';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [consentTab, setConsentTab] = useState('form');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedToast, setSavedToast] = useState('');

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

  const showToastMsg = (msg) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(''), 3200);
  };

  const handleAddSession = (treatmentPayload) => {
    addTreatment(client.id, treatmentPayload);
    soundFx.playSuccess();
    showToastMsg(`Sesión guardada en el historial de ${client.name}.`);
  };

  const handleSaveConsent = (clientId, consentRecord) => {
    updateClient(clientId, { consent: consentRecord });
    soundFx.playSuccess();
    showToastMsg('Consentimiento RGPD firmado y sincronizado.');
  };

  const handleExportPortability = () => {
    const safeSlug =
      String(client.name || 'clienta')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'clienta';
    const exportPayload = {
      legalBasis: 'Art. 20 RGPD — Derecho a la Portabilidad de Datos',
      exportedAt: new Date().toISOString(),
      policyVersion: '2026.1',
      responsible: {
        shopName: activeShop?.name || 'LUMINA BEAUTY',
        shopSlug: activeShopSlug || 'campodonico-nails',
        address: activeShop?.address || '',
        phone: activeShop?.phone || '',
      },
      personalData: {
        id: client.id,
        name: client.name,
        phone: client.phone || '',
        nailShape: client.nailShape || null,
        nailColor: client.nailColor || null,
        colorFormula: client.colorFormula || null,
        allergyAlert: client.allergyAlert || '',
        lastVisit: client.lastVisit || '',
      },
      serviceHistory: client.treatments || [],
      bonos: client.bonos || [],
      consent: client.consent || { signed: false },
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeSlug}-datos-rgpd.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMsg(`Portabilidad descargada: ${safeSlug}-datos-rgpd.json`);
  };

  const handleRevokeOptionalConsent = () => {
    const revokedAt = new Date().toISOString();
    const nextConsent = {
      ...(client.consent || { signed: false, policyVersion: '2026.1' }),
      revokedAt,
      permissions: {
        ...(client.consent?.permissions || {}),
        photosMarketing: false,
        whatsappReminders: false,
      },
    };
    updateClient(client.id, { consent: nextConsent });
    soundFx.playClick();
    showToastMsg('Permisos opcionales (Redes/Reels y WhatsApp) revocados y sincronizados.');
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
            onClick={() => {
              setConsentTab(client.consent?.signed ? 'document' : 'form');
              setIsConsentOpen(true);
            }}
            className="btn-silk cursor-pointer"
          >
            <ShieldCheck size={14} className={client.consent?.signed ? 'text-[#5C8A74]' : 'text-[#C87A72]'} />
            <span>Firmar / Ver RGPD</span>
          </button>
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
            onClick={() => setConfirmDelete(true)}
            className="p-2.5 rounded-xl bg-[#FDECEB] border border-[#E8B2AE] text-[#9E3836] cursor-pointer"
            title="Derecho de Supresión (Eliminar ficha)"
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
            <div className="flex items-center flex-wrap gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C59B5F]">
                {radar.label}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  client.consent?.signed
                    ? 'bg-[#EDF5F0] text-[#2B5944] border-[#BDD8C9]'
                    : 'bg-[#FFF6F2] text-[#9E3836] border-[#E8B2AE]'
                }`}
              >
                {client.consent?.signed ? '✅ RGPD Firmado' : '⚠️ Pendiente RGPD'}
              </span>
            </div>
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
              showToastMsg(`Sesión guardada en el historial de ${client.name}.`);
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
          <Check size={15} /> {savedToast}
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

          {/* Panel Privacidad & Derechos ARSOPOL */}
          <div data-testid="arsopol-panel" className="pearl-card p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-serif font-bold text-[#2A201D] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#5C8A74]" />
                <span>Privacidad &amp; Derechos ARSOPOL</span>
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  client.consent?.signed
                    ? 'bg-[#EDF5F0] text-[#2B5944]'
                    : 'bg-[#FFF6F2] text-[#9E3836]'
                }`}
              >
                {client.consent?.signed ? '✅ RGPD Firmado' : '⚠️ Pendiente RGPD'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] text-[11px] text-[#4A3934] space-y-1">
              <div className="flex justify-between">
                <span>Firma RGPD:</span>
                <strong className="text-[#2A201D]">{client.consent?.formattedDate || 'Pendiente'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Redes / Reels:</span>
                <strong>{client.consent?.permissions?.photosMarketing ? 'Autorizado' : 'No autorizado'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Avisos WhatsApp:</span>
                <strong>{client.consent?.permissions?.whatsappReminders ? 'Autorizado' : 'No autorizado'}</strong>
              </div>
              {client.consent?.revokedAt && (
                <p className="text-[10px] text-[#9E3836] pt-1 border-t border-[#EFE3DB]">
                  Revocado el {new Date(client.consent.revokedAt).toLocaleString('es-ES')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setConsentTab('form');
                  setIsConsentOpen(true);
                }}
                className="btn-editorial w-full !py-2.5 !text-xs cursor-pointer"
              >
                <PenTool size={13} />
                <span>{client.consent?.signed ? 'Ver / Actualizar Firma RGPD' : 'Firmar RGPD (4 Capas)'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPortability}
                className="btn-silk w-full !py-2.5 !text-xs justify-center cursor-pointer"
              >
                <Download size={13} className="text-[#C87A72]" />
                <span>Portabilidad: Descargar datos JSON</span>
              </button>

              <button
                type="button"
                onClick={handleRevokeOptionalConsent}
                className="w-full py-2.5 px-3 rounded-xl bg-[#F6EFE3] hover:bg-[#EFE2CE] border border-[#DFC79C] text-[#7A5A28] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert size={13} />
                <span>Revocar permisos opcionales</span>
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FDECEB] hover:bg-[#FADAD8] border border-[#E8B2AE] text-[#9E3836] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Derecho de Supresión (Borrar datos)</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-[#FDECEB] border border-[#E8B2AE] space-y-2">
                  <p className="text-[11px] text-[#7A2D2B] leading-snug">
                    <strong>Confirmación (Art. 17 RGPD):</strong> ¿Eliminar permanentemente los datos personales, historial y firma de <strong>{client.name}</strong>?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 rounded-lg bg-white border border-[#E9D9CF] text-xs font-bold text-[#4A3934] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteClient(client.id);
                        navigate('/clients');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#9E3836] text-white text-xs font-bold cursor-pointer"
                    >
                      Confirmar Borrado
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Registrar Nueva Sesión + Historial */}
        <div className="lg:col-span-2 space-y-5">
          <SessionRecorderForm
            key={`${client.id}-${activeVertical}`}
            client={client}
            isNails={isNails}
            onSaveSession={handleAddSession}
          />

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

      <RGPDConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        client={client}
        shop={activeShop}
        initialTab={consentTab}
        onSaveConsent={handleSaveConsent}
      />
    </div>
  );
};

export default ClientProfile;
