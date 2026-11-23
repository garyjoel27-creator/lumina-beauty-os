import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Scale,
  FileText,
  Download,
  Printer,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

function buildDpaDraftText({ shopName, shopSlug, shopAddress, shopPhone, formattedDate }) {
  return `CONTRATO DE ENCARGO DEL TRATAMIENTO DE DATOS PERSONALES (ART. 28 RGPD)
======================================================================
Plataforma tecnológica: LUMINA // BEAUTY & SALON
Fecha de emisión del borrador: ${formattedDate}

1. PARTES CONTRATANTES
----------------------
A) RESPONSABLE DEL TRATAMIENTO (EL SALÓN / CENTRO DE BELLEZA):
   - Nombre comercial / Salón: ${shopName}
   - Identificador de entorno (slug): ${shopSlug}
   - Dirección: ${shopAddress || '[Completar dirección fiscal del salón]'}
   - Teléfono: ${shopPhone || '[Completar teléfono]'}
   - NIF / CIF: [Completar NIF/CIF del salón]

B) ENCARGADO DEL TRATAMIENTO (PROVEEDOR TECNOLÓGICO):
   - Titular / Razón Social: [NOMBRE O RAZÓN SOCIAL DEL TITULAR DE LUMINA BEAUTY]
   - NIF / CIF: [NIF/CIF DEL PROVEEDOR]
   - Domicilio fiscal: [DOMICILIO FISCAL EN ESPAÑA / UE]
   - Correo de contacto RGPD: [EMAIL LEGAL / PRIVACIDAD]

2. OBJETO Y DURACIÓN DEL ENCARGO
--------------------------------
El Encargado presta al Responsable el servicio SaaS de gestión de citas online QR, agenda táctil, fichas de clientas 3D (uñas, colorimetría, cabina estética), consentimiento informado digital y control operativo interno ("LUMINA // BEAUTY & SALON"). La duración coincide con la vigencia del servicio SaaS contratado.

3. CATEGORÍAS DE INTERESADOS Y DATOS TRATADOS
---------------------------------------------
- Interesados: Clientas del salón y especialistas asignadas.
- Datos identificativos y de contacto: Nombre, teléfono móvil (WhatsApp), notas de preferencia.
- Datos operativos: Historial de tratamientos, fórmulas de colorimetría/uñas, bonos VIP internos.
- Categorías especiales (Art. 9 RGPD): Alertas de alergias a acrilatos/HEMA/PPD, sensibilidades de piel o cutícula y fotografías Antes/Después, tratados exclusivamente bajo consentimiento explícito (Art. 9.2.a RGPD) recabado por el Responsable.

4. OBLIGACIONES DEL ENCARGADO (ART. 28.3 RGPD)
----------------------------------------------
a) Tratar los datos personales únicamente siguiendo instrucciones documentadas del Responsable.
b) Garantizar el compromiso de confidencialidad de las personas autorizadas.
c) Aplicar medidas técnicas y organizativas (Art. 32 RGPD): cifrado HTTPS/TLS, particionado estricto multi-salón, bloqueo anti fuerza bruta en PIN (15 min tras 5 intentos fallidos) y registro de auditoría de operaciones sensibles.
d) Facilitar al Responsable herramientas integradas para atender derechos ARSOPOL (Acceso, Rectificación, Supresión, Oposición, Portabilidad en JSON y revocación de permisos de imagen/WhatsApp).
e) Notificar sin dilación indebida (máximo 48 horas) cualquier brecha de seguridad de datos personales para permitir su comunicación a la AEPD en plazo de 72 horas.
f) A la finalización del servicio, facilitar la devolución/exportación de datos y suprimir las copias existentes salvo obligación legal de conservación.

5. SUBENCARGADOS AUTORIZADOS Y TRANSFERENCIAS INTERNACIONALES
-------------------------------------------------------------
El Responsable autoriza el uso de la infraestructura cloud de Netlify, Inc. (alojamiento, funciones serverless y almacenamiento Netlify Blobs), adherida al Marco de Privacidad de Datos UE-EE. UU. (EU-US Data Privacy Framework).

6. EXENCIÓN FISCAL (VERIFACTU / RD 1007/2023)
---------------------------------------------
El panel de caja diaria, cosmética y reparto de comisiones es exclusivamente una herramienta de control operativo interno y NO sustituye a un software de facturación certificado ni emite facturas o tickets fiscales válidos ante la AEAT.

FIRMAS (Borrador listo para firma digital o manuscrita)
-------------------------------------------------------
Por el Responsable (${shopName}): ___________________________   Fecha: ${formattedDate}
Por el Encargado (LUMINA // BEAUTY & SALON): ________________   Fecha: ${formattedDate}
`;
}

