import axios from "axios";
import fs from "fs";

const BASE_URL = "https://dadosabertos.aneel.gov.br/api/3/action";

async function listarDatasets() {
  try {
    const lista = await axios.get(`${BASE_URL}/package_list`);
    const datasets: string[] = lista.data.result;

    const resultadoFinal = [];

    for (const nome of datasets) {
      try {
        const detalhe = await axios.get(`${BASE_URL}/package_show`, {
          params: { id: nome },
        });

        const data = detalhe.data.result;
        const resources = data.resources.map((res: any) => ({
          nome: res.name,
          formato: res.format,
          resource_id: res.id,
          url: res.url,
        }));

        resultadoFinal.push({
          nomeDataset: data.title,
          idInterno: data.id,
          descricao: data.notes,
          recursos: resources,
        });

        console.log(`✅ Coletado: ${data.title}`);

      } catch (erroInterno) {
        console.warn(`⚠️ Erro ao buscar detalhes de ${nome}`);
      }
    }

    fs.writeFileSync("aneel_datasets_map.json", JSON.stringify(resultadoFinal, null, 2));
    console.log("📁 Mapeamento salvo em aneel_datasets_map.json");

  } catch (erro) {
    console.error("❌ Erro ao listar datasets da ANEEL:", erro);
  }
}

listarDatasets();
