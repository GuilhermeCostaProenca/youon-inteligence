// src/tests/services/cnpj.service.test.ts
import { getEmpresaPorCNPJ } from '../../services/cnpj.service';

describe('CNPJ Service', () => {
  it('retorna dados válidos para um CNPJ real', async () => {
    const cnpj = '19131243000197'; // Nubank
    const data = await getEmpresaPorCNPJ(cnpj);
    expect(data.razao_social).toContain('NUBANK');
  });
});
