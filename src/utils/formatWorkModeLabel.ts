export function formatWorkModeLabel(value: string, fallback = ''): string {
  const normalizedKey = value.trim().toLowerCase().replace(/[_-\s]+/g, '');

  if (!normalizedKey) return fallback;
  if (normalizedKey === 'remote') return 'Remote';
  if (normalizedKey === 'hybrid') return 'Hybrid';
  if (normalizedKey === 'onsite') return 'On-site';
  if (normalizedKey === 'workfromanywhere' || normalizedKey === 'any') return 'Work from anywhere';

  const normalized = value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
