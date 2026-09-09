import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceImage = path.resolve(projectRoot, 'src/components/WhatsApp Image 2026-08-29 at 1.04.03 PM.jpeg');
const publicDir = path.resolve(projectRoot, 'public');
const iconsDir = path.resolve(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function run() {
  console.log('Generating tightly fitted transparent logo from:', sourceImage);

  // 1. Read raw pixels and make ALL non-orange (white, off-white, grey) background transparent
  const { data, info } = await sharp(sourceImage)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const diffRB = r - b;
    const diffRG = r - g;
    
    // Strict orange stroke & text detection
    if (diffRB > 35 && diffRG > 8 && r > 120 && b < 185) {
      data[i + 3] = 255;
    } else if (diffRB > 18 && diffRG > 4 && r > 140 && b < 210) {
      data[i + 3] = Math.min(255, Math.max(0, Math.round((diffRB - 18) * 14)));
    } else {
      data[i + 3] = 0; // 100% transparent background
    }
  }

  // Get tightly trimmed transparent buffer (0 extra padding around edges)
  const tightlyTrimmedBuffer = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png({ quality: 100 })
    .toBuffer();

  // 1. Save tightly trimmed public/logo.png
  await sharp(tightlyTrimmedBuffer)
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Saved tightly trimmed public/logo.png');

  // 2. Favicon (64x64)
  await sharp(tightlyTrimmedBuffer)
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Saved public/favicon.png');

  // 3. SVG wrappers
  const base64 = tightlyTrimmedBuffer.toString('base64');
  const metadata = await sharp(tightlyTrimmedBuffer).metadata();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${metadata.width} ${metadata.height}" width="100%" height="100%">
  <image href="data:image/png;base64,${base64}" width="${metadata.width}" height="${metadata.height}" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svg);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg);
  console.log('Saved public/logo.svg and favicon.svg');

  // 4. App icons (512x512 and 192x192)
  const icon512Bg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="100" fill="#ffffff" />
    <rect width="508" height="508" x="2" y="2" rx="98" fill="none" stroke="#FF5100" stroke-width="4" stroke-opacity="0.25" />
  </svg>
  `;

  const logoFor512 = await sharp(tightlyTrimmedBuffer)
    .resize(420, 420, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(Buffer.from(icon512Bg))
    .composite([
      {
        input: logoFor512,
        top: 46,
        left: 46,
      },
    ])
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-512.png'));

  await sharp(path.join(iconsDir, 'icon-512.png'))
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Saved icons 512 and 192');

  // 5. Open Graph banner (1200x630)
  const ogLogo = await sharp(tightlyTrimmedBuffer)
    .resize(360, 360, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const ogBgSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080d1a" />
        <stop offset="50%" stop-color="#0e1726" />
        <stop offset="100%" stop-color="#141f36" />
      </linearGradient>
      <radialGradient id="ogGlow" cx="290" cy="315" r="380" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FF5100" stop-opacity="0.25" />
        <stop offset="60%" stop-color="#FF5100" stop-opacity="0.04" />
        <stop offset="100%" stop-color="#FF5100" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#ogBg)" />
    <circle cx="290" cy="315" r="380" fill="url(#ogGlow)" />
    
    <!-- Left Card Container -->
    <rect x="80" y="95" width="440" height="440" rx="70" fill="#ffffff" stroke="#FF5100" stroke-width="4" stroke-opacity="0.4" />

    <!-- Right Content -->
    <g transform="translate(580, 180)">
      <rect x="0" y="0" width="170" height="34" rx="17" fill="rgba(255, 81, 0, 0.15)" stroke="rgba(255, 81, 0, 0.4)" stroke-width="1.5" />
      <text x="85" y="22" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" letter-spacing="1" fill="#FF7A33">INTERNAL PORTAL</text>

      <text x="0" y="85" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" letter-spacing="-0.5">Mahes Bankers</text>
      <text x="0" y="140" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="28" fill="#94A3B8">Employee Management Portal</text>
      
      <text x="0" y="210" font-family="'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="18" fill="#64748B">Attendance Tracking • Geofencing • Shift Reports</text>
      <text x="0" y="240" font-family="'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="16" fill="#FF5100">attendance.mahesgoldfinance.com</text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(ogBgSvg))
    .composite([
      {
        input: ogLogo,
        top: 135,
        left: 120,
      },
    ])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Saved public/og-image.png');

  console.log('Done!');
}

run().catch(console.error);
