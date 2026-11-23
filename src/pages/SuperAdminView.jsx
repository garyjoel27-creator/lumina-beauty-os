import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Plus,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Edit3,
  ArrowLeft,
  Check,
  X,
  Copy,
  Scale,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import LegalComplianceModal from '../components/LegalComplianceModal';
import {
  SHOP_CAMPODONICO_NAILS_CONFIG,
  SHOP_PELUQUERIA_ESTETICA_CONFIG,
  normalizeShopSlug,
} from '../lib/shopUtils';

const VALID_LOCAL_KEYS = new Set([
  'lumina-beauty-admin-2026',
  'lumina-superadmin-2026',
  'kutz-superadmin-2026',
  'kutz-super-admin-2026',
]);

const SuperAdminView = () => {
  const { shopsList, refreshShops, createShop, updateShop, toggleShopStatus, isLoading } = useShop();
  const [adminKey, setAdminKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');

  const [newForm, setNewForm] = useState({
    name: '',
    slug: '',
    vertical: 'nails',
    pin: '2026',
    phone: '',
    address: '',
    instagramSalon: '',
  });
  const [statusMsg, setStatusMsg] = useState('');
  const [editingShop, setEditingShop] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState('');
  const [dpaShop, setDpaShop] = useState(null);

  const handleCopyCleanPanelUrl = async (slug) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lumina-beauty-gary.netlify.app';
    // Clean URL omitting secret PIN query parameter
    const url = `${origin}/?shop=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // ignore
    }
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(''), 2000);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    const key = adminKey.trim();
    if (!VALID_LOCAL_KEYS.has(key)) {
      setAuthError('Clave maestra incorrecta. Verifica tus credenciales de Super-Admin.');
      return;
    }
    const res = await refreshShops(key);
    if (res?.status === 401) {
      setAuthError('Clave maestra rechazada por el servidor.');
      return;
    }
    setUnlocked(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    const cleanSlug = normalizeShopSlug(newForm.slug || newForm.name);
    const tpl = newForm.vertical === 'peluqueria' ? SHOP_PELUQUERIA_ESTETICA_CONFIG : SHOP_CAMPODONICO_NAILS_CONFIG;
    const res = await createShop(
      {
        slug: cleanSlug,
        name: newForm.name.trim(),
        vertical: newForm.vertical,
        pin: newForm.pin.trim(),
        phone: newForm.phone.trim(),
        address: newForm.address.trim(),
        instagramSalon: newForm.instagramSalon.trim().replace(/^@/, ''),
        barbers: tpl.barbers,
        services: tpl.services,
        schedule: tpl.schedule,
      },
      adminKey.trim()
    );
    if (res?.success) {
      setStatusMsg(`✅ Salón "${newForm.name}" creado con slug /?shop=${cleanSlug}`);
      setNewForm({ name: '', slug: '', vertical: 'nails', pin: '2026', phone: '', address: '', instagramSalon: '' });
      setSlugTouched(false);
    } else {
      setStatusMsg(`⚠️ ${res?.error || 'Error al crear salón'}`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingShop) return;
    if (!/^\d{4}$/.test(String(editingShop.pin || '').trim())) {
      setStatusMsg('⚠️ El PIN del salón debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    const res = await updateShop(
      editingShop.slug,
      {
        name: editingShop.name,
        pin: String(editingShop.pin).trim(),
        phone: editingShop.phone,
        address: editingShop.address,
        instagramSalon: String(editingShop.instagramSalon || '').replace(/^@/, ''),
        vertical: editingShop.vertical,
      },
      adminKey.trim()
    );
    if (res?.success) {
      setEditingShop(null);
      setStatusMsg(`✅ Salón "${editingShop.name}" actualizado.`);
    } else {
      setStatusMsg(`⚠️ ${res?.error || 'No se pudo actualizar el salón'}`);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF6F2] text-[#2A201D] flex items-center justify-center p-4">
        <form onSubmit={handleUnlock} className="w-full max-w-md pearl-card p-7 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C87A72] to-[#C59B5F] text-white flex items-center justify-center shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C59B5F]">
              LUMINA // BEAUTY &amp; SALON
            </p>
            <h1 className="text-3xl font-serif font-bold text-[#2A201D] mt-1">Panel Súper-Admin</h1>
            <p className="text-xs text-[#6E5A54] mt-1">
              Alta, edición y pausa de salones de uñas, peluquería y estética.
            </p>
          </div>

          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Introduce la clave maestra de Super-Admin"
            className="w-full px-4 py-3 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-sm"
            required
          />

          {authError && <p className="text-xs font-bold text-[#9E3836]">{authError}</p>}

          <button type="submit" className="btn-editorial w-full py-3 cursor-pointer">
            <Sparkles size={15} /> Acceder al Panel Maestro
          </button>

          <Link to="/" className="block text-center text-xs font-bold text-[#6E5A54] hover:text-[#2A201D]">
            ← Volver al Salón
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF6F2] text-[#2A201D] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C59B5F]">
              LUMINA // BEAUTY MULTI-SALÓN
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A201D]">
              Gestión de Salones de Belleza
            </h1>
          </div>
          <Link to="/" className="btn-silk">
            <ArrowLeft size={15} /> Volver al Salón
          </Link>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#E9D9CF] text-xs font-bold text-[#2A201D]">
            {statusMsg}
          </div>
        )}

        {/* Alta Nuevo Salón */}
        <form onSubmit={handleCreate} className="pearl-card p-5 space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#2A201D] flex items-center gap-2">
            <Plus size={17} className="text-[#C87A72]" /> Dar de Alta Nuevo Salón Beauty
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newForm.name}
              onChange={(e) =>
                setNewForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: slugTouched ? f.slug : normalizeShopSlug(e.target.value),
                }))
              }
              placeholder="Nombre del salón (ej. Studio Rose)"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
            />
            <input
              type="text"
              required
              value={newForm.slug}
              onChange={(e) => {
                setSlugTouched(Boolean(e.target.value.trim()));
                setNewForm((f) => ({ ...f, slug: normalizeShopSlug(e.target.value) }));
              }}
              placeholder="slug-url (ej. studio-rose)"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-mono"
            />
            <select
              value={newForm.vertical}
              onChange={(e) => setNewForm((f) => ({ ...f, vertical: e.target.value }))}
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-bold"
            >
              <option value="nails">💅 Uñas, Manicura &amp; Pedicura</option>
              <option value="peluqueria">💇‍♀️ Peluquería &amp; Estética (Sin Uñas)</option>
            </select>
            <input
              type="text"
              required
              maxLength={4}
              value={newForm.pin}
              onChange={(e) => setNewForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
              placeholder="PIN 4 dígitos"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-mono"
            />
            <input
              type="tel"
              value={newForm.phone}
              onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Teléfono WhatsApp"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
            />
            <input
              type="text"
              value={newForm.address}
              onChange={(e) => setNewForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Dirección completa"
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-editorial cursor-pointer">
            <Plus size={15} /> Provisionar Salón Independiente
          </button>
        </form>

        {/* Lista de Salones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopsList.map((s) => {
            const paused = String(s.status || '').toLowerCase() === 'paused';
            return (
              <div key={s.slug} className="pearl-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B5F]">
                      {s.vertical === 'peluqueria' ? '💇‍♀️ Peluquería & Estética' : '💅 Uñas & Manicura'}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#2A201D]">{s.name}</h3>
                    <p className="text-xs font-mono text-[#6E5A54]">
                      slug: {s.slug} · PIN: {s.pin || '****'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      paused ? 'bg-[#FDECEB] text-[#9E3836]' : 'bg-[#EDF5F0] text-[#366852]'
                    }`}
                  >
                    {paused ? 'PAUSADO' : 'ACTIVO'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#EFE3DB]">
                  <a href={`/?shop=${s.slug}`} className="btn-silk !py-1.5 !px-3 !text-xs">
                    <ExternalLink size={13} /> Panel
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyCleanPanelUrl(s.slug)}
                    className="btn-silk !py-1.5 !px-3 !text-xs cursor-pointer"
                    title="Copiar URL limpia del panel privado (sin PIN en la URL)"
                  >
                    {copiedSlug === s.slug ? <Check size={13} className="text-[#5C8A74]" /> : <Copy size={13} />}
                    <span>{copiedSlug === s.slug ? 'Copiado' : 'Link Panel'}</span>
                  </button>
                  <a href={`/r/${s.slug}`} target="_blank" rel="noopener noreferrer" className="btn-silk !py-1.5 !px-3 !text-xs">
                    <ExternalLink size={13} /> Portal QR
                  </a>
                  <button
                    type="button"
                    onClick={() => setDpaShop(s)}
                    className="btn-silk !py-1.5 !px-3 !text-xs cursor-pointer"
                  >
                    <Scale size={13} className="text-[#C87A72]" /> DPA Art. 28
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingShop({ ...s })}
                    className="btn-silk !py-1.5 !px-3 !text-xs cursor-pointer"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleShopStatus(s.slug, adminKey.trim())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      paused
                        ? 'bg-[#EDF5F0] text-[#2B5944] border border-[#BDD8C9]'
                        : 'bg-[#FDECEB] text-[#9E3836] border border-[#E8B2AE]'
                    }`}
                  >
                    {paused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                    <span>{paused ? 'Reactivar' : 'Pausar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Editar Salón */}
        {editingShop && (
          <div className="fixed inset-0 z-50 bg-[#2A201D]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveEdit} className="w-full max-w-md bg-[#FFFDFB] border border-[#E9D9CF] rounded-3xl p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE3DB]">
                <h3 className="text-xl font-serif font-bold">Editar Salón ({editingShop.slug})</h3>
                <button type="button" onClick={() => setEditingShop(null)} className="p-1.5 rounded-xl bg-[#FAF4EE]">
                  <X size={15} />
                </button>
              </div>
              <input
                type="text"
                value={editingShop.name || ''}
                onChange={(e) => setEditingShop((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
                placeholder="Nombre"
              />
              <input
                type="text"
                maxLength={4}
                value={editingShop.pin || ''}
                onChange={(e) => setEditingShop((p) => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-mono"
                placeholder="PIN 4 dígitos"
              />
              <input
                type="text"
                value={editingShop.phone || ''}
                onChange={(e) => setEditingShop((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
                placeholder="Teléfono"
              />
              <input
                type="text"
                value={editingShop.address || ''}
                onChange={(e) => setEditingShop((p) => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
                placeholder="Dirección"
              />
              <select
                value={editingShop.vertical || 'nails'}
                onChange={(e) => setEditingShop((p) => ({ ...p, vertical: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs font-bold"
              >
                <option value="nails">💅 Uñas, Manicura &amp; Pedicura</option>
                <option value="peluqueria">💇‍♀️ Peluquería &amp; Estética (Sin Uñas)</option>
              </select>
              <input
                type="text"
                value={editingShop.instagramSalon || ''}
                onChange={(e) => setEditingShop((p) => ({ ...p, instagramSalon: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E9D9CF] text-xs"
                placeholder="Instagram (sin @)"
              />
              <button type="submit" className="btn-editorial w-full py-2.5 cursor-pointer">
                <Check size={15} /> Guardar Cambios
              </button>
            </form>
          </div>
        )}
      </div>

      <LegalComplianceModal
        isOpen={Boolean(dpaShop)}
        onClose={() => setDpaShop(null)}
        shop={dpaShop}
        shopSlug={dpaShop?.slug || 'campodonico-nails'}
        publicOnly={false}
        initialTab="dpa"
      />
    </div>
  );
};

export default SuperAdminView;
