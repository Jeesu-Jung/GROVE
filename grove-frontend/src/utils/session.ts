function generateUuidV4(): string {
  // RFC4122 version 4 UUID (browser)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return (
    hex[0] + hex[1] + hex[2] + hex[3] + '-' +
    hex[4] + hex[5] + '-' +
    hex[6] + hex[7] + '-' +
    hex[8] + hex[9] + '-' +
    hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
  );
}

// Keep only in-memory to reset on page reload as required
let cachedId: string | null = null;

export function getOrCreateSessionId(): string {
  if (!cachedId) {
    cachedId = generateUuidV4();
  }
  return cachedId;
}

export function resetSessionId(): string {
  cachedId = generateUuidV4();
  return cachedId;
}


