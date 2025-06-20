export function normalizarCoordenadaBDGD(raw: string | number | null | undefined): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;

  const semPonto = raw.replace(/\./g, '');
  const decimal = parseFloat(semPonto) / 1_000_000;
  return isNaN(decimal) ? null : decimal;
}

export function normalizarCepBDGD(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.replace(/\D/g, '') || null;
}

export function parseFloatOrNull(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const num = parseFloat(raw.replace(',', '.'));
  return isNaN(num) ? null : num;
}
