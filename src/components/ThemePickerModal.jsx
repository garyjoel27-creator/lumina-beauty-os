import React from 'react';
import { X, Palette, Check, Sparkles } from 'lucide-react';
import { BEAUTY_THEMES } from '../lib/shopUtils';
import { useShop } from '../context/ShopContext';
import { soundFx } from '../lib/soundFx';

const ThemePickerModal = ({ isOpen, onClose }) => {
  const { activeThemeId, setShopTheme, activeShop } = useShop();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2A201D]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        data-testid="theme-picker-modal"
        className="w-full max-w-md bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl overflow-hidden shadow-2xl my-auto"
      >
        <div className="px-5 py-4 bg-[#FAF4EE] border-b border-[#E9D9CF] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2A201D] flex items-center gap-2">
              <Palette size={18} className="text-[#C87A72]" />
              <span>Estilo y Colores del Salón</span>
            </h2>
            <p className="text-xs text-[#6E5A54] mt-0.5">
              Personaliza {activeShop?.name || 'tu salón'} en 1 toque
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de estilo"
            className="p-2 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {BEAUTY_THEMES.map((theme) => {
            const isSelected = activeThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                data-testid={`theme-option-${theme.id}`}
                onClick={() => {
                  soundFx.playClick();
                  setShopTheme(theme.id);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F7EAE7] border-[#C87A72] shadow-sm'
                    : 'bg-white border-[#E9D9CF] hover:border-[#C87A72]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1.5 shrink-0">
                    {theme.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#2A201D] block truncate">
                      {theme.name}
                    </span>
                    <span className="text-xs text-[#6E5A54] block truncate">
                      {theme.tagline}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-7 h-7 rounded-full bg-[#C87A72] text-white flex items-center justify-center shrink-0">
                    <Check size={15} />
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-3 p-3 rounded-xl bg-[#FAF4EE] border border-[#E9D9CF] text-xs text-[#6E5A54] flex items-start gap-2">
            <Sparkles size={15} className="text-[#C59B5F] shrink-0 mt-0.5" />
            <span>
              El estilo elegido se guarda para este salón y se aplica también en el portal de reservas de tus clientas.
            </span>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-white border-t border-[#EFE3DB]">
          <button
            type="button"
            onClick={onClose}
            className="btn-editorial w-full py-3 cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemePickerModal;
