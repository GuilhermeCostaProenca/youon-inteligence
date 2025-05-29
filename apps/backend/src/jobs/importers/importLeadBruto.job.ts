import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import unzipper from 'unzipper';
import 
{ prisma } from '../../database/prismaClient';
import { salvarRelacionadas } from '../../services/relacionadas';
import {
  normalizarCepBDGD, normalizarCoordenadaBDGD,
  parseDataConexao, gerarIdInterno
} from '../../utils/normalizers';

type Dataset = {
  nome: string;
  url: string;
  origem: string;
};

const camposMapPath = path.resolve(__dirname, '../../../data/dataset_campos_map.json');
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

  console.log('📦 CSV extraído:', extractedPath);
  return extractedPath;
}

async function processarCSV(filePath: string, datasetNome: string, origem: string) {
  const campos = JSON.parse(fs.readFileSync(camposMapPath, 'utf-8'))[datasetNome];
  if (!campos) throw new Error(`Mapeamento de campos ausente para ${datasetNome}`);

  const stream = createReadStream(filePath, { encoding: 'latin1' })
    .pipe(parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true }));

  const batchSize = 500;
  let linha = 0;
  let buffer: { data: any, row: any }[] = [];

  async function flushBuffer() {
    await Promise.all(buffer.map(async ({ data, row }) => {
      try {
        await prisma.lead_bruto.upsert({ where: { id: data.id }, update: data, create: data });
        await salvarRelacionadas(data.id, row);
      } catch (err) {
        console.error(`Erro no ID ${data.id}:`, err);
      }
    }));
    buffer = [];
  }

  for await (const row of stream) {
    linha++;
    if (linha % 500 === 0) console.log(`📈 Processando linha ${linha}...`);

    const id = row[campos.id];
    if (!id) continue;

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
      status: 'raw'
    };

    buffer.push({ data, row });
    if (buffer.length >= batchSize) await flushBuffer();
  }

  if (buffer.length > 0) await flushBuffer();
}

async function main() {
  const datasets: Dataset[] = JSON.parse(fs.readFileSync(datasetsPath, 'utf-8'));
  const datasetAlvo = process.argv[2];
  const alvo = datasets.find(d => d.nome === datasetAlvo);

  if (!alvo) {
    console.error(`❌ Dataset "${datasetAlvo}" não encontrado.`);
    process.exit(1);
  }

  const nomeArquivo = alvo.url.endsWith('.zip') ? `${alvo.nome}.zip` : `${alvo.nome}.csv`;
  const caminhoArquivo = path.join(downloadsDir, nomeArquivo);

  if (!fs.existsSync(caminhoArquivo)) {
    console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    process.exit(1);
  }

  try {
    const csvPath = caminhoArquivo.endsWith('.zip') ? await extrairZip(caminhoArquivo) : caminhoArquivo;
    await processarCSV(csvPath, alvo.nome, alvo.origem);
    console.log(`✅ Importação de ${alvo.nome} concluída.`);
  } catch (err) {
    console.error(`❌ Erro ao processar ${alvo?.nome}:`, err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Erro geral na importação:', err);
  process.exit(1);
});
