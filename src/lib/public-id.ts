import { randomBytes } from "node:crypto";

/**
 * The 24-character id in `/r/{publicId}`. It is the only thing standing between
 * a stranger and someone's answers about sex, death and money, so it is 24
 * characters of crypto-random base32 (~120 bits), not a cuid or a counter.
 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // no l/1/0/o
export const PUBLIC_ID_LENGTH = 24;

export function newPublicId(): string {
  const bytes = randomBytes(PUBLIC_ID_LENGTH);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const isPublicId = (s: string) =>
  s.length === PUBLIC_ID_LENGTH && [...s].every((c) => ALPHABET.includes(c));
