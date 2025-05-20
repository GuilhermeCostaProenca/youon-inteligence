import axios from 'axios';

interface UnidadeConsumidora {
  nome: string;
  municipio: string;
  uf: string;
  codigoDistribuidora: string;
  classe: string;
  subclasse: string;
  grupoTensao: string;
  modalidadeTarifaria: string;
  latitude: number;
  longitude: number;
  dataConexao: string;
  dataAtualizacao: string;
}

export async function fetchUnidadesConsumidoras(pagina: number, tamanhoPagina: number): Promise<UnidadeConsumidora[]> {
  const offset = (pagina - 1) * tamanhoPagina;

  try {
    const response = await axios.get('https://dadosabertos.aneel.gov.br/api/3/action/datastore_search', {
      params: {
        resource_id: '3710b245-88f0-4aa6-8cfb-8b1426e9021d',
        limit: tamanhoPagina,
        offset: offset,
      },
    });

    const records = response.data.result.records;

    // Mapeie os registros para o formato da interface UnidadeConsumidora
    const unidades: UnidadeConsumidora[] = records.map((record: any) => ({
      nome: record.nome_uc,
      municipio: record.municipio,
      uf: record.uf,
      codigoDistribuidora: record.codigo_distribuidora,
      classe: record.classe,
      subclasse: record.subclasse,
      grupoTensao: record.grupo_tensao,
      modalidadeTarifaria: record.modalidade_tarifaria,
      latitude: parseFloat(record.latitude),
      longitude: parseFloat(record.longitude),
      dataConexao: record.data_conexao,
      dataAtualizacao: record.data_atualizacao,
    }));

    return unidades;
  } catch (error) {
    console.error('Erro ao buscar dados da ANEEL:', error);
    return [];
  }
}
