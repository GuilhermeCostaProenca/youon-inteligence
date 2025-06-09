import { prisma } from '@/database/prismaClient';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { normalizarCoordenadaBDGD } from '../utils/normalizadores';

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
    const result = data.results?.[0];
    if (!result) return null;

    const tipo = result.types?.[0] || 'desconhecido';
    const nome = result.formatted_address || 'sem endereço';
    const cidade = result.address_components?.find((c: any) =>
      c.types.includes('administrative_area_level_2'))?.long_name || 'desconhecida';
    const estado = result.address_components?.find((c: any) =>
      c.types.includes('administrative_area_level_1'))?.short_name || 'UF';
    const rua = result.address_components?.find((c: any) =>
      c.types.includes('route'))?.long_name || '';
    const numero = result.address_components?.find((c: any) =>
      c.types.includes('street_number'))?.long_name || '';
    const endereco = `${rua}, ${numero}`.trim();

    return { tipo, nome, endereco, cidade, estado };
  } catch (err) {
    console.warn('⚠️ Erro na geolocalização reversa:', err);
    return null;
  }
}

// === JOB PRINCIPAL ===
export async function inferirGeoInfoLead() {
  console.log('🌍 Iniciando enriquecimento geográfico...');

  const leadsBrutos = await prisma.lead_bruto.findMany({
  where: {
    status: 'raw',
    geo_info_lead: null,
  },
  take: 100,
});

const leads = leadsBrutos.filter((lead) => {
  const coords = lead.coordenadas as any;
  return coords?.lat && coords?.lng;
});


  let total = 0;

  for (const lead of leads) {
    const coords = lead.coordenadas as { lat?: string | number; lng?: string | number } | null;
    const lat = normalizarCoordenadaBDGD(coords?.lat);
    const lng = normalizarCoordenadaBDGD(coords?.lng);
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

    total++;
    console.log(`📍 Lead ${lead.id} geolocalizado`);
  }

  console.log(`✅ GeoInfo concluído: ${total} leads enriquecidos.`);

  // ⬇️ Chamar próximo job da cascata
  const { inferirCNPJporCoordenada } = await import('./inferirCNPJporCoordenada.job.js');
  await inferirCNPJporCoordenada();
}
