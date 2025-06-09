import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { parse } from 'csv-parse';
import { prisma } from '@/database/prismaClient';
import { pipeline } from 'stream/promises';

const DATASET_KEY = 'UCAT_tab';
const BATCH_SIZE = 1000;
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');
const datasetsPath = path.resolve(__dirname, '../../../data/datasets.json');
const camposMapPath = path.resolve(__dirname, '../../../data/dataset_campos_map.json');

async function baixarArquivo(url: string, nome: string): Promise<string> {
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const filePath = path.join(downloadsDir, nome);
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

function mapearLinha(row: Record<string, any>, camposMap: any): any {
  const mapped: any = {};
  try {
    for (const [dest, origem] of Object.entries(camposMap)) {
      const val = row[origem as string];
      if (dest === 'dataConexao' && val) mapped[dest] = new Date(val);
      else if ((dest === 'latitude' || dest === 'longitude') && val) mapped[dest] = parseFloat(val);
      else mapped[dest] = val ?? null;
    }

    mapped.coordenadas = {
      lat: mapped.latitude,
      lng: mapped.longitude,
    };

    mapped.id_interno = `${mapped.distribuidora}_${mapped.municipioIbge}_${mapped.id}`;
    mapped.status = 'raw';

    return mapped;
  } catch (err) {
    console.error('❌ Erro ao mapear linha:', err);
    return null;
  }
}


async function inserirOuAtualizar(batch: any[]) {
  const ids = batch.map((item) => item.id);
  const existentes = await prisma.lead_bruto.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const existentesSet = new Set(existentes.map((e) => e.id));

  const inserts = batch.filter((item) => !existentesSet.has(item.id));
  const updates = batch.filter((item) => existentesSet.has(item.id));

  await prisma.$transaction([
    ...inserts.map((item) => prisma.lead_bruto.create({ data: item })),
    ...updates.map((item) =>
      prisma.lead_bruto.update({
        where: { id: item.id },
        data: item,
      })
    ),
  ]);
}

export async function importarUCAT() {
  const startTime = Date.now();
  console.log('🚀 Iniciando importação do UCAT...');

  const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf-8'));
  const camposMap = JSON.parse(fs.readFileSync(camposMapPath, 'utf-8'))[DATASET_KEY];
  const dataset = datasets.find((d: any) => d.nome === DATASET_KEY);
  if (!dataset) throw new Error(`Dataset ${DATASET_KEY} não encontrado.`);

  const nomeArquivo = dataset.url.split('/').pop()!;
  const caminhoArquivo = await baixarArquivo(dataset.url, nomeArquivo);

  const batch: any[] = [];
  let totalLidas = 0;
  let totalProcessadas = 0;

  await pipeline(
    fs.createReadStream(caminhoArquivo),
    parse({ delimiter: ';', columns: true, bom: true }),
    async function* (source) {
      for await (const row of source) {
        totalLidas++;
        const item = mapearLinha(row, camposMap);
        if (item) batch.push(item);
        if (batch.length >= BATCH_SIZE) {
          await inserirOuAtualizar(batch);
          totalProcessadas += batch.length;
          console.log(`📦 ${totalProcessadas} / ${totalLidas} processadas`);
          batch.length = 0;
        }
      }
      if (batch.length) {
        await inserirOuAtualizar(batch);
        totalProcessadas += batch.length;
      }
    }
  );

  const tempo = ((Date.now() - startTime) / 60000).toFixed(2);
  console.log(`✅ UCAT finalizado: ${totalProcessadas} registros processados em ${tempo} min`);

  const { importarUCMT } = await import('./importUcmtCascade.job.js');
  await importarUCMT();
}
