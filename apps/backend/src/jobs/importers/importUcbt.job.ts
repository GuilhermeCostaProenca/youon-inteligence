import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { prisma } from '@/database/prismaClient';

const filePath = path.resolve(__dirname, '../../../data/downloads/UCBT_tab.csv');
const LOG_DIR = path.resolve(__dirname, '../../../logs');
const BATCH_SIZE = 1000;

export async function importarUCBT() {
  const startTime = Date.now();
  let batch: any[] = [];
  let totalLidas = 0;
  let totalInseridas = 0;
  let totalIgnoradas = 0;
  let totalBatchErro = 0;

  const stream = fs.createReadStream(filePath);
  const parser = parse({ delimiter: ';', columns: true, bom: true });
  const csv = stream.pipe(parser);

  console.log('🚀 Iniciando importação do UCBT...\n');

  for await (const row of csv) {
    totalLidas++;

    const item = mapearParaLeadBruto(row);
    if (item) {
      batch.push(item);
    } else {
      totalIgnoradas++;
    }

    if (batch.length === BATCH_SIZE) {
      stream.pause();
      const inseridas = await inserirBatch(batch);
      if (inseridas) totalInseridas += batch.length;
      else totalBatchErro++;
      batch = [];
      stream.resume();
    }

    if (totalLidas % 100000 === 0) {
      const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      console.log(`🧠 Memória em uso: ${mem} MB`);
    }
  }

  if (batch.length > 0) {
    const inseridas = await inserirBatch(batch);
    if (inseridas) totalInseridas += batch.length;
    else totalBatchErro++;
  }

  const tempoMin = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log('\n🏁 Importação finalizada com sucesso!');
  console.log(`📥 Lidas: ${totalLidas} | ✅ Inseridas: ${totalInseridas} | ❌ Ignoradas: ${totalIgnoradas} | ⚠️ Batches ignorados: ${totalBatchErro}`);
  console.log(`⏱️ Tempo total: ${tempoMin} minutos`);
}

function limparCampos(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== '')
  );
}

function isDataValida(valor: string | undefined): boolean {
  if (!valor) return false;
  const trimmed = valor.trim();
  if (trimmed === '' || trimmed === '00/00/0000') return false;

  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [dia, mes, ano] = parts;
    const iso = `${ano}-${mes}-${dia}`;
    return !isNaN(Date.parse(iso));
  }

  return !isNaN(Date.parse(trimmed));
}

function formatarData(valor: string): string {
  const trimmed = valor.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [dia, mes, ano] = parts;
    return `${ano}-${mes}-${dia}`;
  }
  return trimmed;
}

function mapearParaLeadBruto(row: any): any | null {
  try {
    const id = row['COD_ID_ENCR'];
    const dist = row['DIST'];
    const nome_uc = row['CNAE'] || 'Desconhecido';

    if (!id || !dist) return null;

    const latRaw = row['POINT_Y'];
    const lngRaw = row['POINT_X'];
    const lat = isNaN(parseFloat(latRaw)) ? null : parseFloat(latRaw);
    const lng = isNaN(parseFloat(lngRaw)) ? null : parseFloat(lngRaw);

    return limparCampos({
      id,
      nome_uc,
      classe: row['CLAS_SUB'],
      subgrupo: row['CLAS_SUB'],
      modalidade: row['TIP_CC'],
      grupo_tensao: row['GRU_TAR'],
      distribuidora: dist,
      municipio_ibge: row['MUN'],
      cnae: row['CNAE'],
      data_conexao: isDataValida(row['DAT_CON']) ? new Date(formatarData(row['DAT_CON'])) : null,
      coordenadas: lat !== null && lng !== null ? { lat, lng } : null,
      status: 'raw',
      id_interno: `${row['CLAS_SUB'] || 'X'}_${row['CNAE'] || 'X'}_${row['MUN'] || 'X'}`,
    });
  } catch (error) {
    console.warn('⚠️ Erro ao mapear linha:', error);
    return null;
  }
}

async function inserirBatch(batch: any[]): Promise<boolean> {
  try {
    await prisma.lead_bruto.createMany({
      data: batch,
      skipDuplicates: true,
    });
    return true;
  } catch (err) {
    console.error('❌ Erro ao inserir batch. Batch será ignorado e salvo para análise.');

    if (err instanceof Error) {
      console.error('💥 Mensagem do erro:', err.message);
    } else {
      console.error('💥 Erro desconhecido:', JSON.stringify(err, null, 2));
    }

    try {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
      const filename = `batch_error_${Date.now()}.json`;
      const filepath = path.join(LOG_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(batch, null, 2), 'utf-8');
      console.log(`📝 Batch com erro salvo em: ${filepath}`);
    } catch (logErr) {
      console.error('❌ Falha ao salvar log do batch com erro:', logErr);
    }

    return false;
  }
}

if (require.main === module) {
  importarUCBT()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Erro fatal durante importação:', err);
      process.exit(1);
    });
}
