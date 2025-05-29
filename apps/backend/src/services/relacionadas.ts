import { prisma } from '../database/prismaClient';
import { parseFloatOrNull } from '../utils/normalizers';
import crypto from 'crypto';

export async function salvarRelacionadas(id: string, row: any) {
  const parseArray = (prefix: string): number[] =>
    Array.from({ length: 12 }, (_, i) => {
      const raw = row[`${prefix}_${String(i + 1).padStart(2, '0')}`];
      return parseInt((raw || '0').replace(',', '.'), 10) || 0;
    });

  const energia = parseArray('ENE');
  const demanda = parseArray('DEM');
  const dic = parseArray('DIC');
  const fic = parseArray('FIC');

  try {
    const promises = [];

    if (energia.some(v => v > 0)) {
      promises.push(
        prisma.lead_energia.upsert({
          where: { lead_id: id },
          update: { ene: energia, potencia: parseFloatOrNull(row['CAR_INST']) },
          create: { id: crypto.randomUUID(), lead_id: id, ene: energia, potencia: parseFloatOrNull(row['CAR_INST']) }
        })
      );
    }

    if (demanda.some(v => v > 0)) {
      promises.push(
        prisma.lead_demanda.upsert({
          where: { lead_id: id },
          update: { dem_ponta: demanda, dem_fora_ponta: [] },
          create: { id: crypto.randomUUID(), lead_id: id, dem_ponta: demanda, dem_fora_ponta: [] }
        })
      );
    }

    if (dic.some(v => v > 0) || fic.some(v => v > 0)) {
      promises.push(
        prisma.lead_qualidade.upsert({
          where: { lead_id: id },
          update: { dic, fic },
          create: { id: crypto.randomUUID(), lead_id: id, dic, fic }
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao salvar relacionadas:', error);
  }
}
