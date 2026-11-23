import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

function getLuminaBeautySvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="silkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDFB"/>
      <stop offset="55%" stop-color="#FAF3EC"/>
      <stop offset="100%" stop-color="#F2E2DA"/>
    </linearGradient>
    <linearGradient id="roseGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D78E86"/>
      <stop offset="55%" stop-color="#C87A72"/>
      <stop offset="100%" stop-color="#C59B5F"/>
    </linearGradient>
    <radialGradient id="pearlGlow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#E9D9CF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#silkBg)"/>
  <circle cx="256" cy="232" r="210" fill="url(#pearlGlow)"/>

  <rect x="36" y="36" width="440" height="440" rx="84" fill="none" stroke="#E9D9CF" stroke-width="3"/>
  <rect x="52" y="52" width="408" height="408" rx="70" fill="none" stroke="#C59B5F" stroke-width="1.5" stroke-opacity="0.5"/>

  <!-- Editorial Crest -->
  <circle cx="256" cy="224" r="118" fill="#FFFFFF" fill-opacity="0.88" stroke="#E9D9CF" stroke-width="3"/>
  <circle cx="256" cy="224" r="98" fill="url(#roseGold)"/>

  <!-- 4-Point Star Sparkle Emblem -->
  <path d="M256 146 C262 198 282 218 334 224 C282 230 262 250 256 302 C250 250 230 230 178 224 C230 218 250 198 256 146 Z" fill="#FFFDFB"/>
  <circle cx="312" cy="168" r="7" fill="#FFFDFB" opacity="0.9"/>
  <circle cx="202" cy="278" r="5" fill="#FFFDFB" opacity="0.8"/>

  <!-- Typography -->
  <g text-anchor="middle">
    <text x="256" y="408" fill="#2A201D" font-family="Georgia, serif" font-size="40" font-weight="600" letter-spacing="8">LUMINA</text>
    <text x="256" y="442" fill="#B86566" font-family="system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="5">BEAUTY &amp; SALON</text>
  </g>
</svg>`;
}

async function generate() {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const svg512 = getLuminaBeautySvg(512);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg512, 'utf8');
  console.log('✓ Written public/favicon.svg');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const targets = [
      { filename: 'pwa-192x192.png', size: 192 },
      { filename: 'pwa-512x512.png', size: 512 },
      { filename: 'apple-touch-icon.png', size: 180 },
    ];
    for (const { filename, size } of targets) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
      await page.setContent(
        `<!DOCTYPE html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{width:100%;height:100%;display:block}</style></head><body>${svg512}</body></html>`,
        { waitUntil: 'load' }
      );
      const outPath = path.join(publicDir, filename);
      await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
      console.log(`✓ Generated public/${filename}`);
    }
  } finally {
    await browser.close();
  }
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
