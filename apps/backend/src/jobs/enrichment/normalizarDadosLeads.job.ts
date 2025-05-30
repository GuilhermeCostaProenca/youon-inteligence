import { prisma } from '@/database/prismaClient';
import { normalizarCepBDGD, normalizarCoordenadaBDGD } from '../utils/normalizadores';

export async function normalizarDadosLeads() {
  console.log('🧹 Iniciando normalização dos leads brutos...');

  const leads = await prisma.lead_bruto.findMany({
    where: {
      OR: [
        { coordenadas: null },
        { cep: { not: null } }
      ],
      status: { in: ['raw', 'enriquecido'] }
    },
    take: 1000
  });

  let totalAtualizados = 0;

  for (const lead of leads) {
    const lat = normalizarCoordenadaBDGD(lead.latitude as any);
    const lng = normalizarCoordenadaBDGD(lead.longitude as any);
    const cep = normalizarCepBDGD(lead.cep as any);

    if (!lat || !lng || !cep) continue;

    await prisma.lead_bruto.update({
      where: { id: lead.id },
      data: {
        coordenadas: { lat, lng },
        cep
      }
    });

    totalAtualizados++;
  }

  console.log(`✅ Normalização concluída: ${totalAtualizados} leads atualizados.`);

  // Chama próximo passo da cascata (enriquecimento geográfico)
  const { inferirGeoInfoLead } = await import('./inferirGeoInfoLead.job.js');
  await inferirGeoInfoLead();
}
