// apps/backend/scripts/classificacao/importQualidade.ts

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../../database/prisma';
import datasets from '../../datasets.json';
import camposMap from '../../dataset_campos_map.json';

const downloadsDir = path.resolve(__dirname, '../../downloads');

async function importarQualidade() {
  let total = 0;

  for (const ds of datasets) {
    const campos = camposMap[ds.nome];
    if (!campos?.id) continue;

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

      const existe = await prisma.leadQualidade.findUnique({ where: { leadId } });
      if (existe) continue;

      try {
        await prisma.leadQualidade.create({
          data: {
            leadId,
            dic01: parseFloat(row['DIC_01']) || undefined,
            dic02: parseFloat(row['DIC_02']) || undefined,
            dic03: parseFloat(row['DIC_03']) || undefined,
            dic04: parseFloat(row['DIC_04']) || undefined,
            dic05: parseFloat(row['DIC_05']) || undefined,
            dic06: parseFloat(row['DIC_06']) || undefined,
            dic07: parseFloat(row['DIC_07']) || undefined,
            dic08: parseFloat(row['DIC_08']) || undefined,
            dic09: parseFloat(row['DIC_09']) || undefined,
            dic10: parseFloat(row['DIC_10']) || undefined,
            dic11: parseFloat(row['DIC_11']) || undefined,
            dic12: parseFloat(row['DIC_12']) || undefined,
            fic01: parseFloat(row['FIC_01']) || undefined,
            fic02: parseFloat(row['FIC_02']) || undefined,
            fic03: parseFloat(row['FIC_03']) || undefined,
            fic04: parseFloat(row['FIC_04']) || undefined,
            fic05: parseFloat(row['FIC_05']) || undefined,
            fic06: parseFloat(row['FIC_06']) || undefined,
            fic07: parseFloat(row['FIC_07']) || undefined,
            fic08: parseFloat(row['FIC_08']) || undefined,
            fic09: parseFloat(row['FIC_09']) || undefined,
            fic10: parseFloat(row['FIC_10']) || undefined,
            fic11: parseFloat(row['FIC_11']) || undefined,
            fic12: parseFloat(row['FIC_12']) || undefined,
            semRede: row['SEMRED']?.toLowerCase() === 'sim' ? true : false,
          },
        });
        total++;
      } catch (err) {
        console.error(`❌ Erro ao importar qualidade de ${leadId}:`, err);
      }
    }
  }

  console.log(`✅ Importação de qualidade finalizada: ${total} registros.`);
  process.exit(0);
}

importarQualidade();
