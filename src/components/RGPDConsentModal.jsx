import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Camera,
  Share2,
  MessageCircle,
  Printer,
  PenTool,
} from 'lucide-react';
import SignaturePad from './SignaturePad';

const EMPTY_PERMISSIONS = {
  healthAndFile: false,
  internalPhotos: false,
  photosMarketing: false,
  whatsappReminders: false,
};

const RGPDConsentModal = ({
  isOpen,
  onClose,
  client,
  shop = null,
  onSaveConsent,
  initialTab = 'form',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  // 4 independent checkboxes — ALWAYS unchecked (false) by default
  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      setActiveTab(initialTab);
      if (client.consent?.signed) {
        setPermissions({
          healthAndFile: Boolean(client.consent.permissions?.healthAndFile),
          internalPhotos: Boolean(client.consent.permissions?.internalPhotos),
          photosMarketing: Boolean(client.consent.permissions?.photosMarketing),
          whatsappReminders: Boolean(client.consent.permissions?.whatsappReminders),
        });
        setSignatureDataUrl(client.consent.signatureDataUrl || null);
      } else {
        setPermissions({ ...EMPTY_PERMISSIONS });
        setSignatureDataUrl(null);
      }
      setErrorMsg('');
      setSavedNotice(false);
    }
  }, [isOpen, client, initialTab]);

  if (!isOpen || !client) return null;

  const shopName = shop?.name || 'LUMINA BEAUTY';
  const shopAddress = shop?.address || 'Dirección del salón';
  const shopPhone = shop?.phone || '';

  const togglePerm = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrorMsg('');
  };

  const handleSave = () => {
    if (!permissions.healthAndFile) {
      setErrorMsg('Debes marcar la casilla obligatoria (1) para abrir la ficha y tratar datos de sensibilidad/alergias.');
      return;
    }
    if (!signatureDataUrl) {
      setErrorMsg('Por favor recoge la firma manuscrita digital de la clienta en el recuadro antes de guardar.');
      return;
    }

    const now = new Date();
    const consentRecord = {
      signed: true,
      signedAt: now.toISOString(),
      formattedDate: now.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      policyVersion: '2026.1',
      signatureDataUrl,
      permissions: {
        healthAndFile: true,
        internalPhotos: Boolean(permissions.internalPhotos),
        photosMarketing: Boolean(permissions.photosMarketing),
        whatsappReminders: Boolean(permissions.whatsappReminders),
      },
      responsibleName: shopName,
    };

    onSaveConsent?.(client.id, consentRecord);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setActiveTab('document');
    }, 700);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #lumina-rgpd-printable, #lumina-rgpd-printable * { visibility: visible !important; }
          #lumina-rgpd-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            background: white !important;
            color: #2A201D !important;
            padding: 15mm 18mm !important;
            z-index: 999999 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[75] bg-[#2A201D]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="w-full max-w-2xl max-h-[92vh] bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#2A201D]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#FAF4EE] border-b border-[#E9D9CF]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#EDF5F0] border border-[#BDD8C9] text-[#366852] flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#2A201D]">
                      Consentimiento RGPD · 4 Capas
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#E9D9CF] text-[#8E4742]">
                      Art. 13 &amp; Art. 9.2.a RGPD
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5A54] truncate">
                    Clienta: <strong className="text-[#2A201D]">{client.name}</strong> · {shopName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] hover:text-[#2A201D] cursor-pointer shrink-0"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EFE3DB]">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white'
                    : 'bg-white text-[#6E5A54] border border-[#E9D9CF]'
                }`}
              >
                <PenTool size={13} />
                <span>Formulario &amp; Firma</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'document'
                    ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white'
                    : 'bg-white text-[#6E5A54] border border-[#E9D9CF]'
                }`}
              >
                <FileText size={13} />
                <span>Certificado (Imprimir / PDF)</span>
              </button>
            </div>
          </div>

          {/* Form Tab */}
          {activeTab === 'form' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAF6F2]/50">
              {/* 1st Layer RGPD Summary */}
              <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] text-[11px] text-[#4A3934] space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#B86566] flex items-center gap-1.5">
                  <Lock size={12} /> Información Básica de Protección de Datos (1ª Capa · Art. 13 y Art. 9.2.a RGPD)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-[#EFE3DB]">
                  <div><strong className="text-[#2A201D]">Responsable:</strong> {shopName}</div>
                  <div><strong className="text-[#2A201D]">Legitimación:</strong> Ejecución del servicio y consentimiento explícito (Art. 9.2.a RGPD).</div>
                  <div><strong className="text-[#2A201D]">Destinatarios:</strong> Sin cesión a terceros; alojamiento cloud seguro Netlify (EU-US DPF).</div>
                  <div><strong className="text-[#2A201D]">Derechos:</strong> Acceso, Rectificación, Supresión, Portabilidad y Oposición ante el salón.</div>
                </div>
              </div>

              {/* 4 Independent Unchecked-by-default Checkboxes */}
              <div className="space-y-2.5">
                <p className="text-xs font-serif font-bold text-[#2A201D]">
                  Autorizaciones Independientes por Capas (marca solo las que autorices):
                </p>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    permissions.healthAndFile
                      ? 'bg-[#EDF5F0] border-[#5C8A74]/50'
                      : 'bg-white border-[#E9D9CF]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.healthAndFile}
                    onChange={() => togglePerm('healthAndFile')}
                    className="mt-0.5 w-4 h-4 accent-[#5C8A74] cursor-pointer shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#2A201D] flex items-center gap-1.5">
                      <FileText size={13} className="text-[#C87A72]" />
                      1. Ficha de clienta, historial y alergias/sensibilidad (Obligatoria)
                    </span>
                    <p className="text-[11px] text-[#6E5A54] mt-0.5">
                      Autorizo de forma explícita (Art. 9.2.a RGPD) la apertura de mi ficha técnica, historial de servicios y el registro de notas de alergias o sensibilidad de piel/cutícula para mi seguridad durante el tratamiento.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    permissions.internalPhotos
                      ? 'bg-[#F7EAE7] border-[#C87A72]'
                      : 'bg-white border-[#E9D9CF]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.internalPhotos}
                    onChange={() => togglePerm('internalPhotos')}
                    className="mt-0.5 w-4 h-4 accent-[#C87A72] cursor-pointer shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#2A201D] flex items-center gap-1.5">
                      <Camera size={13} className="text-[#C87A72]" />
                      2. Fotografías internas Antes/Después (Opcional)
                    </span>
                    <p className="text-[11px] text-[#6E5A54] mt-0.5">
                      Autorizo la toma de fotografías Antes/Después exclusivamente para el control evolutivo privado en mi ficha del salón.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    permissions.photosMarketing
                      ? 'bg-[#F7EAE7] border-[#C59B5F]'
                      : 'bg-white border-[#E9D9CF]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.photosMarketing}
                    onChange={() => togglePerm('photosMarketing')}
                    className="mt-0.5 w-4 h-4 accent-[#C59B5F] cursor-pointer shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#2A201D] flex items-center gap-1.5">
                      <Share2 size={13} className="text-[#C59B5F]" />
                      3. Publicación en redes sociales / Reels (Opcional)
                    </span>
                    <p className="text-[11px] text-[#6E5A54] mt-0.5">
                      Autorizo la publicación de mis resultados en redes sociales o Reels del salón (con opción de anonimización sin rostro). Revocable en cualquier momento.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    permissions.whatsappReminders
                      ? 'bg-[#EDF5F0] border-[#5C8A74]/50'
                      : 'bg-white border-[#E9D9CF]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions.whatsappReminders}
                    onChange={() => togglePerm('whatsappReminders')}
                    className="mt-0.5 w-4 h-4 accent-[#5C8A74] cursor-pointer shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#2A201D] flex items-center gap-1.5">
                      <MessageCircle size={13} className="text-[#5C8A74]" />
                      4. Recordatorios de relleno/retoque y avisos por WhatsApp (Opcional)
                    </span>
                    <p className="text-[11px] text-[#6E5A54] mt-0.5">
                      Acepto recibir recordatorios de cita, avisos de mantenimiento/relleno y disponibilidad por WhatsApp.
                    </p>
                  </div>
                </label>
              </div>

              {/* Signature Pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-[#2A201D]">
                    Firma Manuscrita Digital de la Clienta
                  </span>
                  <span className="text-[10px] text-[#9A847D]">
                    {client.consent?.signed
                      ? `Firmado: ${client.consent.formattedDate}`
                      : new Date().toLocaleDateString('es-ES')}
                  </span>
                </div>
                <SignaturePad
                  existingSignature={signatureDataUrl}
                  onChange={(url) => {
                    setSignatureDataUrl(url);
                    setErrorMsg('');
                  }}
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FDECEB] border border-[#E8B2AE] text-[#9E3836] text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {savedNotice && (
                <div className="p-3 rounded-xl bg-[#EDF5F0] border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>¡Consentimiento RGPD guardado y sincronizado con éxito!</span>
                </div>
              )}
            </div>
          )}

          {/* Printable Certificate Tab */}
          {activeTab === 'document' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF6F2]/60">
              <div
                id="lumina-rgpd-printable"
                className="bg-white p-6 rounded-2xl border border-[#E9D9CF] space-y-4 text-xs text-[#2A201D]"
              >
                <div className="border-b border-[#E9D9CF] pb-3 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-serif font-bold text-[#2A201D]">{shopName}</h4>
                    <p className="text-[10px] text-[#6E5A54]">
                      {shopAddress} {shopPhone ? `· Tel. ${shopPhone}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-[#6E5A54]">
                    <div className="font-bold text-[#2A201D]">VERSIÓN {client.consent?.policyVersion || '2026.1'}</div>
                    <div>{client.consent?.formattedDate || 'Pendiente de firma'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] text-[11px]">
                  <div><strong>Clienta:</strong> {client.name}</div>
                  <div><strong>Teléfono:</strong> {client.phone || 'No registrado'}</div>
                  <div><strong>Responsable:</strong> {shopName}</div>
                  <div><strong>Estado:</strong> {client.consent?.signed ? 'Firmado' : 'Pendiente'}</div>
                </div>

                <div className="space-y-1.5 border border-[#E9D9CF] rounded-xl p-3 text-[11px]">
                  <p className="font-bold text-[#8E4742] mb-1">Autorizaciones otorgadas:</p>
                  <div className="flex justify-between">
                    <span>1. Ficha técnica y alergias (Art. 9.2.a RGPD):</span>
                    <strong>{permissions.healthAndFile ? 'CONCEDIDO' : 'NO CONCEDIDO'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Fotografías internas Antes/Después:</span>
                    <strong>{permissions.internalPhotos ? 'CONCEDIDO' : 'NO CONCEDIDO'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>3. Publicación redes sociales / Reels:</span>
                    <strong>{permissions.photosMarketing ? 'CONCEDIDO' : 'NO CONCEDIDO'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>4. Recordatorios y avisos WhatsApp:</span>
                    <strong>{permissions.whatsappReminders ? 'CONCEDIDO' : 'NO CONCEDIDO'}</strong>
                  </div>
                  {client.consent?.revokedAt && (
                    <p className="text-[10px] text-[#9E3836] pt-1">
                      Permisos opcionales revocados el: {new Date(client.consent.revokedAt).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-[#EFE3DB]">
                  <div className="text-[10px] text-[#6E5A54]">
                    <p>RGPD (UE) 2016/679 · LOPDGDD 3/2018</p>
                    <p>Timestamp: {client.consent?.signedAt || 'Pendiente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#8E4742] mb-1">Firma de la clienta:</p>
                    {signatureDataUrl ? (
                      <div className="w-44 h-18 rounded-xl border border-[#E9D9CF] bg-[#FAF6F2] p-1.5 flex items-center justify-center">
                        <img src={signatureDataUrl} alt="Firma RGPD" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-44 h-18 rounded-xl border border-dashed border-[#E9D9CF] flex items-center justify-center text-[10px] text-[#9A847D]">
                        Sin firma registrada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-white border-t border-[#EFE3DB] flex items-center justify-between gap-2 no-print">
            <span className="text-[10px] text-[#9A847D] hidden sm:inline">
              Art. 13 &amp; Art. 9.2.a RGPD · Revocable en cualquier momento
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {activeTab === 'document' ? (
                <>
                  <button
                    type="button"
                    onClick={() => window.print?.()}
                    className="btn-silk !py-2 !px-3.5 !text-xs cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Imprimir / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="btn-editorial !py-2 !px-4 !text-xs cursor-pointer"
                  >
                    <PenTool size={13} />
                    <span>Editar Consentimiento</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-silk !py-2 !px-4 !text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn-editorial !py-2 !px-5 !text-xs cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Guardar Firma RGPD</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RGPDConsentModal;
