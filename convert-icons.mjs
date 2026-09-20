import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputDir = path.join(process.cwd(), 'public', 'icons');
const outputDir = path.join(process.cwd(), 'public', 'icons');

for (const size of sizes) {
  const suffix = size === 512 ? '-maskable' : '';
  const svgPath = path.join(inputDir, `icon-${size}x${size}${suffix}.svg`);
  const pngPath = path.join(outputDir, `icon-${size}x${size}${suffix}.png`);
  
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    console.log(`Converted ${size}x${size}`);
  } catch (err) {
    console.error(`Failed ${size}x${size}:`, err.message);
  }
}

// Favicon
const faviconSvg = path.join(process.cwd(), 'public', 'favicon.svg');
const faviconPng = path.join(process.cwd(), 'public', 'favicon.png');
await sharp(faviconSvg).resize(32, 32).png().toFile(faviconPng);
console.log('Converted favicon');

console.log('All done!');
