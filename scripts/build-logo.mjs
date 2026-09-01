/**
 * Builds the RWACARD mark from a flat black-on-white artwork file.
 *
 *   node scripts/build-logo.mjs <source.png>
 *
 * The source is any square PNG with the mark drawn in black on white. This
 * crops it to the ink, turns the white away into transparency (keeping the
 * antialiasing as alpha), scales it down and centres it on the white rounded
 * tile the site uses, then writes public/logo.png and the two app icons.
 *
 * PNG decode and encode are done here rather than with a library so the repo
 * needs no image dependency for a job it does once per rebrand.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

const SIZE = 512; // canvas the mark is delivered at
const RADIUS = 105; // tile corner radius, matching the site's badge
const COVER = 0.54; // mark width as a share of the tile
const INK = 110; // luma below this counts as ink when finding the crop box

/* --- PNG decode ---------------------------------------------------------- */

function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");

  let offset = 8;
  let header = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  if (!header) throw new Error("no IHDR");
  if (header.depth !== 8) throw new Error(`unsupported bit depth ${header.depth}`);
  if (header.interlace !== 0) throw new Error("interlaced PNGs are not supported");

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.colorType];
  if (!channels) throw new Error(`unsupported colour type ${header.colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const { width, height } = header;
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const target = y * stride;
    const above = target - stride;

    for (let x = 0; x < stride; x += 1) {
      const rawByte = line[x];
      const left = x >= channels ? out[target + x - channels] : 0;
      const up = y > 0 ? out[above + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[above + x - channels] : 0;
      let value;

      switch (filter) {
        case 0:
          value = rawByte;
          break;
        case 1:
          value = rawByte + left;
          break;
        case 2:
          value = rawByte + up;
          break;
        case 3:
          value = rawByte + ((left + up) >> 1);
          break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          value = rawByte + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          throw new Error(`unknown filter ${filter}`);
      }
      out[target + x] = value & 0xff;
    }
  }

  return { ...header, channels, pixels: out };
}

/* --- PNG encode ---------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = width * 4;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    filtered[y * (stride + 1)] = 0; // filter: none
    rgba.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(filtered, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* --- Build --------------------------------------------------------------- */

const source = process.argv[2];
if (!source) {
  console.error("usage: node scripts/build-logo.mjs <source.png>");
  process.exit(1);
}

const img = decodePng(readFileSync(source));
const { width: sw, height: sh, channels, pixels } = img;
const luma = (i) =>
  channels >= 3
    ? pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
    : pixels[i];

// 1. Crop to the ink, so the artwork's own margin and frame drop away.
let minX = sw;
let minY = sh;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < sh; y += 1) {
  for (let x = 0; x < sw; x += 1) {
    const i = (y * sw + x) * channels;
    const alpha = channels === 4 ? pixels[i + 3] : channels === 2 ? pixels[i + 1] : 255;
    if (alpha > 10 && luma(i) < INK) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
if (maxX < 0) throw new Error("no ink found in the source");
const markW = maxX - minX + 1;
const markH = maxY - minY + 1;

// 2. White falls away; what is left is coverage, so the antialiasing survives.
const coverage = new Float64Array(markW * markH);
for (let y = 0; y < markH; y += 1) {
  for (let x = 0; x < markW; x += 1) {
    const i = ((y + minY) * sw + (x + minX)) * channels;
    coverage[y * markW + x] = Math.min(1, Math.max(0, 1 - luma(i) / 255));
  }
}

// 3. Area-average down to the drawn size. Colour is constant black, so only
//    coverage needs resampling.
const drawW = Math.round(SIZE * COVER);
const drawH = Math.round((drawW * markH) / markW);
const small = new Float64Array(drawW * drawH);
for (let y = 0; y < drawH; y += 1) {
  const y0 = (y * markH) / drawH;
  const y1 = ((y + 1) * markH) / drawH;
  for (let x = 0; x < drawW; x += 1) {
    const x0 = (x * markW) / drawW;
    const x1 = ((x + 1) * markW) / drawW;
    let sum = 0;
    let weight = 0;
    for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy += 1) {
      const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
      for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx += 1) {
        const wx = Math.min(x1, sx + 1) - Math.max(x0, sx);
        const w = wy * wx;
        sum += coverage[sy * markW + sx] * w;
        weight += w;
      }
    }
    small[y * drawW + x] = weight > 0 ? sum / weight : 0;
  }
}

// 4. Rounded tile, supersampled 4x4 so the corners are not stepped.
function tileAlpha(px, py) {
  let hits = 0;
  for (let sy = 0; sy < 4; sy += 1) {
    for (let sx = 0; sx < 4; sx += 1) {
      const x = px + (sx + 0.5) / 4;
      const y = py + (sy + 0.5) / 4;
      const cx = x < RADIUS ? RADIUS : x > SIZE - RADIUS ? SIZE - RADIUS : x;
      const cy = y < RADIUS ? RADIUS : y > SIZE - RADIUS ? SIZE - RADIUS : y;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= RADIUS * RADIUS) hits += 1;
    }
  }
  return hits / 16;
}

const offsetX = Math.round((SIZE - drawW) / 2);
const offsetY = Math.round((SIZE - drawH) / 2);
const canvas = Buffer.alloc(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const i = (y * SIZE + x) * 4;
    const tile = tileAlpha(x, y);
    const mx = x - offsetX;
    const my = y - offsetY;
    const ink =
      mx >= 0 && my >= 0 && mx < drawW && my < drawH ? small[my * drawW + mx] : 0;
    const level = Math.round(255 * (1 - ink)); // black mark over white tile
    canvas[i] = level;
    canvas[i + 1] = level;
    canvas[i + 2] = level;
    canvas[i + 3] = Math.round(255 * tile);
  }
}

const png = encodePng(SIZE, SIZE, canvas);
for (const target of ["public/logo.png", "src/app/icon.png", "src/app/apple-icon.png"]) {
  writeFileSync(target, png);
}

console.log(
  `source ${sw}x${sh} · ink ${markW}x${markH} at (${minX},${minY}) · drawn ${drawW}x${drawH} · ${png.length} bytes each`,
);
