#!/usr/bin/env node
// Run: node generate-icons.js
// Generates icon-16.png, icon-48.png, icon-128.png in the icons/ directory.

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function u32(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0)
  return b
}

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })()
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type)
  const crcInput = Buffer.concat([typeBytes, data])
  return Buffer.concat([u32(data.length), typeBytes, data, u32(crc32(crcInput))])
}

function makePNG(size, r, g, b) {
  // Each row: 1 filter byte (0=None) + size*3 bytes RGB
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(rowSize * size)

  // Draw a rounded square (white) with a leaf icon (green)
  // For simplicity: green (#2D5016) background, white leaf shape
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowSize + 1 + x * 3
      const cx = x - size / 2
      const cy = y - size / 2
      const rad = size / 2

      // White leaf shape: simple diamond/oval
      const leafW = size * 0.28
      const leafH = size * 0.42
      const onLeaf = (cx * cx) / (leafW * leafW) + (cy * cy) / (leafH * leafH) < 1

      if (onLeaf) {
        raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255
      } else {
        raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  const ihdr = Buffer.concat([
    u32(size), u32(size),
    Buffer.from([8, 2, 0, 0, 0]) // bit depth 8, RGB, no alpha
  ])

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const SIZES = [16, 48, 128]
const outDir = path.join(__dirname, 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

// Pantry green: #2D5016 = rgb(45, 80, 22)
for (const size of SIZES) {
  const png = makePNG(size, 45, 80, 22)
  const outPath = path.join(outDir, `icon-${size}.png`)
  fs.writeFileSync(outPath, png)
  console.log(`Created ${outPath} (${png.length} bytes)`)
}
