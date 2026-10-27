export function createIdempotencyStore() {
  const processed = new Map();
  return {
    has(key) { return processed.has(key); },
    get(key) { return processed.get(key); },
    record(key, result) {
      if (!key) throw new Error("Idempotency key is required");
      if (processed.has(key)) return { duplicate: true, result: processed.get(key) };
      processed.set(key, structuredClone(result));
      return { duplicate: false, result };
    },
  };
}
