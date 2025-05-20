import { fetchUnidadesConsumidoras } from "./aneelApi";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();


export async function importarDadosANEEL() {
  let pagina = 1;
  const tamanhoPagina = 100;
  let totalImportados = 0;

  while (true) {
    const dados = await fetchUnidadesConsumidoras(pagina, tamanhoPagina);
    if (dados.length === 0) break;

    for (const uc of dados) {
      try {
        await prisma.leadBruto.create({
          data: {
            nomeUc: uc.nome,
            municipio: uc.municipio,
            estado: uc.uf,
            codigoDistribuidora: uc.codigoDistribuidora,
            classe: uc.classe,
            subclasse: uc.subclasse,
            grupoTensao: uc.grupoTensao,
            modalidadeTarifaria: uc.modalidadeTarifaria,
            latitude: uc.latitude,
            longitude: uc.longitude,
            dataConexao: new Date(uc.dataConexao),
            dataAtualizacao: new Date(uc.dataAtualizacao),
            status: "raw",
          },
        });
        totalImportados++;
      } catch (err) {
        console.error("Erro ao salvar lead:", err);
      }
    }

    pagina++;
  }

  console.log(`✅ Importação finalizada. Total de registros: ${totalImportados}`);
}
