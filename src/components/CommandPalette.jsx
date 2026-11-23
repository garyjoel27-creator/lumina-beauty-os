import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, ArrowRight } from 'lucide-react';
import { useClients } from '../context/ClientContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { clients } = useClients();
  const navigate = useNavigate();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 5);
    return clients.filter((c) => {
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
  }, [clients, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2A201D]/35 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#EFE3DB] gap-2.5">
          <Search size={18} className="text-[#C87A72]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clienta, esmalte, tinte, móvil..."
            className="flex-1 bg-transparent text-sm text-[#2A201D] outline-none placeholder:text-[#9A847D]"
          />
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#6E5A54] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 max-h-80 overflow-y-auto space-y-1.5">
          {matches.length === 0 ? (
            <p className="text-xs text-center text-[#9A847D] py-6">Sin resultados para “{query}”.</p>
          ) : (
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  navigate(`/clients/${c.id}`);
                  onClose();
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-[#FAF4EE] flex items-center justify-between text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F7EAE7] text-[#B86566] flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2A201D] truncate">{c.name}</p>
                    <p className="text-[11px] text-[#6E5A54] truncate">
                      {c.nailShape ? `${c.nailShape} · ${c.nailColor}` : c.colorFormula || c.treatment}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#C87A72] shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
