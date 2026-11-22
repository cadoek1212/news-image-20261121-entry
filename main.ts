// news-image-20261121 v2 — "The World in One Day"
// A one-image newspaper summary of Saturday 21 November 2026.
// Node 22, standard library only, no network. Draws a deterministic
// 1024x1024 PNG to /output/entry.png (or $MAKEFUN_OUTPUT_DIR).
// Written fresh in this session. All artwork is original vector work
// drawn by this program; every story was checked against live news
// reporting for 21 November 2026 (UTC).

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

export const W = 1024;
export const H = 1024;

// ---------------------------------------------------------------- font --
// A 5x7 bitmap font, drawn from scratch. Every glyph is 7 rows of 5 bits.
// Text is rendered in capitals; drawText uppercases and strips accents.
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "<": ["00001", "00010", "00100", "01000", "00100", "00010", "00001"],
  ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
};

export type RGB = [number, number, number];

export const INK: RGB = [20, 20, 20];
export const PAPER: RGB = [247, 242, 231];
export const RED: RGB = [179, 38, 30];
export const BLUE: RGB = [29, 78, 137];
export const GREEN: RGB = [30, 107, 52];
export const OCHRE: RGB = [178, 106, 0];
export const PURPLE: RGB = [123, 45, 139];
export const TEAL: RGB = [15, 118, 110];
export const BURNT: RGB = [179, 84, 30];
export const OLIVE: RGB = [91, 122, 41];
export const GREY: RGB = [51, 51, 51];
export const OCEAN: RGB = [223, 233, 236];
export const LAND: RGB = [232, 221, 196];
export const LANDLINE: RGB = [138, 125, 95];
export const WHITE: RGB = [255, 255, 255];
export const LIGHT: RGB = [233, 226, 210];

// ------------------------------------------------------------- canvas --
export class Canvas {
  w: number;
  h: number;
  buf: Buffer;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      this.buf[i * 3] = bg[0];
      this.buf[i * 3 + 1] = bg[1];
      this.buf[i * 3 + 2] = bg[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.px(cx + x, cy + y, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const t = (a * Math.PI) / 180;
      this.px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
    }
  }
  poly(pts: [number, number][], c: RGB): void {
    // Scanline fill of a simple polygon.
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) this.px(x, y, c);
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      this.line(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), LANDLINE);
    }
  }
}

// -------------------------------------------------------------- text ---
export function clean(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/×/g, "X")
    .replace(/·/g, ".")
    .toUpperCase();
}

export function textW(s: string, scale: number): number {
  const t = clean(s);
  if (t.length === 0) return 0;
  return t.length * 6 * scale - scale;
}

