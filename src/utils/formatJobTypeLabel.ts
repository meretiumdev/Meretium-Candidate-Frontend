export function formatJobTypeLabel(value: string, fallback = 'Full time'): string {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!normalized) return fallback;

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
