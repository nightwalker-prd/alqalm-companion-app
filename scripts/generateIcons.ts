import sharp from 'sharp';
import { mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Icon sizes needed for PWA and iOS
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const maskableIconSizes = [192, 512];

// Splash screen sizes for various iOS devices
const splashScreens = [
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
  { width: 2732, height: 2048, name: 'splash-2732x2048.png' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' },
  { width: 2388, height: 1668, name: 'splash-2388x1668.png' },
  // iPad Air / iPad 10.9"
  { width: 1640, height: 2360, name: 'splash-1640x2360.png' },
  { width: 2360, height: 1640, name: 'splash-2360x1640.png' },
  // iPad 10.2"
  { width: 1620, height: 2160, name: 'splash-1620x2160.png' },
  { width: 2160, height: 1620, name: 'splash-2160x1620.png' },
  // iPad Mini
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  { width: 2048, height: 1536, name: 'splash-2048x1536.png' },
  // iPhone 14 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  // iPhone 14 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  // iPhone 14 / 13 / 12
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  // iPhone SE
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
];

// Theme colors from the app
const BACKGROUND_COLOR = '#0a0a0a';

async function generateIcons() {
  const iconsDir = join(rootDir, 'public', 'icons');
  const splashDir = join(rootDir, 'public', 'splash');

  // Ensure directories exist
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  // Read the SVG files
  const iconSvg = await readFile(join(iconsDir, 'icon.svg'));
  const maskableSvg = await readFile(join(iconsDir, 'icon-maskable.svg'));

  console.log('Generating regular icons...');

  // Generate regular icons
  for (const size of iconSizes) {
    const outputPath = join(iconsDir, `icon-${size}.png`);
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  Created icon-${size}.png`);
  }

  console.log('Generating maskable icons...');

  // Generate maskable icons
  for (const size of maskableIconSizes) {
    const outputPath = join(iconsDir, `icon-maskable-${size}.png`);
    await sharp(maskableSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  Created icon-maskable-${size}.png`);
  }

  console.log('Generating splash screens...');

  // Generate splash screens
  for (const splash of splashScreens) {
    const outputPath = join(splashDir, splash.name);

    // Calculate icon size (40% of the smaller dimension)
    const iconSize = Math.floor(Math.min(splash.width, splash.height) * 0.25);

    // Create a resized version of the icon for the splash
    const iconBuffer = await sharp(iconSvg)
      .resize(iconSize, iconSize)
      .png()
      .toBuffer();

    // Create the splash screen with centered icon
    const left = Math.floor((splash.width - iconSize) / 2);
    const top = Math.floor((splash.height - iconSize) / 2);

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
      .composite([
        {
          input: iconBuffer,
          left,
          top
        }
      ])
      .png()
      .toFile(outputPath);

    console.log(`  Created ${splash.name}`);
  }

  console.log('\nAll icons and splash screens generated successfully!');
}

generateIcons().catch(console.error);
