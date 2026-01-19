import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function optimizeLogo() {
  const input = path.join(PUBLIC_DIR, "WYA_LOGO_2.png");
  if (!(await exists(input))) return;

  // Logo is displayed ~252px wide on mobile; generate a few responsive widths.
  const widths = [180, 300, 612];
  for (const w of widths) {
    const baseOut = path.join(PUBLIC_DIR, `WYA_LOGO_2-${w}`);

    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(`${baseOut}.webp`);

    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .avif({ quality: 60 })
      .toFile(`${baseOut}.avif`);
  }
}

async function optimizeHero() {
  // Note: the repo file is named layout.jpeg but is actually WebP; create correctly named outputs.
  const input = path.join(PUBLIC_DIR, "layout.jpeg");
  if (!(await exists(input))) return;

  const outWebp = path.join(PUBLIC_DIR, "layout-800.webp");
  const outAvif = path.join(PUBLIC_DIR, "layout-800.avif");

  await sharp(input)
    .resize({ width: 800, height: 800, fit: "cover" })
    .webp({ quality: 78 })
    .toFile(outWebp);

  await sharp(input)
    .resize({ width: 800, height: 800, fit: "cover" })
    .avif({ quality: 60 })
    .toFile(outAvif);
}

async function optimizePersonalizationBg() {
  const rel = path.join("lovable-uploads", "6cca2893-2362-428d-b824-69d6baff41c7.png");
  const input = path.join(PUBLIC_DIR, rel);
  if (!(await exists(input))) return;

  await ensureDir(path.dirname(input));

  const baseOut = path.join(PUBLIC_DIR, "lovable-uploads", "6cca2893-2362-428d-b824-69d6baff41c7-800");
  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(`${baseOut}.webp`);

  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .avif({ quality: 56 })
    .toFile(`${baseOut}.avif`);
}

async function main() {
  await Promise.all([optimizeLogo(), optimizeHero(), optimizePersonalizationBg()]);
  // eslint-disable-next-line no-console
  console.log("Image optimization complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

