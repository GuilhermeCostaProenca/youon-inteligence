import { prisma } from '@/database/prismaClient';
import { normalizarCepBDGD, normalizarCoordenadaBDGD } from '../utils/normalizadores.js';

export async function normalizarDadosLeads() {
  console.log('🧹 Iniciando normalização dos leads brutos...');

  const leads = await prisma.lead_bruto.findMany({
    where: {
      status: { in: ['raw', 'enriquecido'] },
      OR: [
        { cep: { not: null } },
        { coordenadas: { not: undefined } }
      ]
    },
    take: 1000
  });

  const filtrados = leads.filter((lead) => {
    const coords = lead.coordenadas as any;
    return coords?.lat || coords?.lng || lead.cep;
  });

  let totalAtualizados = 0;

  for (const lead of filtrados) {
    const coords = lead.coordenadas as { lat?: number | string; lng?: number | string } | null;
    const lat = normalizarCoordenadaBDGD(coords?.lat);
    const lng = normalizarCoordenadaBDGD(coords?.lng);
    const cep = normalizarCepBDGD(lead.cep as any);

    if (!lat || !lng || !cep) continue;

    await prisma.lead_bruto.update({
      where: { id: lead.id },
      data: {
        coordenadas: { lat, lng },
        cep,
      },
    });

    totalAtualizados++;
  }

  console.log(`✅ Normalização concluída: ${totalAtualizados} leads atualizados.`);

  const { inferirGeoInfoLead } = await import('./inferirGeoInfoLead.job.js');
  await inferirGeoInfoLead();
}

// 🟢 ADICIONE ISSO:
normalizarDadosLeads();
