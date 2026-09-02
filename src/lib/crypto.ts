import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Symmetric encryption for secrets we must store and later re-use ourselves
// (IMAP mailbox passwords), as opposed to bcrypt-hashed user passwords which
// we never need back. Key is derived from AUTH_SECRET so no extra env var
// is required to run the app.
const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to encrypt/decrypt stored secrets.");
  return scryptSync(secret, "avero-saas-email-secrets", 32);
}

/** Encrypts a plaintext string, returning "iv:authTag:ciphertext" (all base64). */
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/** Decrypts a string produced by encryptSecret. */
export function decryptSecret(encrypted: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error("Malformed encrypted secret.");
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
