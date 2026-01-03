import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const dir = path.resolve(process.cwd(), 'public/images/carousel');

async function optimize() {
  const files = await fs.readdir(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = await fs.stat(full);
    if (!stat.isFile()) continue;
    const ext = path.extname(f).toLowerCase();

    const outPath = full; // overwrite in place

    try {
      const image = sharp(full).rotate();
      const metadata = await image.metadata();
      const width = metadata.width || 1600;
      const targetWidth = Math.min(1600, width || 1600);

      if (ext === '.jpg' || ext === '.jpeg') {
        await image
          .resize({ width: targetWidth })
          .jpeg({ quality: 80, progressive: true, mozjpeg: true })
          .toFile(outPath + '.tmp');
      } else if (ext === '.png') {
        await image
          .resize({ width: targetWidth })
          .png({ compressionLevel: 9, progressive: true })
          .toFile(outPath + '.tmp');
      } else if (ext === '.webp') {
        await image
          .resize({ width: targetWidth })
          .webp({ quality: 80 })
          .toFile(outPath + '.tmp');
      } else {
        // fallback: convert to jpeg
        await image
          .resize({ width: targetWidth })
          .jpeg({ quality: 80, progressive: true, mozjpeg: true })
          .toFile(outPath + '.tmp');
      }

      await fs.rename(outPath + '.tmp', outPath);
      console.log('Optimized', f);
    } catch (err) {
      console.error('Failed to optimize', f, err.message);
    }
  }
}

optimize().catch((e) => { console.error(e); process.exit(1); });
