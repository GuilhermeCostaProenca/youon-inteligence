export interface AneelUc {
  nome: string;
  municipio: string;
  uf: string;
  codigoDistribuidora: string;
  classe: string;
  subclasse: string;
  grupoTensao: string;
  modalidadeTarifaria: string;
  latitude: number | null;
  longitude: number | null;
  dataConexao: string;
  dataAtualizacao: string;
}
