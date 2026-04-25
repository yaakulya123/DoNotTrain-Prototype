import type { Hex } from "viem";
import { toHex } from "./hash";

/**
 * Browser-native perceptual hash (pHash).
 *
 * Pipeline:
 *   1. Decode image to a 32×32 grayscale buffer (canvas, high-quality smoothing).
 *   2. Apply a 3×3 Gaussian blur — kills high-frequency noise so screenshots
 *      with sharp annotations (red lines, watermarks) don't wreck the hash.
 *   3. Run a 2D Discrete Cosine Transform.
 *   4. Take the top-left 8×8 low-frequency block (skip DC at [0,0]).
 *   5. Compute the median, output a 64-bit hash where each bit is 1 iff
 *      its coefficient > median.
 *
 * Output: 8 bytes, fits Solidity bytes8.
 */
export const PHASH_ZERO = "0x0000000000000000" as Hex;

const SIZE = 32;
const HASH_SIZE = 8;

export async function phashOfImage(file: File): Promise<Hex> {
  const bitmap = await createImageBitmap(file);
  try {
    let grayscale = drawAndGetGrayscale(bitmap, SIZE);
    grayscale = gaussianBlur3x3(grayscale, SIZE);
    const dct = dct2d(grayscale, SIZE);
    return hashFromDct(dct, SIZE);
  } finally {
    bitmap.close();
  }
}

function drawAndGetGrayscale(bitmap: ImageBitmap, size: number): Float64Array {
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(size, size)
      : Object.assign(document.createElement("canvas"), { width: size, height: size });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  // High-quality scaling for stable hashes across resolutions
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const out = new Float64Array(size * size);
  // Luminance: 0.299 R + 0.587 G + 0.114 B (Rec. 601)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/**
 * 3×3 Gaussian blur (separable). Smooths sharp edits (drawn lines, watermarks)
 * so they don't disproportionately affect the DCT.
 *
 * Kernel weights:  1 2 1     normalized to /16 in 2D, /4 per axis.
 *                  2 4 2
 *                  1 2 1
 */
function gaussianBlur3x3(input: Float64Array, n: number): Float64Array {
  const tmp = new Float64Array(n * n);
  const out = new Float64Array(n * n);
  // Horizontal pass: [1, 2, 1] / 4
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(n - 1, x + 1);
      tmp[y * n + x] = (input[y * n + xm] + 2 * input[y * n + x] + input[y * n + xp]) / 4;
    }
  }
  // Vertical pass: [1, 2, 1] / 4
  for (let y = 0; y < n; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(n - 1, y + 1);
    for (let x = 0; x < n; x++) {
      out[y * n + x] = (tmp[ym * n + x] + 2 * tmp[y * n + x] + tmp[yp * n + x]) / 4;
    }
  }
  return out;
}

/** Naive 2D DCT-II — n=32 → ~1M ops, well under 50ms in any browser. */
function dct2d(input: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n);
  const cosTable = buildCosTable(n);
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      let sum = 0;
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          sum += input[x * n + y] * cosTable[u * n + x] * cosTable[v * n + y];
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      out[u * n + v] = (cu * cv * sum) / 4;
    }
  }
  return out;
}

function buildCosTable(n: number): Float64Array {
  const t = new Float64Array(n * n);
  for (let k = 0; k < n; k++) {
    for (let x = 0; x < n; x++) {
      t[k * n + x] = Math.cos(((2 * x + 1) * k * Math.PI) / (2 * n));
    }
  }
  return t;
}

function hashFromDct(dct: Float64Array, n: number): Hex {
  const block: number[] = [];
  for (let u = 0; u < HASH_SIZE; u++) {
    for (let v = 0; v < HASH_SIZE; v++) {
      if (u === 0 && v === 0) continue;
      block.push(dct[u * n + v]);
    }
  }
  const sorted = [...block].sort((a, b) => a - b);
  const median = (sorted[Math.floor(sorted.length / 2) - 1] + sorted[Math.floor(sorted.length / 2)]) / 2;

  const bits: number[] = [];
  let blockIdx = 0;
  for (let u = 0; u < HASH_SIZE; u++) {
    for (let v = 0; v < HASH_SIZE; v++) {
      if (u === 0 && v === 0) {
        bits.push(0);
      } else {
        bits.push(block[blockIdx++] > median ? 1 : 0);
      }
    }
  }

  const bytes = new Uint8Array(HASH_SIZE);
  for (let i = 0; i < HASH_SIZE; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    bytes[i] = b;
  }
  return toHex(bytes);
}

/** Hamming distance between two 0x-prefixed 8-byte hex strings. Used client-side. */
export function hamming(a: Hex, b: Hex): number {
  const ah = a.replace(/^0x/, "");
  const bh = b.replace(/^0x/, "");
  let d = 0;
  for (let i = 0; i < 8; i++) {
    let x = parseInt(ah.slice(i * 2, i * 2 + 2), 16) ^ parseInt(bh.slice(i * 2, i * 2 + 2), 16);
    while (x) {
      x &= x - 1;
      d++;
    }
  }
  return d;
}
