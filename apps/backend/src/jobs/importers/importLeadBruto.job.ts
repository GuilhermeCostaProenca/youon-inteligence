import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { parse } from 'csv-parse/sync';
import { prisma } from '../../database/prismaClient';
import axios from 'axios';
import crypto from 'crypto';

const camposMapPath = path.resolve(__dirname, '../../../data/dataset_campos_map.json');
const camposMap = JSON.parse(fs.readFileSync(camposMapPath, 'utf-8'));

const datasetsPath = path.resolve(__dirname, '../../../data/datasets.json');
const downloadsDir = path.resolve(__dirname, '../../../data/downloads');

async function baixarArquivo(url: string, nome: string): Promise<string> {
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const filePath = path.join(downloadsDir, nome);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // limpa o arquivo anterior

  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, { responseType: 'stream', timeout: 60000 });

  console.log(`🌐 Iniciando download de: ${url}`);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`✅ Download concluído: ${filePath}`);
      resolve(filePath);
    });
    writer.on('error', err => {
      console.error(`❌ Erro no download de ${nome}:`, err);
      reject(err);
    });
  });
}

async function extrairZip(zipPath: string): Promise<string> {
  const directory = await unzipper.Open.file(zipPath);
  const firstCsv = directory.files.find(file => file.path.endsWith('.csv'));
  if (!firstCsv) throw new Error('Nenhum CSV encontrado no ZIP');

  const extractedPath = path.join(downloadsDir, firstCsv.path);
  if (fs.existsSync(extractedPath)) fs.unlinkSync(extractedPath); // limpa anterior

  await new Promise((res, rej) => {
    firstCsv.stream()
      .pipe(fs.createWriteStream(extractedPath))
      .on('finish', () => res(undefined))
      .on('error', rej);
  });

  console.log(`📦 CSV extraído: ${extractedPath}`);
  return extractedPath;
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

async function processarCSV(filePath: string, datasetNome: string, origem: string) {
  console.log(`📊 Processando dataset: ${datasetNome}`);
  const campos = camposMap[datasetNome];
  if (!campos) throw new Error(`❌ Mapeamento de campos ausente para ${datasetNome}`);

  const content = await fs.promises.readFile(filePath);
  const records: any[] = parse(content, { columns: true, skip_empty_lines: true, bom: true, delimiter: ';' });

  console.log(`🔢 Total de registros lidos: ${records.length}`);

  const total = records.length;
  const batchSize = 500;
  const existingIds = new Set(
    (await prisma.lead_bruto.findMany({
      where: { id: { in: records.map(r => r[campos.id]) } },
      select: { id: true }
    })).map((e: { id: string }) => e.id)

  );

  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);

    const novos: any[] = [];
    const atualizacoes: any[] = [];

    for (const row of chunk) {
      const id = row[campos.id];
      if (!id) continue;

      const latitude = parseFloatOrNull(row[campos.latitude]);
      const longitude = parseFloatOrNull(row[campos.longitude]);
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
        cep: row[campos.cep] || '',
        cnae: row[campos.cnae] || '',
        data_conexao: parseDataConexao(row[campos.dataConexao]),
        coordenadas: latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : undefined,
        descricao: row[campos.descricao] || '',
        status: 'raw',
      };

      if (existingIds.has(id)) {
        atualizacoes.push({ id, data });
      } else {
        novos.push(data);
      }
    }

    if (novos.length) await prisma.lead_bruto.createMany({ data: novos, skipDuplicates: true });

    await Promise.allSettled(
      atualizacoes.map(item =>
        prisma.lead_bruto.update({ where: { id: item.id }, data: item.data })
      )
    );

    await Promise.allSettled(chunk.map(row => salvarRelacionadas(row[campos.id], row)));

    const progresso = Math.round(((i + batchSize) / total) * 100);
    console.log(`✔️ ${Math.min(i + batchSize, total)} / ${total} (${progresso}%) processados...`);
  }
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

    // ⛔️ Fluxo automático de download foi desativado
    /*
    console.log(`⬇️ Baixando ${alvo.nome}...`);
    const arquivoBaixado = await baixarArquivo(alvo.url, nomeArquivo);
    let csvPath = arquivoBaixado;
    if (arquivoBaixado.endsWith('.zip')) {
      csvPath = await extrairZip(arquivoBaixado);
    }
    */

    // ✅ Novo fluxo manual — lê arquivos já presentes localmente
    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`❌ Arquivo esperado não encontrado: ${caminhoArquivo}`);
      process.exit(1);
    }

    let csvPath = caminhoArquivo;
    if (caminhoArquivo.endsWith('.zip')) {
      csvPath = await extrairZip(caminhoArquivo);
    }

    await processarCSV(csvPath, alvo.nome, alvo.origem);

    console.log(`🏁 Importação de ${alvo.nome} concluída.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Erro ao processar ${alvo.nome}:`, err);
    process.exit(1);
  }
}


main().catch(err => {
  console.error('❌ Erro geral na importação:', err);
  process.exit(1);
});
