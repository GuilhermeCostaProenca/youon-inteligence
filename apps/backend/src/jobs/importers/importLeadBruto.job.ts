import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { parse } from 'csv-parse/sync';
import { prisma } from '@/database/prismaClient';
import axios from 'axios';
import camposMap from '@/../data/dataset_campos_map.json';


const datasetsPath = path.resolve(__dirname, '../../../../data/datasets.json');
const downloadsDir = path.resolve(__dirname, '../../../../data/downloads');

async function baixarArquivo(url: string, nome: string): Promise<string> {
  const filePath = path.join(downloadsDir, nome);
  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

async function extrairZip(zipPath: string): Promise<string> {
  const directory = await unzipper.Open.file(zipPath);
  const firstCsv = directory.files.find(file => file.path.endsWith('.csv'));
  if (!firstCsv) throw new Error('Nenhum CSV encontrado no ZIP');

  const extractedPath = path.join(downloadsDir, firstCsv.path);
  await new Promise((res, rej) => {
    firstCsv.stream()
      .pipe(fs.createWriteStream(extractedPath))
      .on('finish', () => res(undefined))
      .on('error', rej);
  });

  return extractedPath;
}

function obterUFDoMunicipio(codMun: string): string {
  return codMun ? codMun.substring(0, 2) : '';
}

async function processarCSV(filePath: string, datasetNome: string, origem: string) {
  const campos = camposMap[nomeDataset];
  const content = await fs.promises.readFile(filePath);
  const records = parse(content, { columns: true, skip_empty_lines: true, bom: true });

  let inseridos = 0;

  for (const row of records) {
    const id = row[campos.id];
    if (!id) continue;

    const existente = await prisma.leadBruto.findUnique({ where: { id } });
    if (existente) continue;

    try {
      const latitude = parseFloat(row[campos.latitude]);
      const longitude = parseFloat(row[campos.longitude]);

      await prisma.leadBruto.create({
        data: {
          id,
          nomeUc: row[campos.nomeUc] || 'Desconhecido',
          classe: row[campos.classe] || '',
          grupoTensao: row[campos.grupoTensao] || '',
          modalidade: row[campos.modalidade] || '',
          codigoDistribuidora: row[campos.codigoDistribuidora] || '',
          distribuidora: row[campos.distribuidora] || '',
          municipio: row[campos.municipio] || '',
          estado: obterUFDoMunicipio(row[campos.municipio] || ''),
          latitude: isNaN(latitude) ? undefined : latitude,
          longitude: isNaN(longitude) ? undefined : longitude,
          dataConexao: row[campos.dataConexao] ? new Date(row[campos.dataConexao]) : undefined,
          dataAtualizacao: new Date(),
          status: 'raw',
          segmento: origem,
          origem: datasetNome
        },
      });
      inseridos++;
    } catch (err) {
      console.warn(`⚠️ Erro ao inserir ${id} do dataset ${datasetNome}:`, err);
    }
  }

  console.log(`✅ ${datasetNome}: ${inseridos} registros inseridos.`);
}

async function main() {
  const datasets = JSON.parse(await fs.promises.readFile(datasetsPath, 'utf-8'));

  for (const ds of datasets) {
    try {
      const nomeArquivo = ds.url.endsWith('.zip') ? `${ds.nome}.zip` : `${ds.nome}.csv`;
      console.log(`⬇️  Baixando ${ds.nome}...`);
      const arquivoBaixado = await baixarArquivo(ds.url, nomeArquivo);

      let csvPath = arquivoBaixado;
      if (arquivoBaixado.endsWith('.zip')) {
        console.log(`📦 Extraindo ZIP de ${ds.nome}...`);
        csvPath = await extrairZip(arquivoBaixado);
      }

      console.log(`📄 Lendo dados de ${ds.nome}...`);
      await processarCSV(csvPath, ds.nome, ds.origem);

      fs.unlinkSync(arquivoBaixado);
      if (csvPath !== arquivoBaixado) fs.unlinkSync(csvPath);
    } catch (err) {
      console.error(`❌ Erro ao processar ${ds.nome}:`, err);
    }
  }

  console.log(`✅ Importação finalizada. Total de arquivos: ${datasets.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erro geral na importação:', err);
  process.exit(1);
});
