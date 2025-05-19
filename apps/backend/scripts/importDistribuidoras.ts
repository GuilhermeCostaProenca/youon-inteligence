import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(__dirname, '../data/AreaatuadistbaseBI.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

          for (const row of data as Array<Record<string, any>>) {
            try {
              await prisma.distribuidora.create({
                data: {
                  nome: String(row['NOME'] || ''),
                  regiao: String(row['REGIAO'] || ''),
                  uf: String(row['UF'] || ''),
                  cnpj: String(row['CNPJ'] || ''),
                  outorga: String(row['OUTORGA'] || ''),
                  tipo: String(row['TIPO'] || ''),
                  grupo: String(row['GRUPO'] || ''),
                  subgrupo: String(row['SUBGRUPO'] || ''),
                  classe: String(row['CLASSE'] || ''),
                },
              });
            } catch (error) {
              console.error('❌ Erro ao importar linha:', row, error);
            }
          }


  console.log('✅ Importação concluída!');
  await prisma.$disconnect();
}

main();
