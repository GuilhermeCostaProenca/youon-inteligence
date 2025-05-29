import crypto from 'crypto';

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

export function parseFloatOrNull(value: string): number | null {
  const parsed = parseFloat(value?.replace(',', '.') || '');
  return isNaN(parsed) ? null : parsed;
}

export function parseDataConexao(raw: string | null): Date | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const match = raw.match(/^([0-9]{2})([A-Z]{3})([0-9]{4})$/);
  if (match) {
    const [, dia, mesStr, ano] = match;
    const meses: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const mes = meses[mesStr.toUpperCase()];
    const date = new Date(`${ano}-${mes}-${dia}`);
    return isNaN(date.getTime()) ? undefined : date;
  }
  if (raw.includes('/')) {
    const [dia, mes, ano] = raw.split('/');
    const date = new Date(`${ano}-${mes}-${dia}`);
    return isNaN(date.getTime()) ? undefined : date;
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function gerarIdInterno(id: string, dist: string, nome: string) {
  const base = `${nome?.slice(0, 8)?.replace(/\W/g, '')}_${dist?.slice(0, 5)}_${id?.slice(0, 5)}`;
  return base.toLowerCase() + '_' + crypto.randomUUID().slice(0, 6);
}
