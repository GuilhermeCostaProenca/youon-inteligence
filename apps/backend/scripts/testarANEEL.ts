import axios from "axios";

async function testarGD() {
  const resourceId = "53a9a5c4-5e66-4d47-a362-8fa3db6bdfb6";
  const limit = 5;
  const offset = 0;

  try {
    const response = await axios.get("https://dadosabertos.aneel.gov.br/api/3/action/datastore_search", {
      params: { resource_id: resourceId, limit, offset },
    });

    console.log("✅ Registros GD:");
    response.data.result.records.forEach((reg: any, i: number) => {
      console.log(`\n#${i + 1} - ${reg.NOME_TITULAR}`);
      console.log(`CNPJ: ${reg.CNPJ}`);
      console.log(`Classe: ${reg.CLASSE_CONSUMO}`);
      console.log(`Modalidade: ${reg.MODALIDADE_TARIFARIA}`);
      console.log(`Potência: ${reg.POTENCIA_INSTALADA_KW} kW`);
      console.log(`UF/Município: ${reg.UF} / ${reg.MUNICIPIO}`);
    });

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

testarGD();
