import axios from 'axios';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

const url = 'https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/4318d38a-0bcd-421d-afb1-fb88b0c92a87/download/ucat_pj.csv';
const outputPath = path.resolve(__dirname, '../downloads/ucat_pj.csv');

async function baixarCSV() {
  console.log('⬇️ Baixando arquivo CSV da ANEEL...');

  // ✅ Garante que a pasta 'downloads/' existe
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const writer = fs.createWriteStream(outputPath);
  const response = await axios.get(url, { responseType: 'stream' });

  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', () => {
      console.log('✅ Download concluído!');
      resolve();
    });
    writer.on('error', reject);
  });
}

async function lerCSV() {
  console.log('📖 Lendo os primeiros registros...');
  const stream = fs.createReadStream(outputPath);
  const results: any[] = [];

  stream.pipe(csvParser({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log('🧾 Primeiros 5 registros:');
      console.table(results.slice(0, 5));
    });
}

async function main() {
  await baixarCSV();
  await lerCSV();
}

main().catch(console.error);
