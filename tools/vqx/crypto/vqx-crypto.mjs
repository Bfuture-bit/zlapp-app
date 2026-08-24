/** Optional VQX envelopes. Encoding is not encryption. */
import { createHmac, createCipheriv, createDecipheriv, randomBytes, createHash, generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from "node:crypto";

export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

export function hmacSha256(key, buf) {
  return createHmac("sha256", key).update(buf).digest();
}

export function encryptAes256Gcm(key, plaintext, aad = Buffer.alloc(0)) {
  if (key.length !== 32) throw new Error("AES-256-GCM key must be 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  if (aad.length) cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, ciphertext: ct, tag };
}

export function decryptAes256Gcm(key, iv, ciphertext, tag, aad = Buffer.alloc(0)) {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  if (aad.length) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function generateEd25519() {
  return generateKeyPairSync("ed25519");
}

export function signEd25519(privateKey, data) {
  return nodeSign(null, data, privateKey);
}

export function verifyEd25519(publicKey, data, signature) {
  return nodeVerify(null, data, publicKey, signature);
}
