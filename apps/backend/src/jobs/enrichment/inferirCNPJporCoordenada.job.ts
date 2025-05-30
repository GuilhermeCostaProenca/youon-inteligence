import { prisma } from '@/database/prismaClient';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  normalizarCoordenadaBDGD,
  normalizarCepBDGD
} from '../utils/normalizadores';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CNPJA_URL = 'https://api.cnpja.com.br/companies?search=';
const CNPJA_TOKEN = process.env.CNPJA_TOKEN;

// === GEOCODING ===
async function reverseGeocode(lat: number, lng: number): Promise<{ nome: string, cep: string } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    const result = data.results[0];
    if (!result) return null;

    const nome = result.formatted_address || '';
    const cep = result.address_components?.find((c: any) =>
      c.types.includes('postal_code'))?.short_name || '';

    return { nome, cep };
  } catch (err) {
    console.error('❌ Erro na geolocalização reversa:', err);
    return null;
  }
}

// === ENRIQUECIMENTO VIA CNPJá ===
async function buscarCNPJporNomeEndereco(nome: string, cep: string) {
  try {
    const url = `${CNPJA_URL}${encodeURIComponent(nome)}&postal_code=${cep}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${CNPJA_TOKEN}` }
    });

    const empresa = response.data?.[0];
    return empresa?.cnpj ? empresa : null;
  } catch (err) {
    console.warn(`⚠️ Falha ao buscar CNPJ para "${nome}" - ${cep}`);
    return null;
  }
}

// === CNAE ===
function validarCNAE(cnaeAneel: string, cnaeEmpresa: string): boolean {
  if (!cnaeAneel || !cnaeEmpresa) return false;
  return cnaeEmpresa.startsWith(cnaeAneel.slice(0, 3));
}

// === JOB PRINCIPAL ===
export async function inferirCNPJporCoordenada() {
  console.log('🔎 Iniciando inferência de CNPJ por coordenadas...');

  const leadsRaw = await prisma.lead_bruto.findMany({
    where: {
      status: 'raw',
      cnpj: null,
    },
    take: 100
  });

  const leads = leadsRaw.filter((lead) => {
    const coords = lead.coordenadas as any;
    return coords?.lat && coords?.lng;
  });

  let total = 0;

  for (const lead of leads) {
    const coords = lead.coordenadas as { lat?: string | number; lng?: string | number };
    const lat = normalizarCoordenadaBDGD(coords?.lat);
    const lng = normalizarCoordenadaBDGD(coords?.lng);
    if (!lat || !lng) {
      console.warn(`⚠️ Coordenadas inválidas para lead ${lead.id}`);
      continue;
    }

    const geoInfo = await reverseGeocode(lat, lng);
    if (!geoInfo || !geoInfo.nome) {
      console.warn(`⚠️ Geocode falhou para ${lead.id}`);
      continue;
    }

    const cep = normalizarCepBDGD(lead.cep) || normalizarCepBDGD(geoInfo.cep);
    if (!cep) {
      console.warn(`⚠️ CEP inválido para ${lead.id}`);
      continue;
    }

    const empresa = await buscarCNPJporNomeEndereco(geoInfo.nome, cep);
    if (!empresa) continue;

    const cnaeEmpresa = empresa.main_activity?.code || '';
    const cnaeLead = lead.cnae || '';
    if (!validarCNAE(cnaeLead, cnaeEmpresa)) {
      console.warn(`🚫 CNAE incompatível: ${lead.id} | ${cnaeLead} ≠ ${cnaeEmpresa}`);
      continue;
    }

    const cnpjLimpo = empresa.cnpj.replace(/\D/g, '');

    await prisma.lead_bruto.update({
      where: { id: lead.id },
      data: {
        cnpj: cnpjLimpo,
        status: 'enriquecido',
      },
    });

    await prisma.lead_enriquecido.upsert({
      where: { cnpj: cnpjLimpo },
      create: {
  cnpj: cnpjLimpo,
  lead_id: lead.id,
  nome_fantasia: empresa.fantasy_name,
  razao_social: empresa.name,
  tipo: empresa.type,
  porte: empresa.size,
  endereco: empresa.address.street,
  cidade: empresa.address.city,
  uf: empresa.address.state,
  atividade: `${empresa.main_activity.code} - ${empresa.main_activity.description}`,
  filiais: empresa.branches || 0,
},

  update: {
  nome_fantasia: empresa.fantasy_name,
  razao_social: empresa.name,
  tipo: empresa.type,
  porte: empresa.size,
  endereco: empresa.address.street,
  cidade: empresa.address.city,
  uf: empresa.address.state,
  atividade: `${empresa.main_activity.code} - ${empresa.main_activity.description}`,
  filiais: empresa.branches || 0,
}


    });

    total++;
    console.log(`✅ ${lead.id}: ${empresa.fantasy_name} | CNPJ ${cnpjLimpo}`);
  }

  console.log(`🏁 Job finalizado: ${total} leads enriquecidos com CNPJ.`);
}
