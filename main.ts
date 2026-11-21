// news-image-20261121 — "The world in one day: Saturday 21 November 2026"
// Node 22, stdlib only, no network. Writes one deterministic 1024x1024 PNG
// to $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png).
// The picture is drawn from scratch with a tiny built-in 5x7 bitmap font and
// a hand-coded PNG encoder (zlib + CRC32), so the program needs no assets.

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER = [246, 241, 230];
const INK = [22, 28, 38];
const NAVY = [22, 35, 63];
const NAVY2 = [38, 58, 96];
const RED = [193, 18, 31];
const RED_DK = [140, 12, 22];
const OCEAN = [191, 217, 232];
const LAND = [157, 179, 138];
const LAND2 = [138, 162, 122];
const WHITE = [255, 255, 255];
const GREY = [90, 96, 104];
const GOLD = [201, 162, 39];
const LINE = [200, 190, 168];

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph: 7 rows, 5 bits each (bit 4 = leftmost pixel). Uppercase only;
// drawText() uppercases input and maps lookalike punctuation.
const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0b01100, 0b01100],
  ",": [0, 0, 0, 0, 0b01100, 0b00100, 0b01000],
  ":": [0, 0b01100, 0b01100, 0, 0b01100, 0b01100, 0],
  ";": [0, 0b01100, 0b01100, 0, 0b01100, 0b00100, 0b01000],
  "-": [0, 0, 0, 0b01110, 0, 0, 0],
  "'": [0b00100, 0b00100, 0b01000, 0, 0, 0, 0],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  "/": [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  "&": [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  "%": [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  "+": [0, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0],
  $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0, 0b00100],
  "=": [0, 0, 0b11111, 0, 0b11111, 0, 0],
  ">": [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
  "<": [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
};

// ------------------------------------------------------------ pixel canvas
const px = new Uint8Array(W * H * 3);

function setPix(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPix(xx, yy, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: number[]): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) setPix(xx, yy, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, c: number[]): void {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPix(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    setPix(Math.round(cx + (r - 1) * Math.cos(rad)), Math.round(cy + (r - 1) * Math.sin(rad)), c);
  }
}

// Text: scale s -> glyph 5s wide, 7s tall, advance 5s+1 per char.
function textWidth(s: string, scale: number): number {
  return s.length * (5 * scale + 1) - 1;
}

function drawText(raw: string, x: number, y: number, scale: number, c: number[]): void {
  const s = raw
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/×/g, "X");
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if ((g[row] >> (4 - col)) & 1) {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 5 * scale + 1;
  }
}

function drawTextCentered(raw: string, cx: number, y: number, scale: number, c: number[]): void {
  drawText(raw, cx - Math.floor(textWidth(raw, scale) / 2), y, scale, c);
}

// ------------------------------------------------------------------- data
// 40 stories, first reported on Saturday 21 November 2026 (in some time
// zone) or happening that day. Headlines kept to 40 chars so they fit one
// line at scale 2 in a half-width column. Numbering matches the map pins.
const STORIES: string[] = [
  "POLAND: RUSSIAN MISSILES LAND; NATO JETS UP",
  "UKRAINE: 400+ DRONES, 110 MISSILES",
  "KYIV: 3 BRIDGES HIT; 8 KILLED IN STRIKES",
  "KRYVYI RIH: MISSILE STRIKE WOUNDS 42",
  "DENMARK: PLOT TO KILL RAPPER FOILED",
  "DENMARK EXPELS RUSSIAN DEFENCE ATTACHE",
  "ESTONIA TO SHUT BORDER WITH RUSSIA",
  "FRANCE SEEKS UN SECURITY COUNCIL MEETING",
  "HUNGARY LIFTS EU ACCESSION BLOCK",
  "EU: 45BN EURO LOAN AID FOR UKRAINE",
  "UK SENDS 1,000 DRONES TO UKRAINE",
  "UK-EU SIGN FOOD, CARBON, YOUTH DEALS",
  "US STOCKS PLUNGE INTO CORRECTION",
  "NASDAQ -5.3%; NVIDIA -14% IN AI ROUT",
  "TRUMP URGES NVIDIA TO BRING BACK HUANG",
  "SEC PROBING NVIDIA ACCOUNTING: REPORT",
  "TRUMP: UKRAINE PEACE DEAL BY EARLY JAN",
  "US OFFERS NATO PATH IF KYIV CEDS LAND",
  "TRUMP: NO RUSH ON IRAN DECISION",
  "US, ISRAEL WEIGH NEW STRIKES ON IRAN",
  "SAUDI ARMY INTERCEPTS HOUTHI MISSILES",
  "COP31 IN OVERTIME; FOSSIL FUELS OMITTED",
  "PERU: 6.7 QUAKE HITS CERRO DE PASCO",
  "US SANCTIONS 4 IRANIANS OVER OIL CASH",
  "US SANCTIONS COMANCHEROS, NDRANGHETA",
  "SENATE REJECTS IRAN WAR POWERS 51-48",
  "TRUMP PARDONS PETE ROSE POSTHUMOUSLY",
  "GUPTA JAILED 20 YEARS IN SIKH PLOT",
  "JPMORGAN, VISA, MASTERCARD CYBER HIT",
  "HYUNDAI UNVEILS 2027 ELANTRA IN LA",
  "REPORT: YOUTUBE EYES $3BN SETTLEMENT",
  "S AFRICA: 5,590 MURDERS IN JUL-SEP",
  "GOLD AT 14-MONTH LOW; -9.4% IN A WEEK",
  "RAHUL 100: FIRST INDIAN OPENER IN SENA",
  "INDIA 255/1 IN WELLINGTON TEST, DAY 3",
  "AKVAN AFTERMATH: ODISHA RELIEF GOES ON",
  "PANCREATIC CANCER PILL BREAKTHROUGH",
  "VIRGINIA: FIRST MEASLES DEATH OF 2026",
  "RAM, HONDA RECALL 893,000 VEHICLES",
  "TAIWAN: AIDE HELD IN FAKE VIDEO CASE",
];

// Stylised world map: [lonMin, latMin, lonMax, latMax] boxes.
const LAND_BOXES: number[][] = [
  [-168, 55, -130, 71],
  [-135, 45, -60, 60],
  [-125, 25, -66, 48],
  [-105, 14, -86, 26],
  [-92, 8, -78, 15],
  [-58, 60, -20, 83],
  [-80, -5, -35, 10],
  [-70, -35, -40, 0],
  [-75, -55, -55, -35],
  [-10, 36, 40, 60],
  [5, 58, 30, 70],
  [-17, 5, 35, 32],
  [12, -35, 40, 5],
  [35, 0, 52, 12],
  [40, 45, 180, 72],
  [60, 25, 135, 45],
  [75, 8, 90, 32],
  [95, 18, 125, 40],
  [95, 5, 105, 22],
  [130, 30, 145, 45],
  [43, 12, 60, 32],
  [113, -40, 154, -12],
  [166, -47, 178, -34],
];

// Map pins: [story number, lon, lat]
const PINS: number[][] = [
  [1, 19, 52],
  [2, 31, 50],
  [5, 10, 56],
  [7, 25, 59],
  [12, 4, 51],
  [13, -74, 41],
  [21, 47, 25],
  [22, 31, 37],
  [23, -76, -10],
  [27, -118, 34],
  [34, 175, -41],
  [36, 85, 20],
];

const MAP_X = 20;
const MAP_Y = 176;
const MAP_W = 984;
const MAP_H = 154;

function mapX(lon: number): number {
  return Math.round(MAP_X + ((lon + 180) / 360) * MAP_W);
}
function mapY(lat: number): number {
  return Math.round(MAP_Y + ((85 - lat) / 145) * MAP_H);
}

// ------------------------------------------------------------- composition
function compose(): void {
  fillRect(0, 0, W, H, PAPER);

  // ---- header: navy band with the day in big type
  fillRect(0, 0, W, 96, NAVY);
  fillRect(0, 92, W, 4, GOLD);
  drawText("THE WORLD IN ONE DAY", 24, 14, 2, GOLD);
  drawText("SATURDAY 21 NOVEMBER 2026", 24, 40, 4, WHITE);
  // right-hand count badge
  fillRect(836, 16, 164, 64, RED);
  drawTextCentered("40 STORIES", 918, 28, 2, WHITE);
  drawTextCentered("7 REGIONS", 918, 54, 2, WHITE);

  // ---- lead story banner
  fillRect(16, 108, 8, 56, RED);
  drawText("RUSSIAN MISSILES LAND IN POLAND", 40, 112, 3, RED_DK);
  drawText("TUSK: DELIBERATE PROVOCATION - NATO JETS SCRAMBLED", 40, 140, 2, INK);

  // ---- world map with numbered pins
  fillRect(MAP_X, MAP_Y, MAP_W, MAP_H, OCEAN);
  for (const b of LAND_BOXES) {
    const x1 = mapX(b[0]);
    const y1 = mapY(b[3]);
    const x2 = mapX(b[2]);
    const y2 = mapY(b[1]);
    fillRect(x1, y1, x2 - x1, y2 - y1, LAND);
  }
  // thin equator + tropics guides
  for (let x = MAP_X; x < MAP_X + MAP_W; x += 8) {
    setPix(x, mapY(0), NAVY2);
    setPix(x, mapY(23.5), NAVY2);
    setPix(x, mapY(-23.5), NAVY2);
  }
  for (const p of PINS) {
    const cx = mapX(p[1]);
    const cy = mapY(p[2]);
    fillCircle(cx, cy, 10, RED);
    ring(cx, cy, 10, WHITE);
    const label = String(p[0]);
    drawText(label, cx - Math.floor(textWidth(label, 1) / 2), cy - 3, 1, WHITE);
  }
  drawText("MAP: RED PINS MARK THE NUMBERED STORIES", MAP_X, MAP_Y + MAP_H + 4, 1, GREY);

  // ---- index header
  fillRect(16, 356, 992, 3, NAVY);
  drawText("THE DAY IN 40 STORIES", 16, 366, 2, NAVY);
  drawText("EUROPE 1-12  -  AMERICAS 13-14, 23, 27-28, 31, 38-39  -  MIDDLE EAST 19-21, 24-26", 380, 368, 1, GREY);

  // ---- index: two columns, 20 stories each
  const colX = [16, 524];
  const rowH = 27;
  const topY = 392;
  for (let i = 0; i < STORIES.length; i++) {
    const col = i < 20 ? 0 : 1;
    const row = i % 20;
    const x = colX[col];
    const y = topY + row * rowH;
    const n = i + 1;
    // number badge
    fillRect(x, y, 26, 22, n === 1 ? RED : NAVY2);
    const ns = String(n);
    drawText(ns, x + 13 - Math.floor(textWidth(ns, 2) / 2), y + 4, 2, WHITE);
    // headline, capped at 40 chars
    drawText(STORIES[i].slice(0, 40), x + 34, y + 4, 2, INK);
  }

  // ---- footer: DATE CHECK — what was deliberately left out
  const fy = 936;
  fillRect(0, fy, W, H - fy, NAVY);
  fillRect(0, fy, W, 3, GOLD);
  drawText("DATE CHECK", 24, fy + 12, 2, GOLD);
  drawText("NOT 21 NOV, EXCLUDED: SHENZHEN TRILATERAL - ICJ MYANMAR RULING -", 24, fy + 36, 2, WHITE);
  drawText("ANTHROPIC IPO - HAN DUCK-SOO - VOYAGER 1 LIGHT-DAY - GTA VI $1.84BN -", 24, fy + 54, 2, WHITE);
  drawText("PEW ISLAM 2035. AKVAN LANDFALL WAS 20 NOV: ONLY ITS RELIEF IS LISTED.", 24, fy + 72, 2, WHITE);
}

// ------------------------------------------------------------ PNG encoding
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // raw scanlines: filter byte 0 + RGB rows
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- main
function main(): void {
  compose();
  const png = encodePng();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/entry.png`;
  writeFileSync(outPath, png);
  const sha = createHash("sha256").update(png).digest("hex");
  console.log(`wrote ${outPath} ${png.length} bytes sha256=${sha} stories=${STORIES.length}`);
}

main();
