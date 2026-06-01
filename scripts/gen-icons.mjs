// Generates PWA PNG icons with no external dependencies.
// Draws a Czech-flag-inspired tile: white/red bands with a blue hoist triangle.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(size, draw, { padding = 0 } = {}) {
  // RGBA raw image with per-row filter byte 0.
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size, padding)
      const o = y * (stride + 1) + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const WHITE = [255, 255, 255, 255]
const RED = [215, 20, 26, 255]
const BLUE = [17, 69, 126, 255]
const NAVY = [17, 50, 77, 255]

function flag(x, y, size, padding) {
  // Optional padding for maskable safe zone.
  const inset = padding
  if (x < inset || y < inset || x >= size - inset || y >= size - inset) return NAVY
  const w = size - inset * 2
  const px = x - inset
  const py = y - inset
  // Blue triangle on the hoist side reaching the vertical center.
  const triEdge = (py <= w / 2 ? py : w - py) * (w / 2) / (w / 2)
  if (px <= triEdge) return BLUE
  return py < w / 2 ? WHITE : RED
}

for (const [name, size, pad] of [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['icon-512-maskable.png', 512, 64],
]) {
  const png = encodePNG(size, flag, { padding: pad })
  writeFileSync(join(OUT, name), png)
  console.log('wrote', name, png.length, 'bytes')
}
