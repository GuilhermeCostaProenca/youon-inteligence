// apps/backend/scripts/classificacao/importEnergia.ts

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../../database/prismaClient';
import datasets from '../../../data/datasets.json';
import camposMap from '../../../data/dataset_campos_map.json';

const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

async function importarEnergia() {
  let total = 0;

  for (const ds of datasets) {
    const campos = camposMap[ds.nome];
    if (!campos || !campos.id || !campos.nomeUc) continue;

    const fileName = ds.url.endsWith('.zip') ? `${ds.nome}.zip` : `${ds.nome}.csv`;
    const filePath = path.join(downloadsDir, fileName.replace('.zip', '.csv'));
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Arquivo não encontrado para ${ds.nome}, pulando...`);
      continue;
    }

    const content = fs.readFileSync(filePath);
    const records = parse(content, { columns: true, skip_empty_lines: true });

    for (const row of records) {
      const leadId = row[campos.id];
      if (!leadId) continue;

      const existe = await prisma.leadEnergia.findUnique({ where: { leadId } });
      if (existe) continue;

      try {
        await prisma.leadEnergia.create({
          data: {
            leadId,
            energia01: parseFloat(row['ENE_01']) || undefined,
            energia02: parseFloat(row['ENE_02']) || undefined,
            energia03: parseFloat(row['ENE_03']) || undefined,
            energia04: parseFloat(row['ENE_04']) || undefined,
            energia05: parseFloat(row['ENE_05']) || undefined,
            energia06: parseFloat(row['ENE_06']) || undefined,
            energia07: parseFloat(row['ENE_07']) || undefined,
            energia08: parseFloat(row['ENE_08']) || undefined,
            energia09: parseFloat(row['ENE_09']) || undefined,
            energia10: parseFloat(row['ENE_10']) || undefined,
            energia11: parseFloat(row['ENE_11']) || undefined,
            energia12: parseFloat(row['ENE_12']) || undefined,
            carInst: parseFloat(row['CAR_INST']) || undefined,
          },
        });
        total++;
      } catch (err) {
        console.error(`❌ Erro ao importar energia de ${leadId}:`, err);
      }
    }
  }

  console.log(`✅ Importação de energia finalizada: ${total} registros.`);
  process.exit(0);
}

importarEnergia();
