import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(process.cwd());
const inputPath = path.join(projectRoot, 'public', 'brand', 'transferline-logo-main.png');

function clampByte(value) {
  return Math.max(0, Math.min(255, value | 0));
}

function avgColor(samples) {
  const sum = samples.reduce(
    (acc, s) => {
      acc.r += s.r;
      acc.g += s.g;
      acc.b += s.b;
      return acc;
    },
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: Math.round(sum.r / samples.length),
    g: Math.round(sum.g / samples.length),
    b: Math.round(sum.b / samples.length),
  };
}

function sampleCornerColors({ data, width, height, channels }) {
  const samples = [];
  const step = 2;
  const inset = 6;

  const points = [
    { x0: 0 + inset, y0: 0 + inset }, // top-left
    { x0: width - 1 - inset, y0: 0 + inset }, // top-right
    { x0: 0 + inset, y0: height - 1 - inset }, // bottom-left
    { x0: width - 1 - inset, y0: height - 1 - inset }, // bottom-right
  ];

  for (const p of points) {
    for (let dy = 0; dy < 10; dy += step) {
      for (let dx = 0; dx < 10; dx += step) {
        const x = Math.max(0, Math.min(width - 1, p.x0 + dx));
        const y = Math.max(0, Math.min(height - 1, p.y0 + dy));
        const idx = (y * width + x) * channels;
        samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      }
    }
  }

  return avgColor(samples);
}

async function main() {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const bg = sampleCornerColors({
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  });

  // Two-threshold soft keying for nicer edges.
  // Pixels very close to the background become fully transparent.
  // Pixels far from the background remain opaque.
  const t0 = 10; // fully transparent within this RGB distance
  const t1 = 30; // fully opaque beyond this RGB distance
  const t0sq = t0 * t0;
  const t1sq = t1 * t1;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dr = r - bg.r;
    const dg = g - bg.g;
    const db = b - bg.b;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= t0sq) {
      data[i + 3] = 0;
    } else if (distSq >= t1sq) {
      // keep alpha as-is
    } else {
      // interpolate alpha in-between (soft edge)
      const dist = Math.sqrt(distSq);
      const alpha = ((dist - t0) / (t1 - t0)) * 255;
      data[i + 3] = clampByte(alpha);
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(inputPath);

  // eslint-disable-next-line no-console
  console.log(`Updated logo with transparent background: ${path.relative(projectRoot, inputPath)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
