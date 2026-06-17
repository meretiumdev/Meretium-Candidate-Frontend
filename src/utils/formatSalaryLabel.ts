interface FormatSalaryLabelOptions {
  emptyLabel?: string;
  maxOnlyPrefix?: string;
  minOnlySuffix?: string;
  salaryPeriod?: string | null;
}

export function formatCurrencyAmount(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

function formatSalaryPeriodLabel(salaryPeriod: string | null | undefined): string {
  const normalized = typeof salaryPeriod === 'string' ? salaryPeriod.trim() : '';
  if (!normalized) return '';

  return normalized
    .split(/[\s_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function formatSalaryLabel(
  minSalary: number | null,
  maxSalary: number | null,
  currencyCode: string,
  options: FormatSalaryLabelOptions = {}
): string {
  const {
    emptyLabel = 'Competitive salary',
    maxOnlyPrefix = 'Up to ',
    minOnlySuffix = '+',
    salaryPeriod = null,
  } = options;

  let baseLabel = '';

  if (minSalary !== null && maxSalary !== null) {
    baseLabel = `${formatCurrencyAmount(minSalary, currencyCode)} - ${formatCurrencyAmount(maxSalary, currencyCode)}`;
  } else if (minSalary !== null) {
    baseLabel = `${formatCurrencyAmount(minSalary, currencyCode)}${minOnlySuffix}`;
  } else if (maxSalary !== null) {
    baseLabel = `${maxOnlyPrefix}${formatCurrencyAmount(maxSalary, currencyCode)}`;
  } else {
    baseLabel = emptyLabel;
  }

  if (!baseLabel) return '';

  const periodLabel = formatSalaryPeriodLabel(salaryPeriod);
  return periodLabel ? `${baseLabel} /${periodLabel}` : baseLabel;
}
