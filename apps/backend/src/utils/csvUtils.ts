export function toFloat(value: string | undefined): number | undefined {
  const parsed = parseFloat(value || '');
  return isNaN(parsed) ? undefined : parsed;
}

export function toDate(value: string | undefined): Date | undefined {
  const date = new Date(value || '');
  return isNaN(date.getTime()) ? undefined : date;
}
