const fs = require('fs');
const path = require('path');

// Simple dragonfly SVG generator
function dragonflySVG(size) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const scale = s / 512;
  
  return `<svg width="${s}" height="${s}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#15803d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#166534;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
      <stop offset="50%" style="stop-color:#16a34a;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#15803d;stop-opacity:0.1" />
    </linearGradient>
    <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fde047;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Body segments -->
  <g transform="translate(${cx}, ${cy})">
    <!-- Tail segments (abdomen) -->
    <ellipse cx="0" cy="80" rx="${14*scale}" ry="${20*scale}" fill="url(#bodyGradient)" />
    <ellipse cx="0" cy="55" rx="${16*scale}" ry="${20*scale}" fill="url(#bodyGradient)" />
    <ellipse cx="0" cy="30" rx="${18*scale}" ry="${20*scale}" fill="url(#bodyGradient)" />
    
    <!-- Thorax -->
    <ellipse cx="0" cy="0" rx="${22*scale}" ry="${25*scale}" fill="url(#bodyGradient)" />
    
    <!-- Head -->
    <ellipse cx="0" cy="-30" rx="${20*scale}" ry="${20*scale}" fill="url(#bodyGradient)" />
    
    <!-- Eyes -->
    <ellipse cx="-12" cy="-35" rx="${8*scale}" ry="${8*scale}" fill="url(#eyeGradient)" />
    <ellipse cx="12" cy="-35" rx="${8*scale}" ry="${8*scale}" fill="url(#eyeGradient)" />
    <ellipse cx="-12" cy="-35" rx="${4*scale}" ry="${4*scale}" fill="#166534" />
    <ellipse cx="12" cy="-35" rx="${4*scale}" ry="${4*scale}" fill="#166534" />
    
    <!-- Wings - front pair -->
    <ellipse cx="-55" cy="-15" rx="${45*scale}" ry="${35*scale}" fill="url(#wingGradient)" transform="rotate(-25)" stroke="#15803d" stroke-width="${1*scale}" stroke-opacity="0.3"/>
    <ellipse cx="55" cy="-15" rx="${45*scale}" ry="${35*scale}" fill="url(#wingGradient)" transform="rotate(25)" stroke="#15803d" stroke-width="${1*scale}" stroke-opacity="0.3"/>
    
    <!-- Wing veins -->
    <g stroke="#15803d" stroke-width="${0.5*scale}" stroke-opacity="0.4" fill="none">
      <line x1="0" y1="-15" x2="-55" y2="-50" transform="rotate(-25)" />
      <line x1="0" y1="-15" x2="-55" y2="-5" transform="rotate(-25)" />
      <line x1="0" y1="-15" x2="-80" y2="-25" transform="rotate(-25)" />
      <line x1="0" y1="-15" x2="55" y2="-50" transform="rotate(25)" />
      <line x1="0" y1="-15" x2="55" y2="-5" transform="rotate(25)" />
      <line x1="0" y1="-15" x2="80" y2="-25" transform="rotate(25)" />
    </g>
    
    <!-- Wings - rear pair -->
    <ellipse cx="-45" cy="25" rx="${35*scale}" ry="${25*scale}" fill="url(#wingGradient)" transform="rotate(-35)" stroke="#15803d" stroke-width="${1*scale}" stroke-opacity="0.3"/>
    <ellipse cx="45" cy="25" rx="${35*scale}" ry="${25*scale}" fill="url(#wingGradient)" transform="rotate(35)" stroke="#15803d" stroke-width="${1*scale}" stroke-opacity="0.3"/>
    
    <g stroke="#15803d" stroke-width="${0.5*scale}" stroke-opacity="0.4" fill="none">
      <line x1="0" y1="25" x2="-45" y2="0" transform="rotate(-35)" />
      <line x1="0" y1="25" x2="-45" y2="45" transform="rotate(-35)" />
      <line x1="0" y1="25" x2="-65" y2="20" transform="rotate(-35)" />
      <line x1="0" y1="25" x2="45" y2="0" transform="rotate(35)" />
      <line x1="0" y1="25" x2="45" y2="45" transform="rotate(35)" />
      <line x1="0" y1="25" x2="65" y2="20" transform="rotate(35)" />
    </g>
    
    <!-- Legs -->
    <g stroke="#166534" stroke-width="${2*scale}" fill="none">
      <line x1="-20" y1="10" x2="-35" y2="25" />
      <line x1="20" y1="10" x2="35" y2="25" />
      <line x1="-18" y1="25" x2="-30" y2="40" />
      <line x1="18" y1="25" x2="30" y2="40" />
      <line x1="-15" y1="40" x2="-25" y2="55" />
      <line x1="15" y1="40" x2="25" y2="55" />
    </g>
    
    <!-- Antennae -->
    <g stroke="#166534" stroke-width="${1.5*scale}" fill="none" stroke-linecap="round">
      <path d="M-10 -50 Q-20 -65 -15 -75" />
      <path d="M10 -50 Q20 -65 15 -75" />
    </g>
  </g>
</svg>`;
}

// Generate icons for all required sizes
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = dragonflySVG(size);
  const filename = `icon-${size}x${size}${size === 512 ? '-maskable' : ''}.png`;
  // We'll save as SVG first, user can convert or we'll use SVGs directly
  fs.writeFileSync(path.join(outputDir, `icon-${size}x${size}${size === 512 ? '-maskable' : ''}.svg`), svg);
  console.log(`Generated ${filename.replace('.png', '.svg')}`);
});

// Also generate a favicon
const faviconSVG = dragonflySVG(32);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), faviconSVG);
console.log('Generated favicon.svg');

console.log('\nAll dragonfly icons generated as SVGs!');
console.log('To convert to PNG, you can use: npx svgexport public/icons/icon-192x192.svg public/icons/icon-192x192.png 192:192');
