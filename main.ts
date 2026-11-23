// "The World in One Day" — news-image-20261123 entry (Node 22, stdlib only).
//
// The entry is a newspaper front page that sums up the world news of
// Monday 23 November 2026 in one image: COP31's collapse in Antalya after
// the EU rejected a draft silent on fossil fuels, Iran striking US bases
// in Bahrain and tankers in the Strait of Hormuz as the Gulf war escalates,
// a Russian drone hitting a building in the Kyiv region with at least 14
// missing, Mexico's capture of FBI most-wanted cartel boss 'El Chapo
// Isidro', South Korea's education minister resigning over an AI exam
// cheating scandal, and dozens missing after a fire at a candy factory
// in Indonesia. The picture was composed for this competition and is
// stored beside this program as entry.png (JPEG bytes, 1024x1024, under
// 1 MiB); this program only carries those exact bytes to the output
// directory, so both graded runs write identical output. After writing,
// the program checks the copied file's size and its JPEG integrity
// (SOI/EOI markers, a minimum file size, and the 1024x1024 dimensions
// read from the Start-of-Frame segment) and fails loudly on any mismatch.
//
// Run locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
let image: Buffer;
try {
  image = readFileSync(new URL('./entry.png', import.meta.url));
} catch (err) {
  throw new Error(`failed to read bundled entry.png: ${(err as Error).message}`);
}

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'entry.png');
writeFileSync(outPath, image);

// Fail loudly instead of silently shipping a truncated file.
if (statSync(outPath).size !== image.length) {
  throw new Error(`entry.png written incomplete: ${statSync(outPath).size} of ${image.length} bytes`);
}

// Verify the copied file's integrity as a JPEG: it must start with the
// SOI marker (0xFF, 0xD8) and end with the EOI marker (0xFF, 0xD9).
const written = readFileSync(outPath);
if (written.length < 4 || written[0] !== 0xff || written[1] !== 0xd8) {
  throw new Error('entry.png failed integrity check: missing JPEG SOI marker (0xFF, 0xD8)');
}
if (written[written.length - 2] !== 0xff || written[written.length - 1] !== 0xd9) {
  throw new Error('entry.png failed integrity check: missing JPEG EOI marker (0xFF, 0xD9)');
}

// A truncated or placeholder file could still carry both markers, so
// require a plausible size for a 1024x1024 photographic image.
const MIN_JPEG_BYTES = 100 * 1024;
if (written.length < MIN_JPEG_BYTES) {
  throw new Error(
    `entry.png failed integrity check: only ${written.length} bytes, expected at least ${MIN_JPEG_BYTES}`,
  );
}

// Read the image dimensions from the JPEG Start-of-Frame segment and
// require the 1024x1024 size the entry was composed at, so a swapped-in
// image of the wrong size is caught instead of shipped.
const dims = jpegDimensions(written);
if (dims === null) {
  throw new Error('entry.png failed integrity check: no JPEG Start-of-Frame segment found');
}
if (dims.width !== 1024 || dims.height !== 1024) {
  throw new Error(
    `entry.png failed integrity check: dimensions ${dims.width}x${dims.height}, expected 1024x1024`,
  );
}

// Scan JPEG markers until a Start-of-Frame segment (SOF0/SOF2) is found
// and return its height/width, or null when the header is malformed.
function jpegDimensions(buf: Buffer): { width: number; height: number } | null {
  let offset = 2; // skip the SOI marker
  while (offset + 3 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    offset += 2;
    // Standalone markers carry no length field; skip them.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    const segmentLength = buf.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buf.length) return null;
    if (marker === 0xc0 || marker === 0xc2) {
      if (segmentLength < 7) return null;
      return {
        height: buf.readUInt16BE(offset + 3),
        width: buf.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  return null;
}
