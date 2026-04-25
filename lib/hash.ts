import type { Hex } from "viem";

/**
 * SHA-256 of a File using the browser-native Web Crypto API.
 * Returns a 0x-prefixed 64-hex-char string suitable for Solidity bytes32.
 *
 * The file is read into an ArrayBuffer in-memory only — nothing is uploaded.
 */
export async function sha256OfFile(file: File): Promise<Hex> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return toHex(new Uint8Array(hashBuffer));
}

export function toHex(bytes: Uint8Array): Hex {
  let out = "0x";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out as Hex;
}

export function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

export function shortHex(hex: string, leading = 6, trailing = 4): string {
  if (hex.length <= leading + trailing + 2) return hex;
  return `${hex.slice(0, 2 + leading)}…${hex.slice(-trailing)}`;
}
