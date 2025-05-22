// scripts/utils/gerarCamposMap.ts
import fs from 'fs';
import path from 'path';

const datasetsPath = path.resolve(__dirname, '../../datasets.json');
const outputPath = path.resolve(__dirname, '../../dataset_campos_map.json');

// Heurística de mapeamento por palavras-chave comuns
const heuristicas = {
  id: ['COD_ID_ENCR', 'ID', 'CODIGO'],
  nomeUc: ['CNAE', 'NOME', 'RAZAO_SOCIAL', 'NOME_LOCAL'],
  classe: ['CLAS_SUB', 'CLASSE_CONSUMIDOR'],
  grupoTensao: ['GRU_TAR', 'GRUPO_TENSAO'],
  modalidade: ['TIP_CC', 'MODALIDADE'],
  codigoDistribuidora: ['PN_CON', 'PAC', 'COD_DISTRIB'],
  distribuidora: ['DIST', 'DISTRIBUIDORA'],
  municipio: ['MUN', 'MUNICIPIO'],
  estado: ['UF', 'ESTADO'],
  latitude: ['POINT_Y', 'LATITUDE'],
  longitude: ['POINT_X', 'LONGITUDE'],
  dataConexao: ['DAT_CON', 'DATA_CONEXAO'],
};

function mapearCampos(colunas: string[]) {
  const mapeado: Record<string, string> = {};

  for (const [campoPadrao, possiveis] of Object.entries(heuristicas)) {
    const encontrada = colunas.find(c => possiveis.includes(c.toUpperCase()));
    if (encontrada) mapeado[campoPadrao] = encontrada;
  }

  return mapeado;
}

function main() {
  const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf-8'));

  const camposMap: Record<string, Record<string, string>> = {};

  for (const ds of datasets) {
    if (!ds.colunas || !Array.isArray(ds.colunas)) {
      console.warn(`⚠️  Dataset ${ds.nome} não tem colunas definidas.`);
      continue;
    }

    camposMap[ds.nome] = mapearCampos(ds.colunas);
  }

  fs.writeFileSync(outputPath, JSON.stringify(camposMap, null, 2));
  console.log(`✅ Campos mapeados salvos em: ${outputPath}`);
}

main();
