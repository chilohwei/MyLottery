/**
 * Lightweight nanoid for generating short URL-safe slugs.
 * No external dependency needed.
 */
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(size = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = "";
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}
