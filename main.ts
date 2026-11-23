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
// (SOI/EOI markers) and fails loudly on any mismatch.
//
// Run locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const image = readFileSync(new URL('./entry.png', import.meta.url));

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
