const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const dir = path.join(__dirname, '../public/icons')

async function convert() {
  for (const size of sizes) {
    const svgPath = path.join(dir, `icon-${size}.svg`)
    const pngPath = path.join(dir, `icon-${size}.png`)
    await sharp(Buffer.from(fs.readFileSync(svgPath, 'utf8')))
      .resize(size, size)
      .png()
      .toFile(pngPath)
    console.log(`✓ icon-${size}.png`)
  }

  // badge-72
  const badgeSvg = path.join(dir, 'badge-72.svg')
  const badgePng = path.join(dir, 'badge-72.png')
  await sharp(Buffer.from(fs.readFileSync(badgeSvg, 'utf8')))
    .resize(72, 72)
    .png()
    .toFile(badgePng)
  console.log('✓ badge-72.png')

  console.log('\n✅ Todos los PNGs generados.')
}

convert().catch(console.error)
