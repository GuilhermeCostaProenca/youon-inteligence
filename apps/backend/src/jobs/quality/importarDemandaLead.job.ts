import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { prisma } from '@/database/prismaClient';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

const arquivos = ['UCAT_tab', 'UCMT_tab', 'UCBT_tab'];
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

type RegistroDemanda = {
  id: string;
  dem_ponta: number[];
  dem_fora_ponta: number[];
};

function extrairDemandas(row: any): { ponta: number[], fora: number[] } {
  const ponta: number[] = [];
  const fora: number[] = [];

  for (let i = 1; i <= 12; i++) {
    const demP = parseInt(row[`DMAP_${i.toString().padStart(2, '0')}`]) || 0;
    const demFP = parseInt(row[`DMFP_${i.toString().padStart(2, '0')}`]) || 0;
    ponta.push(demP);
    fora.push(demFP);
  }

  return { ponta, fora };
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

        const { ponta, fora } = extrairDemandas(row);

        await prisma.lead_demanda.upsert({
          where: { lead_id: lead.id },
          update: {
            dem_ponta: ponta,
            dem_fora_ponta: fora,
          },
          create: {
            id: crypto.randomUUID(),
            lead_id: lead.id,
            dem_ponta: ponta,
            dem_fora_ponta: fora,
          },
        });

        inseridos.push(1);
        total++;
        if (total % 1000 === 0) {
          console.log(`📦 ${total} registros de demanda processados do ${nome}`);
        }
      }
    }
  );

  console.log(`✅ Finalizado ${nome}: ${total} registros de demanda`);
}

export async function importarDemanda() {
  console.log('🚀 Iniciando job: importarDemanda');

  const inseridos: number[] = [];
  for (const nome of arquivos) {
    await processarArquivo(nome, inseridos);
  }

  console.log(`🏁 Job importarDemanda finalizado. Total processado: ${inseridos.length}`);
}
