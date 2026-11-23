import React, { useState } from 'react';
import { X, Printer, Copy, Check, ExternalLink, Sparkles, Lock, AtSign, MapPin } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { buildCustomerPortalUrl } from '../lib/shopUtils';
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
      if (onVerifyPin) {
        const res = await onVerifyPin(next);
        ok = Boolean(res?.success);
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
        setErrorMsg('PIN incorrecto. Inténtalo de nuevo.');
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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lumina-beauty-gary.netlify.app';
  const portalUrl = buildCustomerPortalUrl(origin, activeShopSlug);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&color=2A201D&bgcolor=FFFDFB&data=${encodeURIComponent(portalUrl)}`;

  const handleCopy = async () => {
    soundFx.playClick();
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A201D]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-md bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl overflow-hidden shadow-2xl my-auto">
        <div className="px-5 py-3.5 bg-[#FAF4EE] border-b border-[#E9D9CF] flex items-center justify-between no-print">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E4742] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#C87A72]" />
            Mi Cartel QR · Reservas Clientas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cartel Editorial Imprimible */}
        <div className="p-6 text-center bg-gradient-to-b from-[#FFFDFB] via-[#FAF6F2] to-[#F7EAE7]/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C59B5F]">
            {activeVertical === 'nails' ? 'ATELIER DE UÑAS & SPA' : 'PELUQUERÍA & ESTÉTICA'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A201D] mt-1">
            {activeShop?.name || 'LUMINA BEAUTY'}
          </h2>
          <p className="text-xs text-[#6E5A54] mt-1">
            Escanea el código para reservar tu cita en segundos ✨
          </p>

          <div className="mt-5 inline-block p-4 rounded-3xl bg-white border-2 border-[#E9D9CF] shadow-[0_14px_30px_-10px_rgba(184,101,102,0.2)]">
            <img src={qrImageUrl} alt="Código QR de reservas" className="w-52 h-52 sm:w-56 sm:h-56 mx-auto rounded-xl" />
          </div>

          <div className="mt-4 space-y-1 text-xs text-[#6E5A54]">
            {activeShop?.instagramSalon && (
              <p className="font-bold text-[#B86566] flex items-center justify-center gap-1">
                <AtSign size={13} /> {activeShop.instagramSalon}
              </p>
            )}
            {activeShop?.address && (
              <p className="text-[11px] flex items-center justify-center gap-1">
                <MapPin size={12} className="text-[#C59B5F]" /> {activeShop.address}
              </p>
            )}
          </div>

          <div className="mt-4 px-3 py-2 rounded-xl bg-white/90 border border-[#E9D9CF] text-[11px] font-mono text-[#6E5A54] break-all">
            {portalUrl}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-[#EFE3DB] flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-editorial flex-1 cursor-pointer"
          >
            <Printer size={15} />
            <span>Imprimir Cartel</span>
          </button>

          <button type="button" onClick={handleCopy} className="btn-silk cursor-pointer">
            {copied ? <Check size={14} className="text-[#5C8A74]" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
          </button>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-silk"
          >
            <ExternalLink size={14} />
            <span>Abrir Portal</span>
          </a>

          {onLockScreen && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockScreen();
              }}
              className="w-full py-2 text-[11px] font-bold text-[#9A847D] hover:text-[#2A201D] cursor-pointer"
            >
              🔒 Bloquear pantalla con PIN del salón
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRPosterModal;
