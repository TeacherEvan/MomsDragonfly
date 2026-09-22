/**
 * Mom's Dragonfly — app icon generator (v3, elegant top-view dragonfly).
 *
 * Design: refined top-view dragonfly — long slim tapered abdomen, four
 * slender swept wings with bright orange tips and a light leading edge,
 * gold→orange compound eyes — on a deep navy tile with a subtle teal glow
 * and a teal→orange rim light.
 *
 * Writes SVGs to public/icons/ (all sizes), public/favicon.svg and the master
 * public/dragonfly-icon.svg. Rasterize with: node convert-icons.mjs (sharp).
 *
 * Run: node generate-dragonfly-icons.js && node convert-icons.mjs
 */
const fs = require("fs");
const path = require("path");

const C = {
  navy950: "#061416",
  teal700: "#2c7a7b",
  teal500: "#319795",
  teal400: "#38b2ac",
  teal300: "#4fd1c5",
  cyan300: "#67e8f9",
  cyan200: "#a5f3fc",
  cyan100: "#cffafe",
  orange500: "#f97316",
  orange400: "#fb923c",
  orange300: "#fdba74",
  gold300: "#fcd34d",
  gold100: "#fef3c7",
};

/** Left half of the dragonfly (x < 256); mirrored for the right half. */
function leftWings(detail = true) {
  const decorations = detail
    ? `
      <path d="M236 212 C204 178 138 126 46 102"
        fill="none" stroke="${C.cyan100}" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
      <g fill="none" stroke="${C.cyan200}" stroke-width="1.2" opacity="0.5" stroke-linecap="round">
        <path d="M228 214 Q150 156 56 108"/>
        <path d="M214 220 Q152 186 84 138"/>
        <path d="M234 250 Q172 282 100 318"/>
        <path d="M230 262 Q180 296 122 312"/>
      </g>
      <circle cx="50" cy="104" r="7.5" fill="${C.orange400}" opacity="0.95"/>
      <circle cx="92" cy="324" r="6" fill="${C.orange300}" opacity="0.9"/>`
    : "";
  return `
      <path d="M236 212 C204 178 138 126 46 102 C86 142 156 200 230 244 Z"
        fill="url(#wgFore)" stroke="url(#weGrad)" stroke-width="${detail ? 3 : 4.5}" stroke-linejoin="round"/>
      <path d="M240 246 C206 264 150 300 88 322 C138 356 202 338 244 276 Z"
        fill="url(#wgHind)" stroke="url(#weGrad)" stroke-width="${detail ? 3 : 4.5}" stroke-linejoin="round"/>${decorations}`;
}

function dragonflyArt(detail = true) {
  const abdomenSegments = detail
    ? `
    <g fill="none" stroke="${C.navy950}" stroke-width="1.8" opacity="0.4" stroke-linecap="round">
      <path d="M245.2 278 Q256 282 266.8 278"/>
      <path d="M245 300 Q256 304 267 300"/>
      <path d="M245.4 322 Q256 326 266.6 322"/>
      <path d="M246.2 344 Q256 348 265.8 344"/>
      <path d="M247.4 366 Q256 369.6 264.6 366"/>
      <path d="M248.8 388 Q256 391.4 263.2 388"/>
      <path d="M250.4 408 Q256 411 261.6 408"/>
      <path d="M252.2 426 Q256 428.4 259.8 426"/>
    </g>
    <circle cx="256" cy="462" r="2.6" fill="${C.orange300}" opacity="0.75"/>`
    : "";
  return `
  <g transform="rotate(-6 256 256)">
    ${leftWings(detail)}
    <g transform="translate(512 0) scale(-1 1)">${leftWings(detail)}</g>

    <!-- abdomen: long, slim, sharply tapered -->
    <path d="M245 254 C242 302 245 362 249 412 C251 436 254 454 256 466 C258 454 261 436 263 412 C267 362 270 302 267 254 C264 246 248 246 245 254 Z"
      fill="url(#abGrad)"/>${abdomenSegments}

    <!-- thorax -->
    <path d="M256 190 C275 190 287 206 286 228 C285 246 274 254 256 254 C238 254 227 246 226 228 C225 206 237 190 256 190 Z"
      fill="url(#thGrad)"/>

    <!-- head + compound eyes -->
    <circle cx="256" cy="168" r="24" fill="url(#hdGrad)"/>
    <circle cx="242" cy="158" r="12.5" fill="url(#eyeGrad)"/>
    <circle cx="270" cy="158" r="12.5" fill="url(#eyeGrad)"/>
    <circle cx="238" cy="153.5" r="3.6" fill="${C.gold100}"/>
    <circle cx="266" cy="153.5" r="3.6" fill="${C.gold100}"/>
  </g>`;
}

function defs() {
  return `
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a2028"/>
      <stop offset="55%" stop-color="#08161d"/>
      <stop offset="100%" stop-color="${C.navy950}"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${C.teal500}" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="${C.teal500}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${C.teal500}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.orange500}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${C.teal400}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${C.teal300}" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="wgFore" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.cyan300}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${C.teal400}" stop-opacity="0.36"/>
      <stop offset="100%" stop-color="${C.teal300}" stop-opacity="0.26"/>
    </linearGradient>
    <linearGradient id="wgHind" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.teal300}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${C.cyan300}" stop-opacity="0.28"/>
    </linearGradient>
    <linearGradient id="weGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.orange400}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${C.teal400}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${C.cyan300}" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="abGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.teal300}"/>
      <stop offset="45%" stop-color="${C.teal500}"/>
      <stop offset="100%" stop-color="${C.teal700}"/>
    </linearGradient>
    <linearGradient id="thGrad" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${C.teal300}"/>
      <stop offset="100%" stop-color="${C.teal700}"/>
    </linearGradient>
    <linearGradient id="hdGrad" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${C.teal300}"/>
      <stop offset="100%" stop-color="${C.teal500}"/>
    </linearGradient>
    <linearGradient id="eyeGrad" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${C.gold300}"/>
      <stop offset="100%" stop-color="${C.orange500}"/>
    </linearGradient>`;
}

function iconSVG({ maskable = false, detail = true } = {}) {
  const artScale = maskable ? 0.7 : detail ? 0.94 : 1;
  const artTransform = `translate(256 256) scale(${artScale}) translate(-256 -256)`;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#bgGrad)"/>
  ${
    maskable
      ? ""
      : `<rect x="3" y="3" width="506" height="506" rx="109" fill="none" stroke="url(#rimGrad)" stroke-width="2.5"/>`
  }
  <circle cx="256" cy="230" r="210" fill="url(#glowGrad)"/>
  <g transform="${artTransform}">${dragonflyArt(detail)}
  </g>
</svg>`;
}

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, "public", "icons");
fs.mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  const name = size === 512 ? "icon-512x512.svg" : `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(outputDir, name), iconSVG({ maskable: false, detail: size > 32 }));
}
fs.writeFileSync(path.join(outputDir, "icon-512x512-maskable.svg"), iconSVG({ maskable: true }));
fs.writeFileSync(path.join(__dirname, "public", "favicon.svg"), iconSVG({ maskable: false, detail: false }));
fs.writeFileSync(path.join(__dirname, "public", "dragonfly-icon.svg"), iconSVG({ maskable: false }));

console.log("Generated icon SVGs (10 sizes + maskable + favicon + dragonfly-icon master).");
console.log("Rasterize with: node convert-icons.mjs");