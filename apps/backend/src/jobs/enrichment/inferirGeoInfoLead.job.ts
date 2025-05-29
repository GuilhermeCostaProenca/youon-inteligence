import { prisma } from '@/database/prismaClient';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// === GEOCODING ===

async function reverseGeocode(lat: number, lng: number): Promise<{
  tipo: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
} | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

  try {
    const { data } = await axios.get(url);
    const result = data.results[0];
    if (!result) return null;

    const tipo = result.types?.[0] || 'desconhecido';
    const nome = result.formatted_address || 'sem endereço';
    const cidade =
      result.address_components?.find((c: any) =>
        c.types.includes('administrative_area_level_2')
      )?.long_name || 'desconhecida';
    const estado =
      result.address_components?.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      )?.short_name || 'UF';
    const rua =
      result.address_components?.find((c: any) =>
        c.types.includes('route')
      )?.long_name || '';
    const numero =
      result.address_components?.find((c: any) =>
        c.types.includes('street_number')
      )?.long_name || '';
    const endereco = `${rua}, ${numero}`.trim();

    return {
      tipo,
      nome,
      endereco,
      cidade,
      estado,
    };
  } catch (err) {
    console.warn('⚠️ Erro na geolocalização reversa:', err);
    return null;
  }
}

// === JOB PRINCIPAL ===

export async function inferirGeoInfoLead() {
  const leads = await prisma.lead_bruto.findMany({
    where: {
      status: 'raw',
      geo_info_lead: null,
      coordenadas: { not: null },
    },
    take: 100,
  });

  for (const lead of leads) {
    const { lat, lng } = lead.coordenadas as any;
    if (!lat || !lng) continue;

    const geo = await reverseGeocode(lat, lng);
    if (!geo) {
      console.warn(`⚠️ Falha ao geocodificar lead ${lead.id}`);
      continue;
    }

    await prisma.geo_info_lead.upsert({
      where: { lead_id: lead.id },
      update: {
        tipo_local: geo.tipo,
        nome_estabelecimento: geo.nome,
        endereco: geo.endereco,
        cidade: geo.cidade,
        estado: geo.estado,
      },
      create: {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        tipo_local: geo.tipo,
        nome_estabelecimento: geo.nome,
        endereco: geo.endereco,
        cidade: geo.cidade,
        estado: geo.estado,
      },
    });

    console.log(`📍 Geolocalização adicionada ao lead ${lead.id}`);
  }

  console.log('🏁 Job concluído: enriquecimento geográfico finalizado.');
}
