/**
 * Parse a JSON string that may contain either a single operation object (legacy)
 * or an array of operation objects (new format).
 * Always returns an array.
 */
export function parseOps(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr || '[]');
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      return [{ ...parsed, id: parsed.id || 'legacy_' + Date.now() }];
    }
  } catch {}
  return [];
}