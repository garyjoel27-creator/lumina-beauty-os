import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Sparkles } from 'lucide-react';
import { useClients, getRetentionRadarAlert } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import ClientBentoCard from '../components/ClientBentoCard';
import ClientModal from '../components/ClientModal';
import { soundFx } from '../lib/soundFx';

const Clients = () => {
  const { clients, addClient, repeatLastSessionToday } = useClients();
  const { activeVertical, activeShop } = useShop();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | radar | vip
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isNails = activeVertical === 'nails';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter === 'radar' && !getRetentionRadarAlert(c, activeVertical).dueNow) return false;
      if (filter === 'vip' && (!c.bonos || c.bonos.length === 0)) return false;
      if (!q) return true;
      const hay = [
        c.name,
        c.phone,
        c.treatment,
        c.nailShape,
        c.nailColor,
        c.colorFormula,
        c.allergyAlert,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search, filter, activeVertical]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C59B5F] flex items-center gap-1.5">
            <Sparkles size={13} />
            {isNails ? 'Fichas 3D · Diseños de Uñas & Esmaltes' : 'Fichas 3D · Colorimetría & Cabina Facial'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A201D] mt-0.5">
            Clientas VIP · {activeShop?.name?.split('·')[0]}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsModalOpen(true);
          }}
          className="btn-editorial cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Nueva Clienta</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="pearl-card p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 px-3 py-2 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF]">
          <Search size={16} className="text-[#C87A72] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isNails
                ? 'Buscar por nombre, Almendra, Baby Boomer, Milky White...'
                : 'Buscar por nombre, Balayage, Base 7.1, Vitamina C...'
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#2A201D] outline-none placeholder:text-[#9A847D] min-w-0"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: `Todas (${clients.length})` },
            { id: 'radar', label: isNails ? 'Radar Relleno' : 'Radar Retoque' },
            { id: 'vip', label: 'Con Bono VIP' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#C87A72] text-white'
                  : 'bg-[#FAF4EE] text-[#6E5A54] border border-[#E9D9CF] hover:text-[#2A201D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas 3D */}
      {filtered.length === 0 ? (
        <div className="pearl-card p-10 text-center">
          <p className="text-xl font-serif italic text-[#6E5A54]">
            No encontramos clientas con ese filtro.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-editorial mt-4 cursor-pointer"
          >
            <UserPlus size={15} /> Crear Primera Ficha 3D
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ClientBentoCard
              key={c.id}
              client={c}
              vertical={activeVertical}
              onRepeatToday={repeatLastSessionToday}
            />
          ))}
        </div>
      )}

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addClient}
        vertical={activeVertical}
      />
    </div>
  );
};

export default Clients;
