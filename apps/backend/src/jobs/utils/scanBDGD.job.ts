// apps/backend/scripts/scanBDGD.ts

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import unzipper from 'unzipper';
import { parse } from 'csv-parse/sync';

const datasets: { nome: string; url: string; origem: string }[] = [
  {
    nome: 'UCAT_tab',
    url: 'https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/f6671cba-f269-42ef-8eb3-62cb3bfa0b98/download/ucat_pj.csv',
    origem: 'C&I',
  },
  {
    nome: 'UCMT_tab',
    url: 'https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/f6671cba-f269-42ef-8eb3-62cb3bfa0b98/download/ucmt_pj.csv',
    origem: 'C&I',
  },
  {
    nome: 'UCBT_tab',
    url: 'https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/3ae4d382-7072-4b08-90a4-dcd187a2eae2/download/ucbt_pj.zip',
    origem: 'C&I',
  },
];

const downloadsDir = path.resolve(__dirname, '../../../data/downloads');
const datasetsPath = path.resolve(__dirname, '../../../data/datasets.json');

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
      .on('finish', () => res(extractedPath))
      .on('error', rej);
  });
  return extractedPath;
}

async function lerColunasCSV(filePath: string): Promise<string[]> {
  const content = fs.readFileSync(filePath);
  const records = parse(content, { columns: true, skip_empty_lines: true });
  return Object.keys(records[0]);
}

async function main() {
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

  const resultados: any[] = [];

  for (const ds of datasets) {
    try {
      console.log(`📥 Processando ${ds.nome}...`);
      const nomeArquivo = ds.url.endsWith('.zip') ? `${ds.nome}.zip` : `${ds.nome}.csv`;
      const arquivoBaixado = await baixarArquivo(ds.url, nomeArquivo);

      let csvPath = arquivoBaixado;
      if (arquivoBaixado.endsWith('.zip')) {
        csvPath = await extrairZip(arquivoBaixado);
      }

      const colunas = await lerColunasCSV(csvPath);

      resultados.push({ ...ds, colunas });

      fs.unlinkSync(arquivoBaixado);
      if (csvPath !== arquivoBaixado) fs.unlinkSync(csvPath);
    } catch (err) {
      console.error(`❌ Erro em ${ds.nome}:`, err);
    }
  }

  fs.writeFileSync(datasetsPath, JSON.stringify(resultados, null, 2));
  console.log('✅ Arquivo datasets.json gerado com sucesso.');
}

main();
