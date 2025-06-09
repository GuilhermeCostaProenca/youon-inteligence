import { importarUCAT } from '../importers/importUcatCascade.job';
import { importarUCMT } from '../importers/importUcmtCascade.job';
import { importarUCBT } from '../importers/importUcbtCascade.job';

import { normalizarDadosLeads } from '../enrichment/normalizarDadosLeads.job';
import { inferirGeoInfoLead } from '../enrichment/inferirGeoInfoLead.job';
import { inferirCNPJporCoordenada } from '../enrichment/inferirCNPJporCoordenada.job';

import { importarEnergia } from '../quality/importarEnergia.job';
import { importarDemanda } from '../quality/importarDemandaLead.job';
import { importarQualidade } from '../quality/importarQualidade.job';

async function run() {
  console.log('🧩 Orquestrador iniciado: pipeline de dados completo\n');

  const etapas = [
    { nome: 'Importar UCAT', funcao: importarUCAT },
    { nome: 'Importar UCMT', funcao: importarUCMT },
    { nome: 'Importar UCBT', funcao: importarUCBT },
    { nome: 'Normalizar dados', funcao: normalizarDadosLeads },
    { nome: 'Geolocalização', funcao: inferirGeoInfoLead },
    { nome: 'Enriquecimento por CNPJ', funcao: inferirCNPJporCoordenada },
    { nome: 'Qualidade: Energia', funcao: importarEnergia },
    { nome: 'Qualidade: Demanda', funcao: importarDemanda },
    { nome: 'Qualidade: DIC/FIC', funcao: importarQualidade },
  ];

  const startTotal = Date.now();

  for (const etapa of etapas) {
    console.log(`▶️ Iniciando etapa: ${etapa.nome}`);
    const start = Date.now();

    try {
      await etapa.funcao();
      const duracao = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✅ ${etapa.nome} finalizada em ${duracao}s\n`);
    } catch (err) {
      console.error(`❌ Erro durante "${etapa.nome}":`, err);
      process.exit(1);
    }
  }

  const tempoFinal = ((Date.now() - startTotal) / 1000 / 60).toFixed(2);
  console.log(`🎯 Pipeline completo executado com sucesso em ${tempoFinal} minutos 🚀`);
  process.exit(0);
}

run();