export default function LegalComplianceModal({
  isOpen,
  onClose,
  shop = null,
  shopSlug = 'campodonico-nails',
  publicOnly = false,
  initialTab = 'privacy',
}) {
  const [activeTab, setActiveTab] = useState(
    publicOnly && initialTab === 'dpa' ? 'privacy' : initialTab
  );
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(publicOnly && initialTab === 'dpa' ? 'privacy' : initialTab);
      setDownloadSuccess(false);
    }
  }, [isOpen, publicOnly, initialTab]);

  if (!isOpen) return null;

  const shopName = shop?.name || 'LUMINA BEAUTY';
  const shopAddress = shop?.address || 'Dirección del salón';
  const shopPhone = shop?.phone || 'Teléfono del salón';
  const safeSlug = String(shopSlug || shop?.slug || 'salon').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const isoDate = new Date().toISOString().split('T')[0];

  const dpaText = buildDpaDraftText({
    shopName,
    shopSlug: safeSlug,
    shopAddress,
    shopPhone,
    formattedDate: todayFormatted,
  });

  const handleDownloadDpa = () => {
    const blob = new Blob([dpaText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DPA-Art28-${safeSlug}-${isoDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintDpa = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #legal-dpa-printable, #legal-dpa-printable * { visibility: visible !important; }
          #legal-dpa-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            background: white !important;
            color: #2A201D !important;
            padding: 16mm !important;
            z-index: 999999 !important;
            font-size: 11px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[80] bg-[#2A201D]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="w-full max-w-2xl max-h-[90vh] bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#2A201D]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#FAF4EE] border-b border-[#E9D9CF] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Scale size={19} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2A201D] truncate">
                  {publicOnly ? 'Privacidad & Aviso Legal' : 'Centro Legal, RGPD & Contrato DPA'}
                </h2>
                <p className="text-[11px] text-[#6E5A54] truncate">
                  {shopName} · RGPD (UE) 2016/679, LOPDGDD 3/2018 & LSSI-CE
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] hover:text-[#2A201D] cursor-pointer shrink-0"
              aria-label="Cerrar modal legal"
            >
              <X size={17} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-4 sm:px-5 pt-3 pb-2 bg-white border-b border-[#EFE3DB] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                activeTab === 'privacy'
                  ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                  : 'bg-[#FAF4EE] text-[#6E5A54] hover:text-[#2A201D] border border-[#E9D9CF]'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Política de Privacidad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('legal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                activeTab === 'legal'
                  ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                  : 'bg-[#FAF4EE] text-[#6E5A54] hover:text-[#2A201D] border border-[#E9D9CF]'
              }`}
            >
              <Scale size={14} />
              <span>Aviso Legal (LSSI-CE)</span>
            </button>

            {!publicOnly && (
              <button
                type="button"
                onClick={() => setActiveTab('dpa')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                  activeTab === 'dpa'
                    ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                    : 'bg-[#FAF4EE] text-[#6E5A54] hover:text-[#2A201D] border border-[#E9D9CF]'
                }`}
              >
                <FileText size={14} />
                <span>Contrato DPA (Art. 28)</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-[#4A3934] leading-relaxed bg-[#FAF6F2]/50">
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-2 shadow-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#B86566] flex items-center gap-1.5">
                    <Lock size={13} /> Información Básica sobre Protección de Datos (Art. 13 RGPD)
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    <li><strong className="text-[#2A201D]">Responsable:</strong> {shopName} ({shopAddress} · Tel. {shopPhone}).</li>
                    <li><strong className="text-[#2A201D]">Finalidad:</strong> Gestión de citas online, atención en salón, historial técnico de servicios (uñas, colorimetría o cabina estética) y seguimiento de preferencias.</li>
                    <li><strong className="text-[#2A201D]">Legitimación:</strong> Ejecución del servicio (Art. 6.1.b RGPD) y consentimiento expreso (Art. 6.1.a y Art. 9.2.a RGPD para notas de alergias/sensibilidad de piel o cutícula y fotografías).</li>
                    <li><strong className="text-[#2A201D]">Destinatarios:</strong> No se ceden datos a terceros salvo obligación legal. Alojamiento cloud seguro mediante Netlify (EU-US Data Privacy Framework).</li>
                    <li><strong className="text-[#2A201D]">Conservación:</strong> Durante la relación activa con el salón o hasta que solicites la supresión, respetando los plazos legales exigibles.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2A201D]">
                    Sensibilidades (Art. 9 RGPD) y Fotografías Antes/Después
                  </h3>
                  <p>
                    Las alertas sobre alergias (acrilatos/HEMA, PPD, cosméticos) o piel/cutícula sensible se tratan de forma confidencial únicamente para tu seguridad en el servicio. Las fotografías internas de control evolutivo y la difusión en redes sociales (Reels/Instagram) requieren consentimientos separados y pueden revocarse en cualquier momento.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2A201D]">
                    Derechos ARSOPOL
                  </h3>
                  <p>
                    Puedes ejercer tus derechos de <strong className="text-[#2A201D]">Acceso, Rectificación, Supresión, Oposición, Portabilidad (descarga JSON) y Limitación</strong> ante {shopName} ({shopPhone}), así como revocar los avisos por WhatsApp o el permiso de redes sociales en cualquier instante. También puedes reclamar ante la Agencia Española de Protección de Datos (<span className="text-[#B86566] font-semibold">www.aepd.es</span>).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E4742]">
                    Aviso Legal y Datos del Titular (Ley 34/2002 LSSI-CE)
                  </h3>
                  <p>
                    En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), se ponen a disposición los datos identificativos del prestador de la plataforma:
                  </p>
                  <div className="p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] font-mono text-[11px] space-y-1 text-[#2A201D]">
                    <p><strong>Plataforma SaaS:</strong> LUMINA // BEAUTY &amp; SALON</p>
                    <p><strong>Titular / Prestador:</strong> [NOMBRE O RAZÓN SOCIAL DEL TITULAR]</p>
                    <p><strong>NIF / CIF:</strong> [NIF/CIF DEL AUTÓNOMO O SOCIEDAD]</p>
                    <p><strong>Domicilio fiscal:</strong> [DOMICILIO FISCAL COMPLETO, ESPAÑA]</p>
                    <p><strong>Email de contacto legal:</strong> [LEGAL@TUDOMINIO.ES]</p>
                    <p><strong>Salón activo:</strong> {shopName} ({shopAddress})</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF6F2] border border-[#E8B2AE] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9E3836] flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Exención Fiscal VeriFactu / RD 1007/2023
                  </h3>
                  <p className="text-[#7A2D2B]">
                    El módulo de caja diaria, venta de cosmética y cálculo de comisiones del equipo en <strong>LUMINA // BEAUTY &amp; SALON</strong> es exclusivamente una <strong>herramienta de control interno operativo</strong>. <strong>NO constituye un sistema informático de facturación (VeriFactu) ni emite tickets fiscales ni facturas legales</strong> válidas ante la AEAT.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2A201D]">
                    Responsabilidad de cada Salón
                  </h3>
                  <p>
                    Cada salón usuario es responsable de sus precios, obligaciones tributarias y de recabar el consentimiento informado digital de sus clientas antes de registrar datos de sensibilidad o fotografías.
                  </p>
                </div>
              </div>
            )}

            {!publicOnly && activeTab === 'dpa' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F7EAE7] border border-[#E5C5BE]">
                  <div>
                    <p className="text-xs font-bold text-[#2A201D]">
                      Contrato de Encargado del Tratamiento (Art. 28 RGPD)
                    </p>
                    <p className="text-[11px] text-[#8E4742]">
                      Salón: {shopName} · Slug: {safeSlug} · Fecha: {todayFormatted}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadDpa}
                      className="btn-editorial !py-2 !px-3.5 !text-xs cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Descargar Borrador DPA (.txt)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintDpa}
                      className="btn-silk !py-2 !px-3.5 !text-xs cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Imprimir / Guardar PDF</span>
                    </button>
                  </div>
                </div>

                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-[#EDF5F0] border border-[#BDD8C9] text-[#2B5944] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    <span>Borrador DPA descargado (DPA-Art28-{safeSlug}-{isoDate}.txt).</span>
                  </div>
                )}

                <pre
                  id="legal-dpa-printable"
                  className="p-4 rounded-2xl bg-white border border-[#E9D9CF] text-[11px] font-mono text-[#2A201D] whitespace-pre-wrap leading-relaxed"
                >
                  {dpaText}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-[#EFE3DB] flex items-center justify-between gap-2 no-print">
            <span className="text-[10px] text-[#9A847D]">
              Versión legal 2026.1 · RGPD / LOPDGDD / LSSI-CE
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-silk !py-2 !px-4 !text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
