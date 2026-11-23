import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Radio,
  Tv,
  Search,
  Image as ImageIcon,
  Star,
  QrCode,
  Lock,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import WalkInKioskModal from './WalkInKioskModal';
import CommandPalette from './CommandPalette';
import QRPosterModal, { SalonPinLockModal } from './QRPosterModal';
import LegalComplianceModal from './LegalComplianceModal';
import { useClients } from '../context/ClientContext';
import { useShop } from '../context/ShopContext';
import { soundFx } from '../lib/soundFx';

export const BEAUTY_WALLPAPER_THEMES = [
  {
    id: 'nails-atelier',
    name: 'Atelier de Uñas',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=85&w=1920',
    opacityClass: 'opacity-45',
  },
  {
    id: 'hair-editorial',
    name: 'Salón Peluquería',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=85&w=1920',
    opacityClass: 'opacity-45',
  },
  {
    id: 'spa-cabin',
    name: 'Cabina Facial & Spa',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=85&w=1920',
    opacityClass: 'opacity-45',
  },
  {
    id: 'ivory-silk',
    name: 'Marfil Seda Puro',
    url: null,
    opacityClass: 'opacity-0',
  },
];

const Layout = () => {
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isQRPosterOpen, setIsQRPosterOpen] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [wallpaperIdx, setWallpaperIdx] = useState(() => {
    try {
      const saved = localStorage.getItem('lumina_beauty_wallpaper_idx');
      const parsed = saved ? parseInt(saved, 10) : 0;
      return parsed >= 0 && parsed < BEAUTY_WALLPAPER_THEMES.length ? parsed : 0;
    } catch {
      return 0;
    }
  });

  const { clients, radarDueClients } = useClients();
  const {
    activeShop,
    activeShopSlug,
    activeVertical,
    switchShop,
    needsPinSync,
    verifyAndUnlockShopPin,
    toggleWalkInOpen,
  } = useShop();
  const walkInOpen = activeShop?.walkInOpen !== false;
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitchEdition = (edition) => {
    soundFx.playClick();
    soundFx.triggerHaptic(12);
    const nextIdx = edition === 'peluqueria' ? 1 : 0;
    setWallpaperIdx(nextIdx);
    try {
      localStorage.setItem('lumina_beauty_wallpaper_idx', String(nextIdx));
    } catch {
      // ignore
    }
    if (edition === 'peluqueria') {
      switchShop('peluqueria-estetica', '1234');
    } else {
      switchShop('campodonico-nails', '2023');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdKOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCycleWallpaper = () => {
    soundFx.playClick();
    soundFx.triggerHaptic(10);
    setWallpaperIdx((prev) => {
      const next = (prev + 1) % BEAUTY_WALLPAPER_THEMES.length;
      try {
        localStorage.setItem('lumina_beauty_wallpaper_idx', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const currentWallpaper = BEAUTY_WALLPAPER_THEMES[wallpaperIdx] || BEAUTY_WALLPAPER_THEMES[0];
  const starClient = clients[0];

  const mainNav = [
    { path: '/', icon: LayoutDashboard, label: 'Salón Hoy' },
    { path: '/clients', icon: Users, label: 'Clientas 3D' },
  ];

  return (
    <div className="flex h-screen min-h-[100dvh] bg-[#FAF6F2] text-[#2A201D] overflow-hidden relative">
      {/* Fondo Fotográfico Luminoso Editorial con Veladura Marfil Seda */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
        {currentWallpaper.url && (
          <img
            key={currentWallpaper.id}
            src={currentWallpaper.url}
            alt=""
            className={`w-full h-full object-cover object-center ${currentWallpaper.opacityClass} transition-all duration-700 ease-out`}
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F2]/80 via-[#FAF6F2]/65 to-[#FAF6F2]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(200,122,114,0.14),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(197,155,95,0.12),_transparent_55%)]" />
      </div>

      {/* Sidebar Escritorio — Quiet Luxury */}
      <aside className="hidden md:flex w-72 bg-white/84 backdrop-blur-md border-r border-[#E9D9CF] flex-col justify-between shadow-[6px_0_30px_rgba(74,48,42,0.06)] z-20">
        <div className="overflow-y-auto no-scrollbar">
          {/* Marca Editorial */}
          <div className="p-5 border-b border-[#EFE3DB]">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(184,101,102,0.45)] shrink-0">
                <Sparkles size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-serif font-bold tracking-wide text-[#2A201D] leading-none truncate">
                  LUMINA <span className="text-[#C87A72] font-normal italic">Beauty</span>
                </h1>
                <p className="text-[11px] text-[#6E5A54] mt-1 font-medium truncate">
                  {activeVertical === 'nails'
                    ? 'Uñas, Manicura, Pedicura & Spa'
                    : 'Peluquería & Estética (Sin Uñas)'}
                </p>
              </div>
            </div>

            {/* Selector 1-Clic de Edición Femenina */}
            <div className="mt-4 p-1.5 rounded-2xl bg-[#FAF4EE] border border-[#E9D9CF] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A847D] px-2 block">
                Edición Beauty (1 clic)
              </span>
              <button
                type="button"
                onClick={() => handleSwitchEdition('nails')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeVertical === 'nails'
                    ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                    : 'text-[#4A3934] hover:bg-white/80'
                }`}
              >
                <span className="truncate">💅 Uñas &amp; Manicura</span>
                {activeVertical === 'nails' && <span className="text-[9px] tracking-wider uppercase">Activo</span>}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchEdition('peluqueria')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeVertical === 'peluqueria'
                    ? 'bg-gradient-to-r from-[#C59B5F] to-[#B86566] text-white shadow-sm'
                    : 'text-[#4A3934] hover:bg-white/80'
                }`}
              >
                <span className="truncate">💇‍♀️ Peluquería &amp; Estética</span>
                {activeVertical === 'peluqueria' && <span className="text-[9px] tracking-wider uppercase">Activo</span>}
              </button>
            </div>

            {/* Estado del Salón */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                toggleWalkInOpen();
              }}
              className={`mt-3 w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                walkInOpen
                  ? 'bg-[#EDF5F0] border-[#5C8A74]/35 text-[#2D5744]'
                  : 'bg-[#F6EFE3] border-[#C59B5F]/45 text-[#7A5A28]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Radio size={14} className={walkInOpen ? 'text-[#5C8A74] animate-pulse' : 'text-[#C59B5F]'} />
                <span className="text-xs font-bold">
                  {walkInOpen ? 'Abierto · Acepta sin cita' : 'Solo con cita previa'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 border border-[#E9D9CF]">
                {walkInOpen ? 'ON' : 'VIP'}
              </span>
            </button>
          </div>

          {/* Navegación */}
          <nav className="p-4 space-y-2">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#9A847D]">
              Atelier Principal
            </p>
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => soundFx.playClick()}
                  className={({ isActive }) => {
                    const isTabActive = isActive || (item.path === '/' && location.pathname === '/dashboard');
                    return `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isTabActive
                        ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-[0_8px_18px_-6px_rgba(184,101,102,0.45)]'
                        : 'text-[#4A3934] hover:bg-[#FAF4EE] hover:text-[#2A201D]'
                    }`;
                  }}
                >
                  <span className="flex items-center space-x-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </span>
                  {item.path === '/clients' && radarDueClients.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#9E4E4D] border border-[#E9D9CF]">
                      {radarDueClients.length}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="pt-4">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9A847D]">
                Herramientas del Salón
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsQRPosterOpen(true);
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#F7EAE7] hover:bg-[#F3DFDA] border border-[#E5C5BE] flex items-center space-x-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#C87A72] text-white flex items-center justify-center shrink-0">
                    <QrCode size={17} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#2A201D] block leading-tight">Mi Cartel QR</span>
                    <span className="text-[11px] text-[#8E4742] block truncate">Reservas online clientas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsKioskOpen(true);
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-white/80 hover:bg-[#FAF4EE] border border-[#E9D9CF] flex items-center space-x-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F6EFE3] text-[#C59B5F] flex items-center justify-center shrink-0">
                    <Tv size={17} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#2A201D] block leading-tight">Pantalla Sala</span>
                    <span className="text-[11px] text-[#6E5A54] block truncate">Turnos en vivo en recepción</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    navigate('/admin');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 hover:bg-[#FAF4EE] border border-[#E9D9CF] flex items-center space-x-3 text-left transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FAF4EE] text-[#6E5A54] flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#4A3934] block leading-tight">Panel Súper-Admin</span>
                    <span className="text-[10px] text-[#9A847D] block truncate">Alta y gestión de salones</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Pie Sidebar */}
        <div className="p-4 border-t border-[#EFE3DB] space-y-2.5 bg-[#FFFDFB]/90">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              navigate(starClient ? `/clients/${starClient.id}` : '/clients');
            }}
            className="w-full px-3 py-2.5 rounded-xl bg-[#FAF4EE] hover:bg-[#F5E9E0] border border-[#E9D9CF] flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Star size={14} className="text-[#C59B5F] fill-[#C59B5F] shrink-0" />
              <span className="text-xs font-bold text-[#2A201D] truncate">
                {starClient ? `Ficha VIP: ${starClient.name.split(' ')[0]}` : 'Directorio 3D'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#B86566] shrink-0">Abrir →</span>
          </button>

          <div className="flex items-center justify-between px-1 text-[11px] text-[#6E5A54]">
            <span className="font-semibold truncate">{activeShop?.name || 'LUMINA BEAUTY'}</span>
            <span className={activeShop?.status === 'paused' ? 'text-[#B45309] font-semibold' : 'text-[#5C8A74] font-semibold'}>
              ● {activeShop?.status === 'paused' ? 'Pausado' : 'Activo'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsLegalOpen(true);
            }}
            className="w-full px-3 py-2 rounded-xl bg-white hover:bg-[#FAF4EE] border border-[#E9D9CF] text-[11px] font-bold text-[#6E5A54] hover:text-[#2A201D] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Scale size={13} className="text-[#C87A72]" />
            <span>Legal &amp; RGPD · DPA</span>
          </button>
        </div>
      </aside>

      {/* Zona Principal */}
      <div className="flex-1 flex flex-col h-screen min-h-[100dvh] overflow-hidden relative z-10 min-w-0">
        {/* Header Editorial Limpio (0px overflow en 375px y 390px) */}
        <header className="bg-white/82 backdrop-blur-md border-b border-[#E9D9CF] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 z-30">
          {/* Logo móvil */}
          <div className="flex items-center space-x-2 min-w-0 flex-1 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-serif font-bold text-[#2A201D] leading-tight truncate">
                {activeShop?.name || 'LUMINA BEAUTY'}
              </h1>
              <p className="text-[10px] font-semibold text-[#8E4742] truncate">
                {activeVertical === 'nails' ? 'Atelier Uñas & Manicura' : 'Peluquería & Estética'}
              </p>
            </div>
          </div>

          {/* Buscador rápido escritorio */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsCmdKOpen(true);
            }}
            className="hidden md:flex items-center justify-between flex-1 max-w-md px-4 py-2 rounded-xl bg-[#FAF6F2] hover:bg-white border border-[#E9D9CF] hover:border-[#C87A72] text-xs text-[#6E5A54] hover:text-[#2A201D] transition-all cursor-pointer"
          >
            <span className="flex items-center space-x-2.5 truncate">
              <Search size={15} className="text-[#C87A72]" />
              <span className="truncate">
                {activeVertical === 'nails'
                  ? 'Buscar clienta, forma de uña, esmalte o móvil...'
                  : 'Buscar clienta, fórmula de tinte, facial o móvil...'}
              </span>
            </span>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E9D9CF] text-[#9A847D] shrink-0">
              Ctrl + K
            </span>
          </button>

          {/* Acciones compactas */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <div className="hidden lg:flex px-3 py-2 min-h-[38px] rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-bold text-[#2A201D] items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${activeShop?.status === 'paused' ? 'bg-amber-500' : 'bg-[#5C8A74]'}`} />
              <span className="truncate max-w-[200px]">{activeShop?.name || activeShopSlug}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsQRPosterOpen(true);
              }}
              className="px-2.5 sm:px-3.5 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-[#C87A72] to-[#B86566] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm shrink-0"
              title="Ver e imprimir Mi Cartel QR"
            >
              <QrCode size={15} />
              <span className="text-[11px] sm:text-xs">Mi QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsCmdKOpen(true);
              }}
              className="md:hidden p-2 min-h-[38px] min-w-[36px] rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-[#4A3934] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Buscar clienta"
            >
              <Search size={15} />
            </button>

            <button
              type="button"
              onClick={handleCycleWallpaper}
              className="p-2 sm:px-3 sm:py-2 min-h-[38px] min-w-[36px] rounded-xl bg-[#FAF6F2] hover:bg-white border border-[#E9D9CF] hover:border-[#C87A72] text-xs font-bold text-[#2A201D] flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0"
              title="Cambiar fondo fotográfico"
              aria-label="Cambiar fondo"
            >
              <ImageIcon size={15} className="text-[#C87A72]" />
              <span className="hidden sm:inline">{currentWallpaper.name}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsLegalOpen(true);
              }}
              className="md:hidden p-2 min-h-[38px] min-w-[34px] rounded-xl bg-[#FAF6F2] hover:bg-white border border-[#E9D9CF] text-[#6E5A54] hover:text-[#B86566] flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Legal, RGPD y Contrato DPA"
              aria-label="Legal y RGPD"
            >
              <Scale size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsPinLocked(true);
              }}
              className="p-2 min-h-[38px] min-w-[34px] rounded-xl bg-[#FAF6F2] hover:bg-white border border-[#E9D9CF] text-[#6E5A54] hover:text-[#B86566] flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Bloquear pantalla con PIN"
              aria-label="Bloquear con PIN"
            >
              <Lock size={15} />
            </button>
          </div>
        </header>

        {/* Sub-barra Móvil de Conmutador de las 2 Ediciones Femeninas (1 clic, 0px overflow) */}
        <div className="md:hidden bg-[#FFFDFB]/92 backdrop-blur-sm border-b border-[#E9D9CF] px-3 py-1.5 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={() => handleSwitchEdition('nails')}
            className={`flex-1 px-2.5 py-1.5 min-h-[34px] rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeVertical === 'nails'
                ? 'bg-gradient-to-r from-[#C87A72] to-[#B86566] text-white shadow-sm'
                : 'bg-[#FAF4EE] text-[#4A3934] border border-[#E9D9CF]'
            }`}
          >
            💅 Uñas &amp; Manicura
          </button>
          <button
            type="button"
            onClick={() => handleSwitchEdition('peluqueria')}
            className={`flex-1 px-2.5 py-1.5 min-h-[34px] rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeVertical === 'peluqueria'
                ? 'bg-gradient-to-r from-[#C59B5F] to-[#B86566] text-white shadow-sm'
                : 'bg-[#FAF4EE] text-[#4A3934] border border-[#E9D9CF]'
            }`}
          >
            💇‍♀️ Peluquería &amp; Estética
          </button>
        </div>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-10 scroll-smooth">
          <div className="max-w-6xl mx-auto p-3.5 sm:p-6 lg:p-8">
            <Outlet
              context={{
                openKiosk: () => setIsKioskOpen(true),
                openQRPoster: () => setIsQRPosterOpen(true),
                lockScreen: () => setIsPinLocked(true),
                activeVertical,
                switchEdition: handleSwitchEdition,
              }}
            />
          </div>
        </main>

        {/* Barra de Navegación Inferior Móvil */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white/94 backdrop-blur-lg border-t border-[#E9D9CF] flex justify-around pt-2 px-2 z-40 shadow-[0_-6px_25px_rgba(74,48,42,0.08)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => soundFx.playClick()}
                className={({ isActive }) => {
                  const isTabActive = isActive || (item.path === '/' && location.pathname === '/dashboard');
                  return `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[64px] ${
                    isTabActive ? 'text-[#B86566] font-bold' : 'text-[#6E5A54]'
                  }`;
                }}
              >
                <Icon size={20} />
                <span className="text-[11px] mt-1">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsQRPosterOpen(true);
            }}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#6E5A54] hover:text-[#B86566] min-w-[64px]"
          >
            <QrCode size={20} />
            <span className="text-[11px] mt-1">Mi QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsKioskOpen(true);
            }}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#6E5A54] hover:text-[#B86566] min-w-[64px]"
          >
            <Tv size={20} />
            <span className="text-[11px] mt-1">Sala TV</span>
          </button>
        </nav>
      </div>

      {/* Modales */}
      <WalkInKioskModal isOpen={isKioskOpen} onClose={() => setIsKioskOpen(false)} />
      <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} />
      <QRPosterModal
        isOpen={isQRPosterOpen}
        onClose={() => setIsQRPosterOpen(false)}
        onLockScreen={() => setIsPinLocked(true)}
      />
      <LegalComplianceModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        shop={activeShop}
        shopSlug={activeShopSlug}
        publicOnly={false}
      />
      <SalonPinLockModal
        isOpen={isPinLocked || needsPinSync}
        expectedPin={activeShop?.pin || '2023'}
        shopName={activeShop?.name || 'LUMINA BEAUTY'}
        onVerifyPin={verifyAndUnlockShopPin}
        onCancel={isPinLocked && !needsPinSync ? () => setIsPinLocked(false) : null}
        onUnlock={() => setIsPinLocked(false)}
      />
    </div>
  );
};

export default Layout;
