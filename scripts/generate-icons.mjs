/**
 * EquationQuest Icon Generator
 * Generates all required PWA + iOS + Android icon sizes from a single SVG source.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Prerequisites:
 *   npm install -D sharp   (run once)
 *
 * Drop your master icon as:  public/icon-master.png  (1024×1024 or larger, square)
 * Then run this script — it will generate all sizes into public/icons/
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC  = path.join(ROOT, 'public', 'icon.svg')
const OUT  = path.join(ROOT, 'public', 'icons')

const SIZES = [
  // PWA / general
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-512.png',  size: 512 },
  // iOS apple-touch-icon sizes
  { name: 'ios/180.png',   size: 180 },
  { name: 'ios/167.png',   size: 167 },
  { name: 'ios/152.png',   size: 152 },
  { name: 'ios/144.png',   size: 144 },
  { name: 'ios/120.png',   size: 120 },
  { name: 'ios/114.png',   size: 114 },
  { name: 'ios/76.png',    size: 76  },
  { name: 'ios/72.png',    size: 72  },
  { name: 'ios/60.png',    size: 60  },
  { name: 'ios/57.png',    size: 57  },
  // Android
  { name: 'android/512.png', size: 512 },
  { name: 'android/192.png', size: 192 },
  { name: 'android/144.png', size: 144 },
  { name: 'android/96.png',  size: 96  },
  { name: 'android/72.png',  size: 72  },
  { name: 'android/48.png',  size: 48  },
  // Favicon
  { name: '../favicon-32.png', size: 32 },
  { name: '../favicon-16.png', size: 16 },
]

async function main() {
  // Check source exists
  try {
    await fs.access(SRC)
  } catch {
    console.error(`
❌  Source icon not found: public/icon-master.png

Please create your app icon:
  1. Design a 1024×1024 PNG square icon (no rounded corners — the OS will clip it)
  2. Save it as:  mathquest-kids/public/icon-master.png
  3. Then run:    node scripts/generate-icons.mjs

Tips for a great EquationQuest icon:
  • Use the purple gradient (#6c5ce7 → #a29bfe) as background
  • Put the 🧮 emoji or a custom math symbol in the center
  • Keep it simple — it'll be shown at 20px on some devices
`)
    process.exit(1)
  }

  // Create output directories
  await fs.mkdir(path.join(OUT, 'ios'),     { recursive: true })
  await fs.mkdir(path.join(OUT, 'android'), { recursive: true })

  console.log('🎨 Generating EquationQuest icons...\n')

  for (const { name, size } of SIZES) {
    const dest = path.join(OUT, name)
    await sharp(SRC)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(dest)
    console.log(`  ✓ ${size}×${size}  →  public/icons/${name}`)
  }

  console.log(`
✅  All icons generated!

Next steps:
  1. Update vite.config.ts manifest icons if you added new sizes
  2. Add to index.html for iOS:
       <link rel="apple-touch-icon" sizes="180x180" href="/icons/ios/180.png">
  3. Run:  npm run build
`)
}

main().catch(console.error)
