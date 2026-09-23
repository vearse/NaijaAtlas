/**
 * Generates PWA/PNG icons (no external deps) from the NaijaAtlas mark:
 * Nigeria flag tricolour (green/white/green).
 *  - public/icon-192.png            (any, 192x192)
 *  - public/icon-512.png            (any, 512x512)
 *  - public/icon-maskable-512.png   (maskable safe-zone, 512x512)
 *  - app/apple-icon.png             (iOS apple-touch-icon, 180x180)
 */
import { deflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const GREEN = [0x00, 0x87, 0x51, 0xff]; // #008751
const WHITE = [0xff, 0xff, 0xff, 0xff];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const o = rowStart + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function flagPixel(x, y, size, maskablePadding = 1) {
  const inset = maskablePadding < 1 ? Math.round((size * (1 - maskablePadding)) / 2) : 0;
  const inner = size - inset * 2;
  if (maskablePadding === 1) {
    return x < size / 3 || x >= (size * 2) / 3 ? GREEN : WHITE;
  }
  if (x < inset || y < inset || x >= inset + inner || y >= inset + inner) return GREEN;
  const lx = x - inset;
  return lx < inner / 3 || lx >= (inner * 2) / 3 ? GREEN : WHITE;
}

const out = [];
const root = process.cwd();
const targets = [
  { file: path.join(root, "public/icon-192.png"), size: 192, maskable: 1 },
  { file: path.join(root, "public/icon-512.png"), size: 512, maskable: 1 },
  { file: path.join(root, "public/icon-maskable-512.png"), size: 512, maskable: 0.72 },
  { file: path.join(root, "app/apple-icon.png"), size: 180, maskable: 1 },
];

for (const t of targets) {
  const png = encodePng(t.size, (x, y, s) => flagPixel(x, y, s, t.maskable));
  fs.writeFileSync(t.file, png);
  out.push(`${path.relative(root, t.file)} (${t.size}x${t.size})`);
}
console.log("Wrote:\n  " + out.join("\n  "));