import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Lock,
  AtSign,
  MapPin,
  MessageCircle,
  QrCode,
  Link2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import {
  buildCustomerPortalUrl,
  buildWhatsAppAutoReplyTemplate,
  buildWhatsAppUrl,
} from '../lib/shopUtils';
import { soundFx } from '../lib/soundFx';

export const SalonPinLockModal = ({
  isOpen,
  expectedPin = '2023',
  shopName = 'LUMINA BEAUTY',
  onVerifyPin,
  onCancel,
  onUnlock,
}) => {
  const [digits, setDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleDigit = async (d) => {
    if (checking || digits.length >= 4) return;
    soundFx.playClick();
    const next = digits + d;
    setDigits(next);
    setErrorMsg('');

    if (next.length === 4) {
      setChecking(true);
      let ok = false;
      let errText = '';
      if (onVerifyPin) {
        const res = await onVerifyPin(next);
        ok = Boolean(res?.success);
        errText = res?.error || '';
      } else {
        ok = next === String(expectedPin);
      }
      setChecking(false);
      if (ok) {
        soundFx.playSuccess();
        setDigits('');
        onUnlock?.();
      } else {
        soundFx.playAlert();
        setErrorMsg(errText || 'PIN incorrecto. Inténtalo de nuevo.');
        setTimeout(() => setDigits(''), 400);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#FAF6F2]/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-full max-w-sm pearl-card p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center mx-auto shadow-md">
          <Lock size={22} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-[#2A201D] mt-3">{shopName}</h3>
        <p className="text-xs text-[#6E5A54] mt-1">Introduce tu PIN de 4 dígitos para acceder al panel</p>

        <div className="flex justify-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-mono font-bold transition-all ${
                digits[idx]
                  ? 'border-[#C87A72] bg-[#F7EAE7] text-[#8E4742]'
                  : 'border-[#E9D9CF] bg-[#FAF6F2] text-[#9A847D]'
              }`}
            >
              {digits[idx] ? '●' : ''}
            </div>
          ))}
        </div>

        {errorMsg && <p className="text-xs font-bold text-[#9E3836] mb-3">{errorMsg}</p>}

        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, idx) =>
            k === '' ? (
              <div key={idx} />
            ) : (
              <button
                key={idx}
                type="button"
                onClick={() => (k === '⌫' ? setDigits((p) => p.slice(0, -1)) : handleDigit(k))}
                className="h-12 rounded-xl bg-[#FAF6F2] hover:bg-[#F3E6DC] border border-[#E9D9CF] text-base font-bold text-[#2A201D] cursor-pointer transition-all"
              >
                {k}
              </button>
            )
          )}
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-xs font-bold text-[#6E5A54] hover:text-[#2A201D] cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

const QRPosterModal = ({ isOpen, onClose, onLockScreen }) => {
  const { activeShop, activeShopSlug, activeVertical } = useShop();
  const [activeTab, setActiveTab] = useState('share'); // 'share' | 'qr'
  const [copied, setCopied] = useState(false);
  const [copiedAutoReply, setCopiedAutoReply] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lumina-beauty-gary.netlify.app';
  const portalUrl = buildCustomerPortalUrl(origin, activeShopSlug);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&color=2A201D&bgcolor=FFFDFB&data=${encodeURIComponent(portalUrl)}`;
  const waAutoReply = buildWhatsAppAutoReplyTemplate(activeShop?.name || 'nuestro salón', portalUrl);

  const handleCopy = async () => {
    soundFx.playClick();
    try {
      await navigator.clipboard.writeText(portalUrl);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyAutoReply = async () => {
    soundFx.playClick();
    try {
      await navigator.clipboard.writeText(waAutoReply);
    } catch {
      // ignore
    }
    setCopiedAutoReply(true);
    setTimeout(() => setCopiedAutoReply(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A201D]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl overflow-hidden shadow-2xl my-auto">
        <div className="px-5 py-4 bg-[#FAF4EE] border-b border-[#E9D9CF] flex items-center justify-between no-print">
          <div>
            <span className="text-sm font-bold text-[#2A201D] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#C87A72]" />
              Cómo reservan mis clientas
            </span>
            <p className="text-xs text-[#6E5A54] mt-0.5">
              Para que repitan desde casa sin volver a escanear el QR
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar compartir reservas"
            className="p-2 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector claro de 2 pestañas */}
        <div className="p-2.5 bg-white border-b border-[#EFE3DB] grid grid-cols-2 gap-2 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'share'
                ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                : 'bg-[#FAF4EE] text-[#4A3934]'
            }`}
          >
            <Link2 size={15} />
            <span>Sin QR (Recomendado)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'qr'
                ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                : 'bg-[#FAF4EE] text-[#4A3934]'
            }`}
          >
            <QrCode size={15} />
            <span>Cartel QR Local</span>
          </button>
        </div>

        {activeTab === 'share' ? (
          <div className="p-5 space-y-4 bg-[#FAF6F2]/40">
            {/* Ancla 1: Instagram y Google Maps */}
            <div className="p-4 rounded-2xl bg-white border border-[#E9D9CF] space-y-2.5">
              <p className="text-sm font-bold text-[#2A201D]">
                1. Ponlo en tu Instagram y Google Maps (1 sola vez)
              </p>
              <p className="text-xs text-[#6E5A54] leading-relaxed">
                Así, cuando una clienta busque tu salón en Instagram o Google, toca el enlace y reserva directa sin escribirte.
              </p>
              <div className="px-3 py-2.5 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] text-xs font-mono text-[#4A3934] break-all">
                {portalUrl}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleCopy} className="btn-editorial py-2.5 cursor-pointer">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
                </button>
                <a
                  href={buildWhatsAppUrl('', waAutoReply)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-silk py-2.5 justify-center"
                >
                  <MessageCircle size={15} className="text-[#5C8A74]" />
                  <span>Mandar por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Ancla 2: Respuesta automática WhatsApp Business */}
            <div className="p-4 rounded-2xl bg-[#EDF5F0] border border-[#CFE3D6] space-y-2.5">
              <p className="text-sm font-bold text-[#234A38]">
                2. Truco estrella: Respuesta automática de WhatsApp Business
              </p>
              <p className="text-xs text-[#2D5744] leading-relaxed">
                Copia este texto en <strong>WhatsApp Business → Mensaje de bienvenida</strong>. Cada vez que una clienta pregunte "¿tienes hueco?", WhatsApp le mandará tu enlace sola.
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#D4E4DA] text-xs text-[#2A201D] whitespace-pre-line leading-relaxed">
                {waAutoReply}
              </div>
              <button
                type="button"
                data-testid="copy-wa-autoreply-btn"
                onClick={handleCopyAutoReply}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5C8A74] hover:bg-[#4C7863] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {copiedAutoReply ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedAutoReply ? '¡Texto copiado! Pégalo en WhatsApp Business' : 'Copiar texto automático de WhatsApp'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-silk flex-1 justify-center py-2.5"
              >
                <ExternalLink size={15} />
                <span>Probar cómo reserva una clienta</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Cartel Editorial Imprimible */}
            <div className="p-6 text-center bg-gradient-to-b from-[#FFFDFB] via-[#FAF6F2] to-[#F7EAE7]/50">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59B5F]">
                {activeVertical === 'nails' ? 'ATELIER DE UÑAS & SPA' : 'PELUQUERÍA & ESTÉTICA'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A201D] mt-1">
                {activeShop?.name || 'LUMINA BEAUTY'}
              </h2>
              <p className="text-sm text-[#6E5A54] mt-1">
                Escanea el código para reservar tu cita en segundos ✨
              </p>

              <div className="mt-4 inline-block p-4 rounded-3xl bg-white border-2 border-[#E9D9CF] shadow-[0_14px_30px_-10px_rgba(184,101,102,0.2)]">
                <img src={qrImageUrl} alt="Código QR de reservas" className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl" />
              </div>

              <div className="mt-3 space-y-1 text-xs text-[#6E5A54]">
                {activeShop?.instagramSalon && (
                  <p className="font-bold text-[#B86566] flex items-center justify-center gap-1">
                    <AtSign size={13} /> {activeShop.instagramSalon}
                  </p>
                )}
                {activeShop?.address && (
                  <p className="flex items-center justify-center gap-1">
                    <MapPin size={12} className="text-[#C59B5F]" /> {activeShop.address}
                  </p>
                )}
              </div>

              <div className="mt-3 px-3 py-2 rounded-xl bg-white/90 border border-[#E9D9CF] text-xs font-mono text-[#6E5A54] break-all">
                {portalUrl}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#EFE3DB] flex flex-wrap gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-editorial flex-1 py-2.5 cursor-pointer"
              >
                <Printer size={16} />
                <span>Imprimir Cartel</span>
              </button>

              <button type="button" onClick={handleCopy} className="btn-silk py-2.5 cursor-pointer">
                {copied ? <Check size={15} className="text-[#5C8A74]" /> : <Copy size={15} />}
                <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
              </button>
            </div>
          </>
        )}

        {onLockScreen && (
          <div className="px-4 py-2.5 bg-[#FAF4EE] border-t border-[#EFE3DB] text-center no-print">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockScreen();
              }}
              className="text-xs font-bold text-[#6E5A54] hover:text-[#2A201D] cursor-pointer"
            >
              🔒 Bloquear pantalla con PIN del salón
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPosterModal;