export function drawText(
  cv: Canvas,
  s: string,
  x: number,
  y: number,
  scale: number,
  c: RGB,
): void {
  const t = clean(s);
  let cx = x;
  for (const ch of t) {
    const g = GLYPHS[ch] ?? GLYPHS["?"];
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row[col] === "1") cv.rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

export function drawTextC(cv: Canvas, s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(cv, s, cx - Math.floor(textW(s, scale) / 2), y, scale, c);
}

export function wrap(s: string, maxW: number, scale: number): string[] {
  const words = clean(s).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textW(trial, scale) <= maxW || !cur) cur = trial;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ----------------------------------------------------------- png out ---
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

export function writePng(cv: Canvas, outPath: string): void {
  const raw = Buffer.alloc((cv.w * 3 + 1) * cv.h);
  for (let y = 0; y < cv.h; y++) {
    raw[y * (cv.w * 3 + 1)] = 0;
    cv.buf.copy(raw, y * (cv.w * 3 + 1) + 1, y * cv.w * 3, (y + 1) * cv.w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
}

// ------------------------------------------------------------ stories --
// 44 stories, all dated Saturday 21 November 2026 (UTC): each happened
// or was first reported that day, as the named outlets reported it.
// Regions: MIDDLE EAST 8, EUROPE 11, AMERICAS 6, AFRICA 3, SOUTH ASIA 5,
// EAST ASIA 4, SOUTH-EAST ASIA 3, OCEANIA 1, GLOBAL 3 = 44, 9 regions.
export interface Story {
  n: number;
  region: string;
  color: RGB;
  place: string;
  head: string;
  body: string;
  src: string;
  tag: string; // CONFIRMED / OFFICIAL / REPORTED
  lon: number;
  lat: number;
  dx?: number; // pin nudge on the map, px
  dy?: number;
}

export const ME = RED;
export const EU = BLUE;
export const AM = GREEN;
export const AF = OCHRE;
export const SA = PURPLE;
export const EA = TEAL;
export const SEA = BURNT;
export const OC = OLIVE;
export const GL = GREY;

export const STORIES: Story[] = [
  { n: 1, region: "MIDDLE EAST", color: ME, place: "BAHRAIN", head: "Iran strikes Bahrain as tankers burn in Hormuz", body: "IRGC says it hit US positions at al-Riffa and Awali bases; Bahrain says a civilian industrial site caught fire, no one hurt, and air defences stopped more attacks.", src: "REUTERS - AP - AL JAZEERA", tag: "CONFIRMED", lon: 50.6, lat: 26.2 },
  { n: 2, region: "MIDDLE EAST", color: ME, place: "STRAIT OF HORMUZ", head: "Two tankers hit off Khasab in an hour", body: "UKMTO: projectiles struck the stern of one tanker at 05:00 UTC and the engine room of a second 50 minutes later, 11 and 17 nautical miles off Oman. No casualties.", src: "REUTERS - UKMTO", tag: "CONFIRMED", lon: 56.5, lat: 26.6, dx: 10, dy: -8 },
  { n: 3, region: "EUROPE", color: EU, place: "GULF OF FINLAND", head: "Drones set Russian cargo ship ablaze off Finland", body: "Sparta II, bound for Kaliningrad, was hit by two drones and drifted into Finnish waters on fire. All 16 crew evacuated.", src: "REUTERS - BBC - YLE", tag: "CONFIRMED", lon: 27.0, lat: 59.9 },
  { n: 4, region: "GLOBAL", color: GL, place: "COP31, ANTALYA", head: "COP31 deadlocked over fossil fuels in overtime", body: "A day past its deadline, talks paused overnight with no deal. The draft omits fossil fuels; 130+ countries want them named.", src: "AP - AFP - REUTERS", tag: "CONFIRMED", lon: 30.7, lat: 36.9 },
  { n: 5, region: "EUROPE", color: EU, place: "BRUSSELS", head: "EU and Indonesia sign trade pact after 10 years", body: "CEPA signed in Brussels: 98.5% of tariffs go, saving EU exporters about EUR 650m a year.", src: "EU COMMISSION - ANTARA - AFP", tag: "OFFICIAL", lon: 4.35, lat: 50.85 },
  { n: 6, region: "AMERICAS", color: AM, place: "GUASAVE, MEXICO", head: "Mexico seizes 'El Chapo Isidro' in deadly raid", body: "FBI most-wanted Fausto Isidro Meza Flores seized overnight; 7 gunmen and 4 soldiers killed.", src: "AP - REUTERS - DEFENCE MINISTRY", tag: "CONFIRMED", lon: -108.5, lat: 25.6 },
  { n: 7, region: "GLOBAL", color: GL, place: "GENEVA", head: "UN 'killer robot' talks end with no binding treaty", body: "After a week ending at 04:30 on Saturday, states agreed only to keep talking for two more years.", src: "AP - NPR", tag: "CONFIRMED", lon: 6.14, lat: 46.2 },
  { n: 8, region: "GLOBAL", color: GL, place: "MERCURY", head: "BepiColombo enters orbit around Mercury", body: "After an 8-year journey, ESA-JAXA's probe fired its thrusters for 37 minutes from 18:24 UTC.", src: "ESA - JAXA - NATURE", tag: "OFFICIAL", lon: 8.65, lat: 49.87, dx: 6, dy: -6 },
  { n: 9, region: "SOUTH-EAST ASIA", color: SEA, place: "BANDA SEA", head: "Deep quake M6.8 shakes Timor-Leste and Darwin", body: "09:42 UTC, 226 km north-east of Dili at 117 km depth. No tsunami warning.", src: "REUTERS - GFZ - USGS", tag: "CONFIRMED", lon: 130.5, lat: -7.5 },
  { n: 10, region: "EUROPE", color: EU, place: "TWICKENHAM", head: "England rout All Blacks 37-12 in record win", body: "Five tries and a 25-point margin, England's biggest ever over New Zealand.", src: "ENGLAND RUGBY - AP", tag: "CONFIRMED", lon: -0.3, lat: 51.45 },
  { n: 11, region: "EAST ASIA", color: EA, place: "OSAKA", head: "BTS take five MAMA awards, Album of the Year", body: "'Arirang' wins Album of the Year on night two in Osaka; CORTIS takes Song of the Year.", src: "YONHAP - KOREA JOONGANG DAILY", tag: "CONFIRMED", lon: 135.5, lat: 34.7 },
  { n: 12, region: "EUROPE", color: EU, place: "PARIS", head: "Sixth Saturday of cost-of-living marches", body: "82,500 march across France by the ministry count, 150,000 by organisers.", src: "REUTERS - AFP", tag: "CONFIRMED", lon: 2.35, lat: 48.85 },
  { n: 13, region: "AMERICAS", color: AM, place: "JUNIN, PERU", head: "Peru quake M6.7 kills 1, hurts 16", body: "00:09 UTC, 30 km north-west of Junin at 129 km depth. 152 homes uninhabitable; power cut in four regions.", src: "AFP - AP - INDECI", tag: "CONFIRMED", lon: -76.0, lat: -11.0 },
  { n: 14, region: "SOUTH-EAST ASIA", color: SEA, place: "SERANG, INDONESIA", head: "Candy factory fire: 3 dead, 36 missing", body: "Blaze swept the 3-storey Fonusa Agung Mulia plant in Cikande on Saturday afternoon; 15 rescued alive.", src: "AP - REUTERS - BASARNAS", tag: "CONFIRMED", lon: 106.15, lat: -6.1 },
  { n: 15, region: "SOUTH ASIA", color: SA, place: "WELLINGTON", head: "KL Rahul 136 puts India on top in Wellington", body: "His 13th Test hundred, first in New Zealand, makes him the first Indian opener with tons in all SENA countries.", src: "AFP - BCCI", tag: "CONFIRMED", lon: 174.8, lat: -41.3 },
  { n: 16, region: "AMERICAS", color: AM, place: "CLEVELAND", head: "Harden 51, passes Kobe in NBA history", body: "Cavaliers beat Pacers 128-119 in the NBA Cup; his 26th 50-point game moves him past Kobe Bryant into 3rd all-time.", src: "AP - NBA", tag: "CONFIRMED", lon: -81.7, lat: 41.5 },
  { n: 17, region: "EUROPE", color: EU, place: "KYIV", head: "Zelenskyy backs trilateral talks before Christmas", body: "US proposes a Ukraine-Russia-US round before Christmas; Zelenskyy says yes and floats the G20 in Miami as venue.", src: "WASHINGTON POST - UKRAINSKA PRAVDA", tag: "REPORTED", lon: 30.5, lat: 50.45 },
  { n: 18, region: "SOUTH ASIA", color: SA, place: "DHAKA", head: "Bangladesh deploys troops as unrest spreads", body: "Hundreds of extra paramilitary troops out as BNP and Awami League supporters clash; at least 4 killed since 14 Nov.", src: "PTI - REUTERS - DHAKA TRIBUNE", tag: "CONFIRMED", lon: 90.4, lat: 23.8 },
  { n: 19, region: "AFRICA", color: AF, place: "BAYELSA, NIGERIA", head: "Funeral boat toll reaches 24 in Bayelsa", body: "Crowded boat carrying mourners capsized on Friday; NEMA confirms 24 bodies recovered and 24 survivors by Saturday.", src: "AP - REUTERS - NEMA", tag: "CONFIRMED", lon: 6.3, lat: 4.9 },
  { n: 20, region: "SOUTH ASIA", color: SA, place: "CHANDEL, INDIA", head: "Toxic liquor toll reaches 11 in Manipur", body: "Methanol poisoning since 18 Nov: 11 dead, 180+ in hospital in Imphal; probe ordered into the supply chain.", src: "PTI - BBC", tag: "CONFIRMED", lon: 94.2, lat: 24.4 },
  { n: 21, region: "MIDDLE EAST", color: ME, place: "RIYADH", head: "Saudi defences down 3 Houthi missiles at Riyadh", body: "Coalition intercepts three ballistic missiles early Saturday, two days after a strike damaged the PIF tower.", src: "REUTERS - AL JAZEERA", tag: "CONFIRMED", lon: 46.7, lat: 24.7, dx: -12, dy: 8 },
  { n: 22, region: "EAST ASIA", color: EA, place: "QINGHAI, CHINA", head: "Quake M5.9 strikes Qinghai at 10:45 UTC", body: "238 km south-west of Yanglong, 10 km deep; felt in Xining and Lanzhou. China centre puts it at 5.6.", src: "USGS - XINHUA - GFZ", tag: "CONFIRMED", lon: 96.6, lat: 37.2 },
  { n: 23, region: "MIDDLE EAST", color: ME, place: "JERUSALEM", head: "Eisenkot invites Likud into coalition talks", body: "Former IDF chief Gadi Eisenkot reaches out to Likud as Israel's coalition bargaining moves on.", src: "TIMES OF ISRAEL", tag: "REPORTED", lon: 35.2, lat: 31.8, dx: 10, dy: 6 },
  { n: 24, region: "MIDDLE EAST", color: ME, place: "GAZA", head: "Strike on Gaza food vehicle kills 3", body: "Israeli strike hits a food distribution vehicle, killing three, medics say.", src: "REUTERS", tag: "REPORTED", lon: 34.5, lat: 31.5, dx: -10, dy: -8 },
  { n: 25, region: "EUROPE", color: EU, place: "KYIV", head: "Zelenskyy calls bridge strike a 'fair response'", body: "Kyiv says its strike on a Russian bridge answers the attacks on Ukrainian cities.", src: "KYIV INDEPENDENT - BBC", tag: "REPORTED", lon: 30.5, lat: 50.45, dx: 12, dy: 10 },
  { n: 26, region: "MIDDLE EAST", color: ME, place: "BEIRUT", head: "Aoun demands Israel pull out of Lebanon", body: "President Joseph Aoun presses Israel to withdraw from Lebanese territory.", src: "AL JAZEERA - AFP", tag: "REPORTED", lon: 35.5, lat: 33.9 },
  { n: 27, region: "AMERICAS", color: AM, place: "BRASILIA", head: "Bolsonaro taken to intensive care", body: "Ex-president, 71, in ICU with an intestinal obstruction; stable and conscious, hospital says Saturday.", src: "REUTERS - AFP", tag: "CONFIRMED", lon: -47.9, lat: -15.8 },
  { n: 28, region: "AMERICAS", color: AM, place: "WASHINGTON", head: "FBI reports breach of crime database", body: "The bureau discloses a breach of its crime database; scope under review.", src: "BBC", tag: "REPORTED", lon: -77.0, lat: 38.9 },
  { n: 29, region: "SOUTH-EAST ASIA", color: SEA, place: "HANOI", head: "Vietnam passes speed-limit and land laws", body: "Parliament approves new speed limits and land-use rules in Saturday's session.", src: "VIETNAM NEWS", tag: "REPORTED", lon: 105.85, lat: 21.0 },
  { n: 30, region: "SOUTH ASIA", color: SA, place: "SAVAR, BANGLADESH", head: "80 garment factories shut in wage protest", body: "Factories close as garment workers protest over pay in the Savar hub.", src: "TBS - DAILY STAR", tag: "REPORTED", lon: 90.25, lat: 23.85, dx: 12, dy: -8 },
  { n: 31, region: "MIDDLE EAST", color: ME, place: "STRAIT OF HORMUZ", head: "Pugh ends 15 km Hormuz swim amid tanker war", body: "Lewis Pugh finishes a 3-day swim through the strait to warn of war's toll on marine life.", src: "AP - BBC", tag: "CONFIRMED", lon: 56.5, lat: 26.6, dx: -14, dy: 10 },
  { n: 32, region: "SOUTH ASIA", color: SA, place: "MASTUNG, PAKISTAN", head: "Pakistan forces kill 15 militants in Mastung", body: "Security forces kill 15 militants in an operation in Balochistan, state media say.", src: "DAWN - TRIBUNE", tag: "REPORTED", lon: 66.9, lat: 29.8 },
  { n: 33, region: "EAST ASIA", color: EA, place: "BEIJING", head: "Singapore PM Wong meets Li Qiang in Beijing", body: "Lawrence Wong holds talks with Chinese Premier Li Qiang on ties and trade.", src: "STRAITS TIMES", tag: "REPORTED", lon: 116.4, lat: 39.9 },
  { n: 34, region: "EUROPE", color: EU, place: "ZAGREB", head: "Thousands rally over psychiatric ward death", body: "Crowds march in Zagreb after a death on a psychiatric ward; calls grow for an inquiry.", src: "REUTERS - RTE", tag: "REPORTED", lon: 15.98, lat: 45.8 },
  { n: 35, region: "AFRICA", color: AF, place: "ABUJA", head: "CAF makes Kiswahili its 5th official language", body: "African football body adds Kiswahili as an official language, CAF announces.", src: "CAF - NATION", tag: "OFFICIAL", lon: 7.5, lat: 9.05 },
  { n: 36, region: "AFRICA", color: AF, place: "NIGER STATE", head: "Gunmen kill village head in Niger State raid", body: "Attackers kill a village head in a raid in Niger State, police say.", src: "TRUST - PREMIUM TIMES", tag: "REPORTED", lon: 6.5, lat: 10.0, dx: -12, dy: -8 },
  { n: 37, region: "EUROPE", color: EU, place: "CORNWALL", head: "Spitting Image co-creator dies at 85", body: "Peter Fluck, who co-created the satirical puppet show, dies aged 85.", src: "BBC - TIMES", tag: "CONFIRMED", lon: -5.0, lat: 50.2 },
  { n: 38, region: "EUROPE", color: EU, place: "BRUSSELS", head: "Costa floats 3% EU digital tax on big tech", body: "Council chief Antonio Costa proposes a 3% levy as the EU drafts a EUR 1,582bn budget.", src: "DW - AFP", tag: "REPORTED", lon: 4.35, lat: 50.85, dx: 12, dy: 8 },
  { n: 39, region: "EUROPE", color: EU, place: "GERMANY", head: "IG Metall calls 23,000 out on strike Monday", body: "Germany's biggest union calls a Monday walkout in the metals dispute.", src: "DPA - REUTERS", tag: "REPORTED", lon: 10.0, lat: 51.0 },
  { n: 40, region: "MIDDLE EAST", color: ME, place: "WASHINGTON", head: "US sanctions 4 Iran 'oil trustees'", body: "Washington blacklists four people it calls trustees of Iran's oil trade.", src: "REUTERS - TREASURY", tag: "OFFICIAL", lon: -77.0, lat: 38.9, dx: -12, dy: 10 },
  { n: 41, region: "EAST ASIA", color: EA, place: "BEIJING", head: "China holds loan rates for 18th month", body: "Beijing keeps benchmark loan prime rates unchanged for an 18th straight month.", src: "REUTERS - PBOC", tag: "OFFICIAL", lon: 116.4, lat: 39.9, dx: -12, dy: -8 },
  { n: 42, region: "AMERICAS", color: AM, place: "OTTAWA", head: "Canada gives C$100m to NATO Innovation Fund", body: "Ottawa pledges C$100 million to NATO's tech fund.", src: "GOVERNMENT OF CANADA", tag: "OFFICIAL", lon: -75.7, lat: 45.4 },
  { n: 43, region: "OCEANIA", color: OC, place: "AUSTRALIA", head: "Australia beat England by 3 wickets in 1st T20", body: "Hosts take the T20 series opener against England.", src: "BBC - ABC", tag: "CONFIRMED", lon: 151.2, lat: -33.9 },
  { n: 44, region: "EUROPE", color: EU, place: "TURIN", head: "Alcaraz beats Shelton, faces Zverev in final", body: "Carlos Alcaraz reaches the ATP Finals title match in Turin.", src: "BBC - AFP", tag: "CONFIRMED", lon: 7.7, lat: 45.07 },
];

// Stories that were deliberately left out: they happened, or were first
// reported, before Saturday 21 November 2026 (UTC).
export const DATE_CHECK =
  "FRI 20 NOV: RUSSIAN MISSILES LAND IN POLAND; 404-DRONE BARRAGE ON UKRAINE; KRYVYI RIH DOUBLE-TAP KILLS 2; WALL ST FALLS; PENNY LAW SIGNED; DENMARK EXPELS RUSSIAN ATTACHE OVER KYIVSTONER PLOT; GTA VI $2.36BN. THU 19 NOV: ICJ MYANMAR RULING; TRUMP-XI-PUTIN TALKS; PIF TOWER HIT; GTA VI $1.84BN. EARLIER: ANTHROPIC IPO; VOYAGER 1; HAN DUCK-SOO; PEW ISLAM 2035.";

export const TIMELINE: [string, string][] = [
  ["00:09", "PERU M6.7"],
  ["04:30", "GENEVA TALKS END"],
  ["05:00", "TANKERS HIT"],
  ["06:50", "SPARTA II"],
  ["09:42", "BANDA SEA M6.8"],
  ["10:45", "QINGHAI M5.9"],
  ["12:12", "EU-INDONESIA PACT"],
  ["18:24", "BEPICOLOMBO"],
  ["EVENING", "IRAN HITS BAHRAIN"],
];

export const REGION_COUNTS: [string, RGB, number][] = [
  ["MIDDLE EAST", ME, 8],
  ["EUROPE", EU, 11],
  ["AMERICAS", AM, 6],
  ["AFRICA", AF, 3],
  ["SOUTH ASIA", SA, 5],
  ["EAST ASIA", EA, 4],
  ["SOUTH-EAST ASIA", SEA, 3],
  ["OCEANIA", OC, 1],
  ["GLOBAL", GL, 3],
];

// ------------------------------------------------------------ layout ---
const MX = 16;
const CW = W - 2 * MX; // 992

function rule(cv: Canvas, y: number, c: RGB = INK, t = 1): void {
  cv.hline(MX, y, CW, c, t);
}

function badge(cv: Canvas, x: number, y: number, n: number, color: RGB): void {
  cv.disc(x + 7, y + 7, 8, color);
  cv.ring(x + 7, y + 7, 8, WHITE);
  const s = String(n);
  drawText(cv, s, x + 8 - Math.floor(textW(s, 1) / 2), y + 4, 1, WHITE);
}

function doodleMissiles(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // Three red trails arcing down onto a burst, over a pale gulf strip.
  cv.rect(x, y + h - 12, w, 12, [214, 226, 228]);
  cv.rect(x, y + h - 12, Math.floor(w * 0.3), 12, LAND);
  for (let i = 0; i < 3; i++) {
    const sx = x + w - 20 - i * 34;
    const sy = y + 4;
    const ex = x + 30 + i * 22;
    const ey = y + h - 22;
    cv.line(sx, sy, ex, ey, RED);
    cv.disc(sx, sy, 3, RED);
  }
  const bx = x + 52;
  const by = y + h - 26;
  for (let a = 0; a < 8; a++) {
    const t = (a * Math.PI) / 4;
    cv.line(bx, by, Math.round(bx + 16 * Math.cos(t)), Math.round(by + 16 * Math.sin(t)), OCHRE);
  }
  cv.disc(bx, by, 6, RED);
}

function doodleShip(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A cargo ship on a strip of sea, containers ablaze.
  cv.rect(x, y + h - 14, w, 14, [190, 210, 220]);
  const hy = y + h - 26;
  cv.rect(x + 14, hy, w - 28, 12, INK); // hull
  cv.rect(x + 20, hy - 14, 26, 14, BLUE); // bridge
  cv.rect(x + 52, hy - 10, 18, 10, RED);
  cv.rect(x + 74, hy - 10, 18, 10, OCHRE);
  cv.rect(x + 96, hy - 10, 18, 10, TEAL);
  // flames
  for (const fx of [x + 60, x + 82, x + 104]) {
    cv.line(fx, hy - 10, fx + 4, hy - 26, OCHRE);
    cv.line(fx + 6, hy - 10, fx + 2, hy - 24, RED);
    cv.disc(fx + 3, hy - 28, 3, RED);
  }
  // smoke
  cv.disc(x + 70, y + 8, 6, GREY);
  cv.disc(x + 84, y + 4, 5, GREY);
  cv.disc(x + 98, y + 9, 6, GREY);
}

function doodleDraft(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A draft text page with FOSSIL FUELS struck out, beside a clock.
  const dw = Math.floor(w * 0.55);
  cv.rect(x, y, dw, h, WHITE);
  cv.frame(x, y, dw, h, INK, 1);
  drawText(cv, "DRAFT TEXT", x + 6, y + 3, 1, INK);
  for (let i = 0; i < 3; i++) cv.hline(x + 6, y + 14 + i * 6, dw - 12, LIGHT, 2);
  drawText(cv, "FOSSIL FUELS", x + 6, y + 32, 1, RED);
  cv.line(x + 4, y + 35, x + dw - 4, y + 35, RED);
  const cx = x + dw + Math.floor((w - dw) / 2);
  const cy = y + 22;
  cv.ring(cx, cy, 15, INK);
  cv.line(cx, cy, cx, cy - 10, INK);
  cv.line(cx, cy, cx + 7, cy + 4, INK);
}

function feature(cv: Canvas, s: Story, x: number, y: number, w: number, h: number): void {
  cv.frame(x, y, w, h, INK, 1);
  cv.rect(x + 1, y + 1, w - 2, 16, s.color);
  drawText(cv, s.n + " " + s.region + " - " + s.place, x + 6, y + 5, 1, WHITE);
  const tagW = textW(s.tag, 1);
  drawText(cv, s.tag, x + w - 6 - tagW, y + 5, 1, WHITE);
  let cy = y + 22;
  const headLines = wrap(s.head, w - 16, 3).slice(0, 4);
  for (const ln of headLines) {
    drawText(cv, ln, x + 8, cy, 3, INK);
    cy += 24;
  }
  cy += 4;
  const doodleH = 44;
  if (s.n === 1) doodleMissiles(cv, x + 8, cy, w - 16, doodleH);
  else if (s.n === 3) doodleShip(cv, x + 8, cy, w - 16, doodleH);
  else doodleDraft(cv, x + 8, cy, w - 16, doodleH);
  cy += doodleH + 6;
  const bodyLines = wrap(s.body, w - 16, 1).slice(0, 3);
  for (const ln of bodyLines) {
    drawText(cv, ln, x + 8, cy, 1, INK);
    cy += 9;
  }
  drawText(cv, s.src, x + 8, y + h - 12, 1, GREY);
}

function card(cv: Canvas, s: Story, x: number, y: number, w: number, h: number): void {
  cv.frame(x, y, w, h, INK, 1);
  cv.rect(x + 1, y + 1, w - 2, 14, s.color);
  badge(cv, x + 3, y + 1, s.n, s.color);
  drawText(cv, s.region, x + 20, y + 4, 1, WHITE);
  let cy = y + 20;
  const headLines = wrap(s.head, w - 14, 2).slice(0, 3);
  for (const ln of headLines) {
    drawText(cv, ln, x + 7, cy, 2, INK);
    cy += 16;
  }
  cy += 2;
  const bodyLines = wrap(s.body, w - 14, 1).slice(0, 3);
  for (const ln of bodyLines) {
    drawText(cv, ln, x + 7, cy, 1, INK);
    cy += 9;
  }
  drawText(cv, s.src, x + 7, y + h - 11, 1, GREY);
}

// Rough continent outlines, hand-drawn (lon, lat).
const CONTINENTS: [number, number][][] = [
  [ // North America
    [-168, 66], [-140, 70], [-120, 72], [-95, 80], [-80, 73], [-60, 60], [-55, 47],
    [-70, 42], [-75, 35], [-80, 26], [-90, 21], [-97, 16], [-105, 20], [-115, 30],
    [-125, 40], [-125, 48], [-140, 60], [-155, 58], [-165, 60],
  ],
  [ // South America
    [-80, 10], [-60, 8], [-50, 0], [-35, -8], [-40, -20], [-48, -28], [-58, -35],
    [-65, -40], [-70, -50], [-73, -40], [-75, -20], [-80, -5],
  ],
  [ // Africa
    [-17, 15], [-10, 30], [0, 36], [10, 37], [20, 32], [32, 31], [35, 28], [40, 15],
    [48, 11], [51, 10], [40, 0], [30, -10], [20, -18], [15, -27], [12, -18], [9, 0], [-8, 5],
  ],
  [ // Europe
    [-10, 36], [-9, 43], [-2, 48], [0, 50], [5, 53], [8, 57], [10, 59], [18, 56],
    [21, 55], [23, 60], [30, 60], [28, 65], [25, 70], [18, 69], [12, 65], [5, 60], [0, 55], [-5, 50],
  ],
  [ // Asia
    [30, 36], [35, 42], [40, 45], [50, 47], [60, 45], [70, 55], [80, 60], [90, 65],
    [100, 70], [110, 73], [130, 72], [150, 70], [160, 65], [160, 60], [140, 55],
    [135, 45], [127, 40], [122, 32], [115, 25], [108, 18], [105, 10], [100, 8],
    [95, 15], [90, 22], [85, 20], [80, 10], [75, 8], [70, 20], [65, 25], [60, 25],
    [55, 26], [50, 30], [45, 30], [40, 35],
  ],
  [ // Australia
    [113, -22], [114, -30], [120, -34], [130, -32], [140, -38], [147, -39],
    [150, -37], [153, -27], [146, -19], [142, -11], [136, -12], [132, -12],
    [126, -14], [122, -17], [118, -20],
  ],
];

function drawMap(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, OCEAN);
  cv.frame(x, y, w, h, INK, 1);
  const proj = (lon: number, lat: number): [number, number] => [
    Math.round(x + ((lon + 180) / 360) * w),
    Math.round(y + ((84 - lat) / 140) * h),
  ];
  for (const cont of CONTINENTS) cv.poly(cont.map(([lo, la]) => proj(lo, la)), LAND);
  for (const s of STORIES) {
    const [px, py] = proj(s.lon, s.lat);
    const qx = px + (s.dx ?? 0);
    const qy = py + (s.dy ?? 0);
    cv.disc(qx, qy, 7, s.color);
    cv.ring(qx, qy, 7, WHITE);
    const t = String(s.n);
    drawText(cv, t, qx - Math.floor(textW(t, 1) / 2) + 1, qy - 3, 1, WHITE);
  }
}

function drawIndex(cv: Canvas, x: number, y: number, w: number): void {
  const rest = STORIES.slice(12); // stories 13-44
  const colW = Math.floor((w - 8) / 2);
  const rowH = 15;
  rest.forEach((s, i) => {
    const col = i < 16 ? 0 : 1;
    const row = i % 16;
    const ix = x + col * (colW + 8);
    const iy = y + row * rowH;
    const text = s.n + ". " + (IDX[s.n] ?? s.place + " - " + s.head);
    const lines = wrap(text, colW - 4, 1);
    // One line per story: the number in its region colour, then the text.
    const numW = textW(s.n + ". ", 1);
    drawText(cv, s.n + ".", ix, iy, 1, s.color);
    drawText(cv, lines[0].slice(s.n.toString().length + 1).trim(), ix + numW, iy, 1, INK);
  });
}

// One-line index entries for stories 13-44 (number + place + gist).
// Each fits one line of its index column.
export const IDX: Record<number, string> = {
  13: "JUNIN, PERU - QUAKE M6.7 KILLS 1, HURTS 16",
  14: "SERANG - FACTORY FIRE: 3 DEAD, 36 MISSING",
  15: "WELLINGTON - KL RAHUL 136 PUTS INDIA ON TOP",
  16: "CLEVELAND - HARDEN 51, PASSES KOBE IN NBA",
  17: "KYIV - ZELENSKYY BACKS TRILATERAL TALKS",
  18: "DHAKA - TROOPS OUT AS UNREST SPREADS",
  19: "BAYELSA - FUNERAL BOAT TOLL REACHES 24",
  20: "CHANDEL - TOXIC LIQUOR TOLL REACHES 11",
  21: "RIYADH - SAUDI DOWNS 3 HOUTHI MISSILES",
  22: "QINGHAI - QUAKE M5.9 STRIKES AT 10:45 UTC",
  23: "JERUSALEM - EISENKOT INVITES LIKUD TO TALKS",
  24: "GAZA - STRIKE ON FOOD VEHICLE KILLS 3",
  25: "KYIV - BRIDGE STRIKE A 'FAIR RESPONSE'",
  26: "BEIRUT - AOUN DEMANDS ISRAEL PULL OUT",
  27: "BRASILIA - BOLSONARO TAKEN TO INTENSIVE CARE",
  28: "WASHINGTON - FBI REPORTS CRIME DATABASE BREACH",
  29: "HANOI - VIETNAM PASSES SPEED AND LAND LAWS",
  30: "SAVAR - 80 GARMENT FACTORIES SHUT IN PROTEST",
  31: "HORMUZ - PUGH ENDS 15 KM SWIM AMID TANKER WAR",
  32: "MASTUNG - FORCES KILL 15 MILITANTS",
  33: "BEIJING - SINGAPORE PM WONG MEETS LI QIANG",
  34: "ZAGREB - THOUSANDS RALLY OVER WARD DEATH",
  35: "ABUJA - CAF MAKES KISWAHILI 5TH LANGUAGE",
  36: "NIGER STATE - GUNMEN KILL VILLAGE HEAD",
  37: "CORNWALL - SPITTING IMAGE CO-CREATOR DIES, 85",
  38: "BRUSSELS - COSTA FLOATS 3% EU DIGITAL TAX",
  39: "GERMANY - IG METALL CALLS 23,000 OUT MONDAY",
  40: "WASHINGTON - US SANCTIONS 4 IRAN OIL TRUSTEES",
  41: "BEIJING - CHINA HOLDS LOAN RATES, 18TH MONTH",
  42: "OTTAWA - CANADA GIVES C$100M TO NATO FUND",
  43: "AUSTRALIA - BEAT ENGLAND BY 3 WICKETS IN T20",
  44: "TURIN - ALCARAZ BEATS SHELTON, FACES ZVEREV",
};

// -------------------------------------------------------------- main ---
function main(): void {
  const cv = new Canvas(W, H, PAPER);
  cv.frame(8, 8, W - 16, H - 16, INK, 2);

  // Top bar.
  drawText(cv, "THE WORLD IN ONE DAY", MX, 12, 1, INK);
  drawTextC(cv, "DAY 325 OF 2026", 512, 12, 1, RED);
  drawText(cv, "ALL TIMES UTC", W - MX - textW("ALL TIMES UTC", 1), 12, 1, INK);
  rule(cv, 24);

  // Masthead.
  drawTextC(cv, "SATURDAY 21", 512, 32, 6, INK);
  drawTextC(cv, "NOVEMBER 2026", 512, 78, 6, INK);
  rule(cv, 126);
  drawTextC(cv, "44 STORIES - 9 REGIONS - EVERY ONE DATED SATURDAY 21 NOVEMBER 2026", 512, 132, 2, INK);
  rule(cv, 150);
  drawTextC(
    cv,
    "IRAN HITS BAHRAIN BASES - TANKERS STRUCK OFF KHASAB - SPARTA II ABLAZE OFF FINLAND - COP31 IN OVERTIME",
    512, 156, 1, RED,
  );
  rule(cv, 168);

  // Timeline.
  cv.rect(MX, 172, textW("THE DAY IN UTC", 1) + 8, 11, INK);
  drawText(cv, "THE DAY IN UTC", MX + 4, 174, 1, WHITE);
  const tl1 = TIMELINE.slice(0, 5).map(([t, l]) => t + " " + l).join("  |  ");
  const tl2 = TIMELINE.slice(5).map(([t, l]) => t + " " + l).join("  |  ");
  drawTextC(cv, tl1, 512, 174, 1, INK);
  drawTextC(cv, tl2, 512, 184, 1, INK);
  rule(cv, 198);

  // Region strip.
  let rx = MX;
  drawText(cv, "STORIES BY REGION", rx, 204, 1, INK);
  rx += textW("STORIES BY REGION", 1) + 10;
  for (const [name, color, count] of REGION_COUNTS) {
    const label = name + " " + count;
    const lw = textW(label, 1) + 10;
    cv.rect(rx, 202, lw, 13, color);
    drawText(cv, label, rx + 5, 204, 1, WHITE);
    rx += lw + 6;
  }
  rule(cv, 220);

  // Feature row: stories 1, 3, 4.
  const fy = 226;
  const fh = 224;
  feature(cv, STORIES[0], MX, fy, 380, fh);
  feature(cv, STORIES[2], MX + 388, fy, 300, fh);
  feature(cv, STORIES[3], MX + 696, fy, 296, fh);

  // Cards: stories 5-12, two rows of four.
  const cw = 242;
  const ch = 112;
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    card(cv, STORIES[4 + i], MX + col * (cw + 8), 458 + row * (ch + 8), cw, ch);
  }

  // Map + index.
  const my = 690;
  drawText(cv, "WHERE IT HAPPENED", MX, my, 1, INK);
  drawText(cv, "PIN NUMBERS MATCH THE STORIES; COLOUR IS THE REGION", MX, my + 232, 1, GREY);
  drawMap(cv, MX, my + 12, 360, 216);
  drawText(cv, "ALSO ON SATURDAY 21 NOVEMBER 2026 - 32 MORE STORIES", 384, my, 1, INK);
  drawIndex(cv, 384, my + 12, 624);

  // Footer.
  rule(cv, 950);
  cv.rect(MX, 954, textW("DATE CHECK", 1) + 10, 13, RED);
  drawText(cv, "DATE CHECK", MX + 5, 956, 1, WHITE);
  const dcLines = wrap(
    "WELL-KNOWN STORIES LEFT OUT: THEY BELONG TO ANOTHER DAY (UTC). " + DATE_CHECK,
    CW - 8, 1,
  ).slice(0, 3);
  let dy = 972;
  for (const ln of dcLines) {
    drawText(cv, ln, MX + 4, dy, 1, INK);
    dy += 9;
  }
  drawTextC(
    cv,
    "HOW SURE: CONFIRMED = 2+ MAJOR OUTLETS - OFFICIAL = ON THE RECORD - REPORTED = ONE MAJOR OUTLET",
    512, 1004, 1, GREY,
  );

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = path.join(outDir, "entry.png");
  writePng(cv, outPath);
  const size = fs.statSync(outPath).size;
  console.log(
    JSON.stringify({
      stories: STORIES.length,
      regions: REGION_COUNTS.length,
      width: W,
      height: H,
      bytes: size,
      out: outPath,
    }),
  );
}

main();
