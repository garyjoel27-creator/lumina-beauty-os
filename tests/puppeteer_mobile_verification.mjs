#!/usr/bin/env node
/**
 * Real Puppeteer Mobile Verification for LUMINA // BEAUTY & SALON
 * Verifies 375x812 & 390x844 viewports:
 * - 0px horizontal overflow on /, /clients, /r/campodonico-nails, /r/peluqueria-estetica
 * - 3D Flip button 100% visible inside viewport & flips card to show edition-specific repeat CTA
 * - 1-click switch to Peluquería & Estética (Sin Uñas)
 * - 100% isolation of /r/:shopSlug (ZERO /sync calls!)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      if (urlPath.startsWith('/api/')) {
        if (urlPath.includes('/sync')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, appointments: [], queue: [], clients: [] }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, offlineMock: true }));
        return;
      }
      let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function main() {
  const { server, baseUrl } = await startStaticServer();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let failures = 0;
  const check = (cond, msg) => {
    if (cond) console.log(`  ✔ ${msg}`);
    else {
      failures++;
      console.error(`  ✖ FAIL: ${msg}`);
    }
  };

  try {
    for (const vp of [
      { name: 'iPhone SE/Mini (375x812)', width: 375, height: 812 },
      { name: 'iPhone 14/15 (390x844)', width: 390, height: 844 },
    ]) {
      console.log(`\n📱 Testing viewport ${vp.name}...`);
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });

      // 1. Dashboard "/?shop=campodonico-nails" (explicit ?shop= query param + empty /sync response!)
      await page.goto(`${baseUrl}/?shop=campodonico-nails`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 500));
      const dashOverflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        bgColor: getComputedStyle(document.body).backgroundColor,
        moverCount: document.querySelectorAll('[aria-label="Mover cita"]').length,
        hasPendingTray: document.body.innerText.includes('Solicitudes QR por Aprobar'),
        hasVeriFactu: Boolean(document.querySelector('[data-testid="verifactu-shield-banner"]')),
      }));
      check(
        dashOverflow.scrollW <= dashOverflow.innerW,
        `Dashboard 0px overflow (${dashOverflow.scrollW} <= ${dashOverflow.innerW}) & luminous canvas (${dashOverflow.bgColor})`
      );
      check(
        dashOverflow.moverCount >= 3 && dashOverflow.hasPendingTray && dashOverflow.hasVeriFactu,
        `Demo agenda, pending QR tray & VeriFactu shield banner rendered (${dashOverflow.moverCount} draggable appointments)`
      );

      // 1a. Verify Private Legal Hub opens from mobile header icon button with all 3 tabs incl. Contrato DPA
      await page.click('[aria-label="Legal y RGPD"]');
      await new Promise((r) => setTimeout(r, 180));
      const privLegal = await page.evaluate(() => ({
        hasDpa: document.body.innerText.includes('Contrato DPA (Art. 28)'),
        hasPrivacy: document.body.innerText.includes('Política de Privacidad'),
        hasLssi: document.body.innerText.includes('Aviso Legal (LSSI-CE)'),
      }));
      check(
        privLegal.hasDpa && privLegal.hasPrivacy && privLegal.hasLssi,
        `Private Legal Hub opens from mobile header with Privacidad, LSSI-CE & Contrato DPA tabs`
      );
      await page.click('[aria-label="Cerrar modal legal"]');
      await new Promise((r) => setTimeout(r, 120));

      // 1b. Switch to Peluquería & Estética WHILE on /?shop=campodonico-nails (must NOT snap back!)
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const peluBtn = btns.find((b) => b.textContent?.includes('Peluquería & Estética'));
        peluBtn?.click();
      });
      await new Promise((r) => setTimeout(r, 450));
      const switchedDash = await page.evaluate(() => ({
        url: window.location.search,
        hasAtelier: document.body.innerText.includes('Lumina Atelier'),
        hasBalayage: document.body.innerText.includes('Balayage'),
      }));
      check(
        switchedDash.url.includes('shop=peluqueria-estetica') && switchedDash.hasAtelier && switchedDash.hasBalayage,
        `1-click switcher from ?shop=campodonico-nails switches cleanly to peluqueria-estetica (URL: ${switchedDash.url})`
      );

      // Switch back to Nails before testing /clients
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nailsBtn = btns.find((b) => b.textContent?.includes('Uñas & Manicura'));
        nailsBtn?.click();
      });
      await new Promise((r) => setTimeout(r, 350));

      // 2. Clients 3D "/clients" + 3D flip button visibility
      await page.goto(`${baseUrl}/clients`, { waitUntil: 'networkidle2' });
      const clientsCheck = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="flip-card-btn"]');
        const rect = btn ? btn.getBoundingClientRect() : null;
        return {
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          btnFound: Boolean(btn),
          btnInBounds: Boolean(rect && rect.left >= 0 && rect.right <= window.innerWidth && rect.width > 50),
          hasNailText: document.body.innerText.includes('Baby Boomer') || document.body.innerText.includes('Milky White'),
        };
      });
      check(clientsCheck.scrollW <= clientsCheck.innerW, `/clients 0px overflow (${clientsCheck.scrollW} <= ${clientsCheck.innerW})`);
      check(clientsCheck.btnFound && clientsCheck.btnInBounds, `3D flip button ("Girar Ficha 3D") 100% visible on ${vp.width}px`);
      check(clientsCheck.hasNailText, `Nails edition visual polish & shapes rendered`);

      // Click flip button and confirm repeat CTA
      await page.click('[data-testid="flip-card-btn"]');
      const hasRepeatNails = await page.evaluate(() => document.body.innerText.includes('✓ Repetir su diseño hoy'));
      check(hasRepeatNails, `3D card flipped & shows "✓ Repetir su diseño hoy"`);

      // 3. Switch to Peluquería & Estética (Sin Uñas) via 1-click button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const peluBtn = btns.find((b) => b.textContent?.includes('Peluquería & Estética'));
        peluBtn?.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const peluCheck = await page.evaluate(() => ({
        hasFormula: document.body.innerText.includes('Base 7.1 + 8.3') || document.body.innerText.includes('Vitamina C'),
        hasRepeatFormula: document.body.innerText.includes('✓ Repetir su fórmula hoy'),
      }));
      check(peluCheck.hasFormula, `Switched to Peluquería & Estética and rendered colorimetry/facial formulas`);

      // 3b. Open ClientProfile /clients/n-1 and verify ARSOPOL panel & 4-layer RGPD Consent Modal
      await page.goto(`${baseUrl}/clients/n-1?shop=campodonico-nails`, { waitUntil: 'networkidle2' });
      const profileCheck = await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="arsopol-panel"]');
        return {
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          hasArsopol: Boolean(panel),
          hasPortability: Boolean(panel && panel.innerText.includes('Portabilidad')),
          hasRevoke: Boolean(panel && panel.innerText.includes('Revocar permisos opcionales')),
          hasDelete: Boolean(panel && panel.innerText.includes('Derecho de Supresión')),
        };
      });
      check(profileCheck.scrollW <= profileCheck.innerW, `/clients/n-1 0px overflow (${profileCheck.scrollW} <= ${profileCheck.innerW})`);
      check(
        profileCheck.hasArsopol && profileCheck.hasPortability && profileCheck.hasRevoke && profileCheck.hasDelete,
        `ClientProfile renders ARSOPOL panel (Portabilidad, Revocar, Supresión)`
      );

      // 4. Public QR Portal isolation (/r/campodonico-nails) — ZERO /sync requests + RGPD 1st-layer unchecked checkboxes!
      const syncCalls = [];
      page.on('request', (req) => {
        if (req.url().includes('/sync')) syncCalls.push(req.url());
      });
      await page.goto(`${baseUrl}/r/campodonico-nails`, { waitUntil: 'networkidle2' });
      const pubCheck = await page.evaluate(() => {
        const rgpd = document.querySelector('[data-testid="rgpd-booking-section"]');
        const boxes = rgpd ? Array.from(rgpd.querySelectorAll('input[type="checkbox"]')) : [];
        return {
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          hasTitle: document.body.innerText.includes('Campodónico'),
          hasServices: document.body.innerText.includes('Uñas acrílicas Talla S'),
          hasRgpdBox: Boolean(rgpd && rgpd.textContent.includes('Art. 13 RGPD')),
          allUnchecked: boxes.length === 2 && boxes.every((b) => b.checked === false),
        };
      });
      check(pubCheck.scrollW <= pubCheck.innerW, `/r/campodonico-nails 0px overflow (${pubCheck.scrollW} <= ${pubCheck.innerW})`);
      check(pubCheck.hasTitle && pubCheck.hasServices, `/r/campodonico-nails displays CM Salón D' Campodónico & real services`);
      check(pubCheck.hasRgpdBox && pubCheck.allUnchecked, `/r/campodonico-nails renders Art. 13 RGPD box with 2 unchecked checkboxes`);
      check(syncCalls.length === 0, `/r/campodonico-nails made ZERO /sync requests (actual: ${syncCalls.length})`);

      // Verify public Legal Modal hides DPA tab
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('Ver Política de Privacidad y Aviso Legal')
        );
        btn?.click();
      });
      await new Promise((r) => setTimeout(r, 150));
      const pubLegal = await page.evaluate(() => ({
        hasPrivacy: document.body.innerText.includes('Política de Privacidad'),
        hasDpa: document.body.innerText.includes('Contrato DPA (Art. 28)'),
      }));
      check(pubLegal.hasPrivacy && !pubLegal.hasDpa, `/r/campodonico-nails Legal modal shows Privacidad & hides internal DPA tab`);

      // 5. Public QR Portal Peluquería (/r/peluqueria-estetica) — ZERO nails!
      await page.goto(`${baseUrl}/r/peluqueria-estetica`, { waitUntil: 'networkidle2' });
      const pubPeluCheck = await page.evaluate(() => {
        const txt = document.body.innerText.toLowerCase();
        return {
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          hasBalayage: txt.includes('balayage'),
          hasNailsWord: txt.includes('acrílicas') || txt.includes('pedicura'),
        };
      });
      check(pubPeluCheck.scrollW <= pubPeluCheck.innerW, `/r/peluqueria-estetica 0px overflow`);
      check(pubPeluCheck.hasBalayage && !pubPeluCheck.hasNailsWord, `/r/peluqueria-estetica shows hair/facial services & ZERO nails/pedicura`);

      await page.close();
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nPuppeteer verification complete. Failures: ${failures}\n`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
