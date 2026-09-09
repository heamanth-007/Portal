import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.resolve(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 512x512 App Icon SVG with rounded background and exact MB logo
const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1726" />
      <stop offset="50%" stop-color="#141f36" />
      <stop offset="100%" stop-color="#080d1a" />
    </linearGradient>
    <linearGradient id="mbOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B00" />
      <stop offset="50%" stop-color="#FF5100" />
      <stop offset="100%" stop-color="#D92E00" />
    </linearGradient>
    <radialGradient id="glowEffect" cx="50%" cy="45%" r="48%">
      <stop offset="0%" stop-color="#FF5100" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#FF5100" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#FF5100" stop-opacity="0" />
    </radialGradient>
    <filter id="dropShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#FF5100" flood-opacity="0.35" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  <rect width="510" height="510" x="1" y="1" rx="109" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2" />

  <!-- Center radial orange glow -->
  <circle cx="256" cy="240" r="200" fill="url(#glowEffect)" />

  <!-- Logo Group -->
  <g transform="translate(86, 42) scale(0.68)" filter="url(#dropShadow)">
    <!-- Outer Frame -->
    <path d="M 250 20 L 470 140 L 470 550 L 30 550 L 30 140 Z" fill="none" stroke="url(#mbOrange)" stroke-width="16" stroke-linejoin="miter" />
    <!-- Inner Hexagon Frame -->
    <path d="M 250 55 L 440 160 L 440 460 L 60 460 L 60 160 Z" fill="none" stroke="url(#mbOrange)" stroke-width="14" stroke-linejoin="miter" />
    <!-- Separator Bar -->
    <line x1="30" y1="480" x2="470" y2="480" stroke="url(#mbOrange)" stroke-width="10" />
    <!-- M Monogram -->
    <path d="M 95 190 L 165 190 L 165 315 L 225 210 L 250 210 L 250 425 L 190 425 L 190 315 L 142 425 L 95 425 Z" fill="url(#mbOrange)" />
    <!-- B Monogram -->
    <path d="M 250 190 L 375 190 C 420 190 420 270 380 282 C 430 295 430 425 365 425 L 250 425 Z M 310 230 L 310 272 L 360 272 C 375 272 375 230 360 230 Z M 310 312 L 310 385 L 365 385 C 382 385 382 312 365 312 Z" fill="url(#mbOrange)" fill-rule="evenodd" />
    <!-- Text -->
    <text x="250" y="530" text-anchor="middle" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-weight="900" font-size="40" letter-spacing="2.5" fill="url(#mbOrange)">MAHES BANKERS</text>
  </g>

  <!-- Subtitle Text -->
  <text x="256" y="475" 
        text-anchor="middle" 
        font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif" 
        font-weight="700" 
        font-size="16" 
        letter-spacing="3" 
        fill="#FF7A33">EMPLOYEE PORTAL</text>
</svg>
`;

// Open Graph 1200x630 Banner SVG
const ogBannerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080d1a" />
      <stop offset="50%" stop-color="#0e1726" />
      <stop offset="100%" stop-color="#141f36" />
    </linearGradient>
    <linearGradient id="mbOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B00" />
      <stop offset="50%" stop-color="#FF5100" />
      <stop offset="100%" stop-color="#D92E00" />
    </linearGradient>
    <radialGradient id="ogGlow" cx="290" cy="315" r="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF5100" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#FF5100" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#FF5100" stop-opacity="0" />
    </radialGradient>
    <filter id="ogShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#FF5100" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)" />
  <circle cx="290" cy="315" r="380" fill="url(#ogGlow)" />

  <!-- Left Icon Card -->
  <g transform="translate(100, 105)">
    <rect width="420" height="420" rx="80" fill="#0f172a" stroke="rgba(255,255,255,0.12)" stroke-width="2.5" />
    <g transform="translate(70, 30) scale(0.56)" filter="url(#ogShadow)">
      <!-- Outer Frame -->
      <path d="M 250 20 L 470 140 L 470 550 L 30 550 L 30 140 Z" fill="none" stroke="url(#mbOrange)" stroke-width="16" stroke-linejoin="miter" />
      <!-- Inner Hexagon Frame -->
      <path d="M 250 55 L 440 160 L 440 460 L 60 460 L 60 160 Z" fill="none" stroke="url(#mbOrange)" stroke-width="14" stroke-linejoin="miter" />
      <!-- Separator Bar -->
      <line x1="30" y1="480" x2="470" y2="480" stroke="url(#mbOrange)" stroke-width="10" />
      <!-- M Monogram -->
      <path d="M 95 190 L 165 190 L 165 315 L 225 210 L 250 210 L 250 425 L 190 425 L 190 315 L 142 425 L 95 425 Z" fill="url(#mbOrange)" />
      <!-- B Monogram -->
      <path d="M 250 190 L 375 190 C 420 190 420 270 380 282 C 430 295 430 425 365 425 L 250 425 Z M 310 230 L 310 272 L 360 272 C 375 272 375 230 360 230 Z M 310 312 L 310 385 L 365 385 C 382 385 382 312 365 312 Z" fill="url(#mbOrange)" fill-rule="evenodd" />
      <!-- Text -->
      <text x="250" y="530" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="40" letter-spacing="2.5" fill="url(#mbOrange)">MAHES BANKERS</text>
    </g>
    <text x="210" y="385" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="14" letter-spacing="2.5" fill="#FF6B00">EMPLOYEE PORTAL</text>
  </g>

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

async function run() {
  console.log('Generating exact MB icons and Open Graph previews...');
  
  // 1. icon-512.png
  await sharp(Buffer.from(appIconSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Created icons/icon-512.png');

  // 2. icon-192.png
  await sharp(Buffer.from(appIconSvg))
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Created icons/icon-192.png');

  // 3. og-image.png (1200x630)
  await sharp(Buffer.from(ogBannerSvg))
    .resize(1200, 630)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Created public/og-image.png');

  console.log('All icons and preview images generated successfully!');
}

run().catch(console.error);
