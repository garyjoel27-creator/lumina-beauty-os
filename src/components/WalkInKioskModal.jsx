import React from 'react';
import { X, Sparkles, Clock, QrCode } from 'lucide-react';
import { useClients } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import { buildCustomerPortalUrl } from '../lib/shopUtils';

const WalkInKioskModal = ({ isOpen, onClose }) => {
  const { walkInQueue } = useClients();
  const { activeShop, activeShopSlug } = useShop();

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lumina-beauty-gary.netlify.app';
  const portalUrl = buildCustomerPortalUrl(origin, activeShopSlug);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=2A201D&bgcolor=FFFDFB&data=${encodeURIComponent(portalUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF6F2] text-[#2A201D] flex flex-col p-6 sm:p-10 overflow-y-auto">
      <div className="flex items-center justify-between pb-6 border-b border-[#E9D9CF]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center shadow-md">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C59B5F]">SALA DE ESPERA EN VIVO</p>
            <h2 className="text-3xl font-serif font-bold text-[#2A201D]">{activeShop?.name}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-white border border-[#E9D9CF] text-xs font-bold text-[#4A3934] flex items-center gap-1.5 cursor-pointer"
        >
          <X size={16} />
          <span>Salir Modo TV</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 pearl-card p-6">
          <h3 className="text-2xl font-serif font-bold text-[#2A201D] mb-4">Próximos Turnos en Salón</h3>
          {walkInQueue.length === 0 ? (
            <div className="py-16 text-center text-[#6E5A54]">
              <p className="text-xl font-serif italic">Sin espera en este momento ✨</p>
              <p className="text-xs mt-2">Escanea el QR para reservar tu cita o apuntarte al turno express.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walkInQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-[#C87A72] text-white font-serif font-bold text-lg flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-lg font-bold text-[#2A201D]">{item.name}</p>
                      <p className="text-xs text-[#6E5A54]">{item.service} · {item.barber || 'Especialista'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#E9D9CF] text-xs font-bold text-[#8E4742] flex items-center gap-1">
                    <Clock size={13} /> ~{(idx + 1) * 20} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pearl-card p-6 flex flex-col items-center justify-center text-center">
          <QrCode size={22} className="text-[#C87A72] mb-2" />
          <h3 className="text-2xl font-serif font-bold text-[#2A201D]">Reserva desde tu móvil</h3>
          <p className="text-xs text-[#6E5A54] mt-1 mb-5">Elige tratamiento, especialista y hora en 20 segundos</p>
          <div className="p-4 rounded-3xl bg-white border-2 border-[#E9D9CF] shadow-md">
            <img src={qrUrl} alt="QR reservas" className="w-48 h-48 rounded-xl" />
          </div>
          <p className="text-xs font-bold text-[#B86566] mt-4">@{activeShop?.instagramSalon || 'lumina.beauty'}</p>
        </div>
      </div>
    </div>
  );
};

export default WalkInKioskModal;
