import axios from 'axios';

export interface EmpresaCNPJ {
  razao_social: string;
  nome_fantasia?: string;
  cnae_principal?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
}

export async function getEmpresaPorCNPJ(cnpj: string): Promise<EmpresaCNPJ> {
  try {
    const response = await axios.get(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    const data = response.data;

    return {
      razao_social: data.razao_social,
      nome_fantasia: data.estabelecimento?.nome_fantasia || '',
      cnae_principal: data.estabelecimento?.atividade_principal?.subclasse,
      cep: data.estabelecimento?.cep,
      municipio: data.estabelecimento?.cidade?.nome,
      uf: data.estabelecimento?.estado?.sigla,
    };
  } catch (error) {
    console.warn(`⚠️ Erro ao consultar CNPJ ${cnpj}:`, error);
    return {
      razao_social: 'Desconhecido',
    };
  }
}
