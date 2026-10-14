/**
 * 🛡️ Enterprise Payload Security & Decryption Helper
 * Automatically decrypts AES-256-GCM response envelopes delivered from backend.
 * Protects DevTools Network tab from exposing raw database payloads.
 */

const PAYLOAD_SECRET =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PAYLOAD_ENCRYPTION_SECRET) ||
  'super_hotel_jwt_secret_key_2026_modern_secure';

function base64ToUint8Array(b64) {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

let cachedSubtleKey = null;

async function getDecryptionKey() {
  if (cachedSubtleKey) return cachedSubtleKey;
  const cryptoObj = globalThis.crypto || (typeof window !== 'undefined' && window.crypto);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not supported in this runtime environment.');
  }

  const encSecret = new TextEncoder().encode(PAYLOAD_SECRET);
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', encSecret);
  cachedSubtleKey = await cryptoObj.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  return cachedSubtleKey;
}

/**
 * Decrypts an AES-256-GCM envelope in format: iv:tag:ciphertext (base64)
 * @param {string} envelope 
 * @returns {Promise<any>} Parsed JSON or plain string
 */
export async function decryptPayloadEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'string') return envelope;

  const parts = envelope.split(':');
  if (parts.length !== 3) {
    return envelope; // Not an encrypted envelope, return as-is
  }

  try {
    const cryptoObj = globalThis.crypto || (typeof window !== 'undefined' && window.crypto);
    const key = await getDecryptionKey();

    const ivArr = base64ToUint8Array(parts[0]);
    const tagArr = base64ToUint8Array(parts[1]);
    const dataArr = base64ToUint8Array(parts[2]);

    // WebCrypto AES-GCM expects the authentication tag appended to ciphertext
    const combinedCipherAndTag = new Uint8Array(dataArr.length + tagArr.length);
    combinedCipherAndTag.set(dataArr, 0);
    combinedCipherAndTag.set(tagArr, dataArr.length);

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArr },
      key,
      combinedCipherAndTag
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (error) {
    console.error('❌ Failed to decrypt secure API payload:', error);
    throw error;
  }
}
