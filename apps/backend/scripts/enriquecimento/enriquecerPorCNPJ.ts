// apps/backend/scripts/enriquecimento/enriquecerPorCNPJ.ts
import { prisma } from '../../database/prisma';
import axios from 'axios';

async function consultarCNPJ(cnpj: string) {
  const url = `https://publica.cnpj.ws/cnpj/${cnpj}`; // API pública CNPJá
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.warn(`⚠️  Falha ao consultar CNPJ ${cnpj}`);
    return null;
  }
}

async function main() {
  const leads = await prisma.leadBruto.findMany({
    where: {
      cnpj: { not: null },
      status: 'raw'
    },
    take: 50 // limite para testes / evitar rate limit
  });

  console.log(`🔍 Enriquecendo ${leads.length} leads com CNPJ...`);

  for (const lead of leads) {
    const dados = await consultarCNPJ(lead.cnpj!);
    if (!dados) continue;

    await prisma.leadEnriquecido.upsert({
      where: { cnpj: lead.cnpj! },
      update: {},
      create: {
        cnpj: lead.cnpj!,
        nomeFantasia: dados.estabelecimento?.nome_fantasia || null,
        razaoSocial: dados.razao_social || null,
        porte: dados.porte || null,
        naturezaJuridica: dados.natureza_juridica || null,
        bairro: dados.estabelecimento?.bairro || null,
        logradouro: dados.estabelecimento?.logradouro || null,
        numero: dados.estabelecimento?.numero || null,
        cep: dados.estabelecimento?.cep || null,
        municipio: dados.estabelecimento?.cidade?.nome || null,
        uf: dados.estabelecimento?.estado?.sigla || null,
        atividadePrincipal: dados.estabelecimento?.atividade_principal?.descricao || null,
      }
    });

    await prisma.leadBruto.update({
      where: { id: lead.id },
      data: { status: 'enriquecido' }
    });

    console.log(`✅ ${lead.cnpj} enriquecido com sucesso.`);
  }

  console.log('🏁 Enriquecimento finalizado.');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Erro no script de enriquecimento:', e);
  process.exit(1);
});
