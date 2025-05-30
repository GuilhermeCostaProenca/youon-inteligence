import { importarUCAT } from '../importers/importUcatCascade.job';
import { importarUCMT } from '../importers/importUcmtCascade.job';
import { importarUCBT } from '../importers/importUcbtCascade.job';

async function run() {
  console.log('🧩 Orquestrador iniciado: importação em cascata\n');

  const etapas = [
    { nome: 'UCAT', funcao: importarUCAT },
    { nome: 'UCMT', funcao: importarUCMT },
    { nome: 'UCBT', funcao: importarUCBT },
  ];

  const startTotal = Date.now();

  for (const etapa of etapas) {
    console.log(`▶️ Iniciando importação de ${etapa.nome}...`);
    const start = Date.now();

    try {
      await etapa.funcao();
      const duracao = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✅ ${etapa.nome} finalizado em ${duracao}s\n`);
    } catch (err) {
      console.error(`❌ Erro ao importar ${etapa.nome}:`, err);
      process.exit(1);
    }
  }

  const tempoFinal = ((Date.now() - startTotal) / 1000 / 60).toFixed(2);
  console.log(`🎯 Importação completa com sucesso em ${tempoFinal} minutos 🚀`);
  process.exit(0);
}

run();
