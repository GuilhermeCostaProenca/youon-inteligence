export function normalizarCoordenadaBDGD(raw: string): number | null {
  if (!raw) return null;
  const semPonto = raw.replace(/\./g, '');
  const decimal = parseFloat(semPonto) / 1_000_000;
  return isNaN(decimal) ? null : decimal;
}

export function normalizarCepBDGD(raw: string): string | null {
  if (!raw) return null;
  return raw.replace(/\D/g, '') || null;
}
