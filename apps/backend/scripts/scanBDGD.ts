// scripts/scanBDGD.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import unzipper from 'unzipper';

const outputPath = path.resolve(__dirname, '../datasets.json');
const downloadDir = path.resolve(__dirname, '../downloads');

const datasets = [
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
    formato: 'zip'
  },
];

async function processDataset(dataset: any) {
  const ext = dataset.formato === 'zip' ? 'zip' : 'csv';
  const filePath = path.join(downloadDir, `${dataset.nome}.${ext}`);

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const writer = fs.createWriteStream(filePath);
  const response = await axios.get(dataset.url, { responseType: 'stream' });
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  if (dataset.formato === 'zip') {
    const extractedDir = path.join(downloadDir, dataset.nome);
    if (!fs.existsSync(extractedDir)) fs.mkdirSync(extractedDir);

    const extractedFiles: string[] = [];

    await fs.createReadStream(filePath)
      .pipe(unzipper.Parse())
      .on('entry', async (entry: any) => {
        const fileName = entry.path;
        if (fileName.endsWith('.csv')) {
          const csvPath = path.join(extractedDir, fileName);
          entry.pipe(fs.createWriteStream(csvPath));
          extractedFiles.push(csvPath);
        } else {
          entry.autodrain();
        }
      })
      .promise();

    fs.unlinkSync(filePath);

    if (extractedFiles.length === 0) {
      return {
        nome: dataset.nome,
        url: dataset.url,
        origem: dataset.origem,
        colunas: ['NO_CSV_FOUND'],
      };
    }

    const headers: string[] = await new Promise((resolve, reject) => {
      fs.createReadStream(extractedFiles[0])
        .pipe(csvParser({ separator: ';' }))
        .on('headers', (headers: string[]) => resolve(headers))
        .on('error', reject);
    });

    fs.rmSync(extractedDir, { recursive: true, force: true });

    return {
      nome: dataset.nome,
      url: dataset.url,
      origem: dataset.origem,
      colunas: headers,
    };
  }

  const headers: string[] = await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: ';' }))
      .on('headers', (headers: string[]) => resolve(headers))
      .on('error', reject);
  });

  fs.unlinkSync(filePath);

  return {
    nome: dataset.nome,
    url: dataset.url,
    origem: dataset.origem,
    colunas: headers,
  };
}

async function main() {
  const resultados: any[] = [];
  for (const dataset of datasets) {
    console.log(`📥 Processando ${dataset.nome}...`);
    try {
      const info = await processDataset(dataset);
      resultados.push(info);
    } catch (e) {
      console.error(`❌ Erro em ${dataset.nome}:`, e);
    }
  }
  fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));
  console.log(`✅ Arquivo datasets.json gerado com sucesso.`);
}

main();