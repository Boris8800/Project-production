import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(process.cwd());
const inputPath = path.join(projectRoot, 'public', 'brand', 'transferline-logo.png');
const outDir = path.join(projectRoot, 'public', 'icons');

const anyIcons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
];

const maskableIcons = [
  { name: 'maskable-192.png', size: 192 },
  { name: 'maskable-512.png', size: 512 },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function generateContain({ size, outPath }) {
  // white background keeps transparency safe for PWA contexts
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function generateMaskable({ size, outPath }) {
  // Maskable icons should keep content away from edges.
  // We add padding by rendering the logo at ~70% of the canvas.
  const inner = Math.round(size * 0.7);
  const logo = await sharp(inputPath)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  await ensureDir(outDir);

  for (const icon of anyIcons) {
    await generateContain({ size: icon.size, outPath: path.join(outDir, icon.name) });
  }

  for (const icon of maskableIcons) {
    await generateMaskable({ size: icon.size, outPath: path.join(outDir, icon.name) });
  }

  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  manifest.icons = [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/maskable-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ];

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Optional: helpful console output for CI / local runs
  // eslint-disable-next-line no-console
  console.log(`Generated ${anyIcons.length + maskableIcons.length} icons into ${path.relative(projectRoot, outDir)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
