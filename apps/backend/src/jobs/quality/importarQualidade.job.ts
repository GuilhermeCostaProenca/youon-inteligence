import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { prisma } from '@/database/prismaClient';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

const arquivos = ['UCAT_tab', 'UCMT_tab', 'UCBT_tab'];
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

function extrairQualidade(row: any): {
  dic: number[],
  fic: number[],
  dec: number,
  fec: number,
  tensao_ok: number
} {
  const dic: number[] = [];
  const fic: number[] = [];

  for (let i = 1; i <= 12; i++) {
    dic.push(parseInt(row[`DIC_${i.toString().padStart(2, '0')}`]) || 0);
    fic.push(parseInt(row[`FIC_${i.toString().padStart(2, '0')}`]) || 0);
  }

  const dec = parseFloat(row['DEC']) || 0;
  const fec = parseFloat(row['FEC']) || 0;
  const tensao_ok = parseFloat(row['TENS_OK']) || 0;

  return { dic, fic, dec, fec, tensao_ok };
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

        const { dic, fic, dec, fec, tensao_ok } = extrairQualidade(row);

        await prisma.lead_qualidade.upsert({
          where: { lead_id: lead.id },
          update: {
            dic,
            fic,
            dec,
            fec,
            tensao_ok,
          },
          create: {
            id: crypto.randomUUID(),
            lead_id: lead.id,
            dic,
            fic,
            dec,
            fec,
            tensao_ok,
          },
        });

        inseridos.push(1);
        total++;
        if (total % 1000 === 0) {
          console.log(`📊 ${total} indicadores de qualidade processados do ${nome}`);
        }
      }
    }
  );

  console.log(`✅ Finalizado ${nome}: ${total} registros de qualidade`);
}

export async function importarQualidade() {
  console.log('🚀 Iniciando job: importarQualidade');

  const inseridos: number[] = [];
  for (const nome of arquivos) {
    await processarArquivo(nome, inseridos);
  }

  console.log(`🏁 Job importarQualidade finalizado. Total processado: ${inseridos.length}`);
}
