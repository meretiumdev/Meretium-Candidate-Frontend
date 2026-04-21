function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null) return null;
  return input as Record<string, unknown>;
}

function asBoolean(input: unknown): boolean | null {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input === 1;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return null;
}

function readTwoFactorFlag(source: Record<string, unknown>): boolean | null {
  const keys = [
    'is_2fa_enabled',
    'is2faenabled',
    'two_factor_enabled',
    'twoFactorEnabled',
  ];

  for (const key of keys) {
    const value = asBoolean(source[key]);
    if (value !== null) return value;
  }

  return null;
}

export function isTwoFactorEnabled(user: unknown): boolean {
  const root = asRecord(user);
  if (!root) return false;

  const topLevelValue = readTwoFactorFlag(root);
  if (topLevelValue !== null) return topLevelValue;

  const data = asRecord(root.data);
  if (data) {
    const dataValue = readTwoFactorFlag(data);
    if (dataValue !== null) return dataValue;
  }

  const settings = asRecord(root.settings);
  if (settings) {
    const settingsValue = readTwoFactorFlag(settings);
    if (settingsValue !== null) return settingsValue;
  }

  return false;
}
