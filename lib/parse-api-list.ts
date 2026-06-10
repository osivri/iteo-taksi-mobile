/** Nest API yanıtları: data dizisi, data.items veya üst seviye items */
export function parseApiItems<T>(res: unknown): T[] {
  if (!res || typeof res !== 'object') return [];
  const payload = res as { data?: unknown; items?: unknown };

  if (Array.isArray(payload.items)) return payload.items as T[];
  if (Array.isArray(payload.data)) return payload.data as T[];

  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { items?: unknown };
    if (Array.isArray(nested.items)) return nested.items as T[];
  }

  return [];
}
