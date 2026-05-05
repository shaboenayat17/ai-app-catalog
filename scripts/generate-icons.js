/**
 * Generate PWA icons from a Sharp-rendered SVG.
 *
 * Runs as `prebuild` so Vercel produces fresh icons on every deploy.
 * Idempotent — safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

// "Any" icon: rounded background, AI badge inside.
function anySvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" ry="80" fill="#0f1117"/>
  <rect x="86" y="86" width="340" height="340" rx="60" ry="60" fill="#6366f1"/>
  <text
    x="256" y="298"
    text-anchor="middle"
    font-family="Inter, ui-sans-serif, -apple-system, Segoe UI, sans-serif"
    font-size="170"
    font-weight="800"
    fill="#ffffff"
    letter-spacing="-4"
  >AI</text>
</svg>`;
}

// "Maskable" icon: full-bleed background, content within ~80% safe zone.
// 80% of 512 = ~410. Purple square sized 300 (~58%) sits comfortably inside.
function maskableSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f1117"/>
  <rect x="106" y="106" width="300" height="300" rx="56" ry="56" fill="#6366f1"/>
  <text
    x="256" y="290"
    text-anchor="middle"
    font-family="Inter, ui-sans-serif, -apple-system, Segoe UI, sans-serif"
    font-size="150"
    font-weight="800"
    fill="#ffffff"
    letter-spacing="-3"
  >AI</text>
</svg>`;
}

async function generate() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const anyBuf = Buffer.from(anySvg());
  const maskBuf = Buffer.from(maskableSvg());

  for (const size of ICON_SIZES) {
    const out = path.join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(anyBuf).resize(size, size).png().toFile(out);
    console.log(`  wrote ${path.relative(process.cwd(), out)}`);
  }

  for (const size of MASKABLE_SIZES) {
    const out = path.join(OUT_DIR, `icon-${size}x${size}-maskable.png`);
    await sharp(maskBuf).resize(size, size).png().toFile(out);
    console.log(`  wrote ${path.relative(process.cwd(), out)}`);
  }

  // Also write a 32x32 favicon as a courtesy.
  const fav = path.join(OUT_DIR, "favicon-32x32.png");
  await sharp(anyBuf).resize(32, 32).png().toFile(fav);
  console.log(`  wrote ${path.relative(process.cwd(), fav)}`);
}

generate().then(
  () => console.log("Icons generated."),
  (err) => {
    console.error("Failed to generate icons:", err.message);
    process.exit(1);
  },
);
