# LUMINA // BEAUTY & SALON

Plataforma PWA editorial (*Quiet Luxury*) 100 % independiente para **Salones de Uñas, Manicura, Pedicura, Peluquería Femenina y Cabinas de Estética**.

Diseñada con paleta luminosa **Crema Seda / Marfil (`#FAF6F2`)**, tarjetas **Cristal Perla (`rgba(255,255,255,0.84)`)**, tipografía editorial (`Cormorant Garamond`, `Playfair Display`, `Plus Jakarta Sans`), texto espresso WCAG AAA (`#2A201D`) y acentos **Rosa Empolvado (`#C87A72`)** y **Champagne Dorado (`#C59B5F`)**.

## Ediciones Incluidas (Conmutables en 1 Clic + Aisladas por URL)

1. **💅 Edición Uñas, Manicura & Pedicura (`campodonico-nails`)**
   - **CM Salón D’ Campodónico · Nails & Beauty** (Arrecife, Lanzarote · Tel. `638 877 945` · `@cm.salondcampodonico` · PIN `2023`).
   - 10 servicios reales (Acrílicas Talla S / M-L, Relleno, Manicura Semipermanente con Refuerzo, Pedicura Spa, Retiros, Reparación e Higiene Facial).
   - Tarjetas 3D con selector visual de **forma de uña** (*Almendra*, *Coffin / Bailarina*, *Cuadrada*, *Stiletto*), **color de esmalte real** (*Milky White*, *Cover Pink*, *Baby Boomer*, *Rojo Burdeos*, *Francesa*, *Glazed Pearl*), alertas de cutícula/alergias, Bono VIP, botón 1-toque `✓ Repetir su diseño hoy` y **Radar de Relleno 18–21 días** con WhatsApp directo (`+34`).

2. **💇‍♀️ Edición Peluquería & Estética Normal SIN Uñas (`peluqueria-estetica`)**
   - **Lumina Atelier · Peluquería & Estética** (PIN `1234`).
   - 9 servicios puros de peluquería, colorimetría orgánica, cabina facial, corporal y mirada (**0 uñas, 0 pedicura**).
   - Tarjetas 3D con fórmulas de colorimetría (`Base 7.1 + 8.3 · 20 vol · Matiz 9.21`) o protocolo facial (`Piel mixta sensible · Vitamina C + Ácido Hialurónico`), botón `✓ Repetir su fórmula hoy` y **Radar de Retoque 21–28 días**.

## Rutas Principales

- `/` — Panel de gestión del salón (*Salón Hoy*: Agenda Visual Táctil Booksy-style, bandeja QR, caja + comisiones 50/50 · 60/40 · 40/60 + venta cosmética + recordatorio reseñas Google 5⭐ a los 30 min).
- `/?shop=campodonico-nails` o `/?shop=peluqueria-estetica` — Acceso directo por salón.
- `/clients` — Directorio de Clientas VIP con Tarjetas 3D giratorias.
- `/r/:shopSlug` y `/reservar` — Portal Público QR 100 % aislado para clientas (sin llamadas `/sync` ni fuga de PIN/datos).
- `/admin` — Panel Súper-Admin (`lumina-beauty-admin-2026` o `kutz-superadmin-2026`) para dar de alta, editar o pausar nuevos salones.

## Scripts de Desarrollo y Verificación

```bash
npm install
npm run dev
npm run lint        # oxlint src netlify
npm test            # Suite de tests unitarios & handlers serverless
npm run build       # Compilación producción + PWA
node tests/puppeteer_mobile_verification.mjs  # Verificación real 375x812 & 390x844
```
