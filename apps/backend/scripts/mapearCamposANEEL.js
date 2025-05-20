const axios = require("axios");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const arquivos = [
  {
    nome: "EQME_2024.csv",
    url: "https://www.aneel.gov.br/documents/656877/28743505/EQME_2024.csv"
  },
  {
    nome: "EQSE_2024.csv",
    url: "https://www.aneel.gov.br/documents/656877/28743505/EQSE_2024.csv"
  },
  {
    nome: "UCAT_tab.csv",
    url: "https://www.aneel.gov.br/documents/656877/28743505/UCAT_tab.csv"
  },
  {
    nome: "UGRD_2024.csv",
    url: "https://www.aneel.gov.br/documents/656877/28743505/UGRD_2024.csv"
  },
  {
    nome: "GD.csv",
    url: "https://www.aneel.gov.br/documents/656877/28743505/GD.csv"
  }
];

const pasta = path.resolve(__dirname, "../temp_csv");
const resultado = {};

if (!fs.existsSync(pasta)) {
  fs.mkdirSync(pasta);
}

async function processarCSV({ nome, url }) {
  const caminho = path.join(pasta, nome);
  try {
    console.log(`📥 Baixando: ${nome}`);
    const response = await axios.get(url, { responseType: "stream" });
    const writer = fs.createWriteStream(caminho);

    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const stream = fs.createReadStream(caminho);
    const rl = readline.createInterface({ input: stream });

    for await (const linha of rl) {
      const colunas = linha.split(";").map((c) => c.trim());
      resultado[nome] = {
        url,
        campos: colunas
      };
      break; // só a primeira linha
    }

    fs.unlinkSync(caminho); // limpa o arquivo depois
  } catch (err) {
    resultado[nome] = {
      url,
      erro: err.message
    };
    console.error(`❌ Erro em ${nome}: ${err.message}`);
  }
}

async function iniciar() {
  for (const arquivo of arquivos) {
    await processarCSV(arquivo);
  }

  const destino = path.resolve(__dirname, "../mapeamento_campos_aneel.json");
  fs.writeFileSync(destino, JSON.stringify(resultado, null, 2), "utf-8");

  console.log("✅ Mapeamento salvo em mapeamento_campos_aneel.json");
}

iniciar();
