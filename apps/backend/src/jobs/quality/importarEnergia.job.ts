import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { prisma } from '@/database/prismaClient';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

const arquivos = ['UCAT_tab', 'UCMT_tab', 'UCBT_tab'];
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

function extrairEnergia(row: any): { energia: number[], potencia: number } {
  const energia: number[] = [];

  for (let i = 1; i <= 12; i++) {
    const val = parseInt(row[`ENE_${i.toString().padStart(2, '0')}`]) || 0;
    energia.push(val);
  }

  const potencia = parseFloat(row['CAR_INST']) || 0;
  return { energia, potencia };
}

async function processarArquivo(nome: string, inseridos: number[]) {
  const filePath = path.join(downloadsDir, `${nome}.csv`);
  let total = 0;

  await pipeline(
    fs.createReadStream(filePath),
    parse({ delimiter: ';', columns: true, bom: true }),
    async function* (source) {
      for await (const row of source) {
        const leadId = row['COD_ID_ENCR'];
        if (!leadId) continue;

        const lead = await prisma.lead_bruto.findUnique({ where: { id: leadId } });
        if (!lead) continue;

        const { energia, potencia } = extrairEnergia(row);

        await prisma.lead_energia.upsert({
          where: { lead_id: lead.id },
          update: {
            ene: energia,
            potencia: potencia,
          },
          create: {
            id: crypto.randomUUID(),
            lead_id: lead.id,
            ene: energia,
            potencia: potencia,
          },
        });

        inseridos.push(1);
        total++;
        if (total % 1000 === 0) {
          console.log(`⚡ ${total} registros de energia processados do ${nome}`);
        }
      }
    }
  );

  console.log(`✅ Finalizado ${nome}: ${total} registros de energia`);
}

export async function importarEnergia() {
  console.log('🚀 Iniciando job: importarEnergia');

  const inseridos: number[] = [];
  for (const nome of arquivos) {
    await processarArquivo(nome, inseridos);
  }

  console.log(`🏁 Job importarEnergia finalizado. Total processado: ${inseridos.length}`);
}
