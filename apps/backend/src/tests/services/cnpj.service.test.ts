// src/tests/services/cnpj.service.test.ts
import axios from 'axios';
import { getEmpresaPorCNPJ } from '../../services/cnpj.service';

jest.mock('axios');

describe('CNPJ Service', () => {
  it('retorna dados estruturados quando a API responde', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        razao_social: 'NU PAGAMENTOS S.A.',
        estabelecimento: {
          nome_fantasia: 'NUBANK',
          atividade_principal: { subclasse: '6422-3/00' },
          cep: '01234-000',
          cidade: { nome: 'São Paulo' },
          estado: { sigla: 'SP' }
        }
      }
    });

    const data = await getEmpresaPorCNPJ('19131243000197');
    expect(data).toEqual({
      razao_social: 'NU PAGAMENTOS S.A.',
      nome_fantasia: 'NUBANK',
      cnae_principal: '6422-3/00',
      cep: '01234-000',
      municipio: 'São Paulo',
      uf: 'SP'
    });
  });
});
