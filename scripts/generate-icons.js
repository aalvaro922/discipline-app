#!/usr/bin/env node
// Genera iconos PWA básicos en SVG (colócalos en public/icons/)
// Requiere: npm install -g sharp o usa https://www.pwabuilder.com para iconos de producción

const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

function svgIcon(size) {
  const r = Math.round(size * 0.22)
  const font = Math.round(size * 0.45)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#09090b"/>
  <rect width="${size}" height="${size}" rx="${r}" fill="#10b981" opacity="0.15"/>
  <text x="50%" y="54%" font-size="${font}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">🎯</text>
</svg>`
}

const dir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

sizes.forEach(size => {
  fs.writeFileSync(path.join(dir, `icon-${size}.svg`), svgIcon(size))
  console.log(`✓ icon-${size}.svg`)
})

// Badge for notifications
fs.writeFileSync(path.join(dir, 'badge-72.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="16" fill="#10b981"/>
  <text x="50%" y="54%" font-size="36" text-anchor="middle" dominant-baseline="middle" font-family="system-ui">🎯</text>
</svg>`)

console.log('\n✅ SVG icons generated in public/icons/')
console.log('⚠️  For production PWA, convert SVGs to PNG using:')
console.log('   https://www.pwabuilder.com/imageGenerator or sharp CLI\n')
