import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { prisma } from '../../database/prismaClient';
import crypto from 'crypto';

// === Funções auxiliares ===

function normalizarCoordenadaBDGD(raw: string): number | null {
  if (!raw) return null;
  const semPonto = raw.replace(/\./g, '');
  const decimal = parseFloat(semPonto) / 1_000_000;
  return isNaN(decimal) ? null : decimal;
}

function normalizarCepBDGD(raw: string): string | null {
  if (!raw) return null;
  return raw.replace(/\D/g, '') || null;
}

function parseFloatOrNull(value: string): number | null {
  const parsed = parseFloat(value?.replace(',', '.') || '');
  return isNaN(parsed) ? null : parsed;
}

function parseDataConexao(raw: string | null): Date | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const match = raw.match(/^([0-9]{2})([A-Z]{3})([0-9]{4})$/);
  if (match) {
    const [, dia, mesStr, ano] = match;
    const meses: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
    };
    const mes = meses[mesStr.toUpperCase()];
    const formatada = `${ano}-${mes}-${dia}`;
    const date = new Date(formatada);
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

function gerarIdInterno(id: string, dist: string, nome: string) {
  const base = `${nome?.slice(0, 8)?.replace(/\W/g, '')}_${dist?.slice(0, 5)}_${id?.slice(0, 5)}`;
  return base.toLowerCase() + '_' + crypto.randomUUID().slice(0, 6);
}

async function salvarRelacionadas(id: string, row: any) {
  const parseArray = (prefix: string): number[] =>
    Array.from({ length: 12 }, (_, i) => {
      const raw = row[`${prefix}_${String(i + 1).padStart(2, '0')}`];
      return parseInt((raw || '0').replace(',', '.'), 10) || 0;
    });

  const energia = parseArray('ENE');
  const demanda = parseArray('DEM');
  const dic = parseArray('DIC');
  const fic = parseArray('FIC');

  const promises = [];

  if (energia.some(v => v > 0)) {
    promises.push(prisma.lead_energia.upsert({
      where: { lead_id: id },
      update: { ene: energia, potencia: parseFloatOrNull(row['CAR_INST']) },
      create: { id: crypto.randomUUID(), lead_id: id, ene: energia, potencia: parseFloatOrNull(row['CAR_INST']) },
    }));
  }

  if (demanda.some(v => v > 0)) {
    promises.push(prisma.lead_demanda.upsert({
      where: { lead_id: id },
      update: { dem_ponta: demanda, dem_fora_ponta: [] },
      create: { id: crypto.randomUUID(), lead_id: id, dem_ponta: demanda, dem_fora_ponta: [] },
    }));
  }

  if (dic.some(v => v > 0) || fic.some(v => v > 0)) {
    promises.push(prisma.lead_qualidade.upsert({
      where: { lead_id: id },
      update: { dic, fic },
      create: { id: crypto.randomUUID(), lead_id: id, dic, fic },
    }));
  }

  await Promise.allSettled(promises);
}

// === Dataset e Processamento ===

const camposMapPath = path.resolve(__dirname, '../../../data/dataset_campos_map.json');
const camposMap = JSON.parse(fs.readFileSync(camposMapPath, 'utf-8'));

const datasetsPath = path.resolve(__dirname, '../../../data/datasets.json');
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

async function extrairZip(zipPath: string): Promise<string> {
  const directory = await unzipper.Open.file(zipPath);
  const firstCsv = directory.files.find(file => file.path.endsWith('.csv'));
  if (!firstCsv) throw new Error('Nenhum CSV encontrado no ZIP');

  const extractedPath = path.join(downloadsDir, firstCsv.path);
  if (fs.existsSync(extractedPath)) fs.unlinkSync(extractedPath);

  await new Promise((res, rej) => {
    firstCsv.stream()
      .pipe(fs.createWriteStream(extractedPath))
      .on('finish', () => res(undefined))
      .on('error', rej);
  });

  console.log(`📦 CSV extraído: ${extractedPath}`);
  return extractedPath;
}

async function processarCSV(filePath: string, datasetNome: string, origem: string) {
  console.log(`📊 Processando dataset: ${datasetNome}`);
  const campos = camposMap[datasetNome];
  if (!campos) throw new Error(`❌ Mapeamento de campos ausente para ${datasetNome}`);

  return new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'latin1' })
      .pipe(parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true }));

    stream.on('data', async (row) => {
      stream.pause();
      try {
        const id = row[campos.id];
        if (!id) return;

        const latitude = normalizarCoordenadaBDGD(row[campos.latitude]);
        const longitude = normalizarCoordenadaBDGD(row[campos.longitude]);
        const nomeUc = row[campos.nomeUc] || 'Desconhecido';
        const dist = row[campos.distribuidora] || '';

        const data = {
          id,
          id_interno: gerarIdInterno(id, dist, nomeUc),
          nome_uc: nomeUc,
          classe: row[campos.classe] || '',
          subgrupo: row[campos.subgrupo] || '',
          modalidade: row[campos.modalidade] || '',
          situacao: row[campos.situacao] || '',
          grupo_tensao: row[campos.grupoTensao] || '',
          tipo_sistema: row[campos.tipoSistema] || '',
          origem: datasetNome,
          segmento: origem,
          distribuidora: dist,
          municipio_ibge: row[campos.municipioIbge] || '',
          subestacao: row[campos.subestacao] || '',
          bairro: row[campos.bairro] || '',
          cep: normalizarCepBDGD(row[campos.cep]) || '',
          cnae: row[campos.cnae] || '',
          data_conexao: parseDataConexao(row[campos.dataConexao]),
          coordenadas: latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : undefined,
          descricao: row[campos.descricao] || '',
          status: 'raw',
        };

        try {
          await prisma.lead_bruto.create({ data });
        } catch (error: any) {
          if (error.code === 'P2002') {
            await prisma.lead_bruto.update({ where: { id }, data });
          } else {
            throw error;
          }
        }

        await salvarRelacionadas(id, row);
        stream.resume();
      } catch (err) {
        console.error('❌ Erro ao processar linha:', err);
        reject(err);
      }
    });

    stream.on('end', () => {
      console.log('🏁 Fim do processamento do CSV.');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('❌ Erro no stream:', err);
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  type Dataset = { nome: string; url: string; origem: string };
  const datasets: Dataset[] = JSON.parse(await fs.promises.readFile(datasetsPath, 'utf-8'));
  const datasetAlvo = process.argv[2];
  const alvo = datasets.find(d => d.nome === datasetAlvo);

  if (!alvo) {
    console.error(`❌ Dataset "${datasetAlvo}" não encontrado em datasets.json`);
    process.exit(1);
  }

  try {
    const nomeArquivo = alvo.url.endsWith('.zip') ? `${alvo.nome}.zip` : `${alvo.nome}.csv`;
    const caminhoArquivo = path.join(downloadsDir, nomeArquivo);

    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`❌ Arquivo esperado não encontrado: ${caminhoArquivo}`);
      process.exit(1);
    }

    let csvPath = caminhoArquivo;
    if (caminhoArquivo.endsWith('.zip')) {
      csvPath = await extrairZip(caminhoArquivo);
    }

    await processarCSV(csvPath, alvo.nome, alvo.origem);
    console.log(`✅ Importação de ${alvo.nome} concluída.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Erro ao processar ${alvo?.nome}:`, err);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('❌ Erro geral na importação:', err);
  process.exit(1);
});
