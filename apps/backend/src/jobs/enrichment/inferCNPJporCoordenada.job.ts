import { prisma } from '@/database/prismaClient';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CNPJA_URL = 'https://api.cnpja.com.br/companies?search=';
const CNPJA_TOKEN = process.env.CNPJA_TOKEN;

// === UTILS ===

function corrigirCoordenadaBDGD(raw: string | number | undefined | null): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return raw;
  const semPonto = raw.replace(/\./g, '');
  const parsed = parseFloat(semPonto) / 1_000_000;
  return isNaN(parsed) ? null : parsed;
}

function sanitizeCEP(raw: string | undefined | null): string | null {
  if (!raw) return null;
  return raw.replace(/\D/g, '') || null;
}

function validarCNAE(cnaeAneel: string, cnaeEmpresa: string): boolean {
  if (!cnaeAneel || !cnaeEmpresa) return false;
  return cnaeEmpresa.startsWith(cnaeAneel.slice(0, 3));
}

// === GEOCODING ===

async function reverseGeocode(lat: number, lng: number): Promise<{ nome: string, cep: string } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;

  try {
    const { data } = await axios.get(url);
    const result = data.results[0];

    if (!result) return null;

    const nome = result.formatted_address || '';
    const cep = result.address_components?.find((c: any) => c.types.includes('postal_code'))?.short_name || '';

    return { nome, cep };
  } catch (err) {
    console.error('❌ Erro na geolocalização reversa:', err);
    return null;
  }
}

// === ENRIQUECIMENTO VIA NOME/CEP ===

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

// === JOB PRINCIPAL ===

export async function inferirCNPJporCoordenada() {
  const leads = await prisma.lead_bruto.findMany({
    where: {
      status: 'raw',
      cnpj: null,
      coordenadas: { not: null }
    },
    take: 100
  });

  for (const lead of leads) {
    const { lat, lng } = lead.coordenadas as any;
    const latParsed = corrigirCoordenadaBDGD(lat);
    const lngParsed = corrigirCoordenadaBDGD(lng);

    if (!latParsed || !lngParsed) {
      console.warn(`⚠️ Coordenadas inválidas para lead ${lead.id}`);
      continue;
    }

    const info = await reverseGeocode(latParsed, lngParsed);
    if (!info || !info.nome) {
      console.warn(`⚠️ Reverse geocode falhou para ${lead.id}`);
      continue;
    }

    const cep = sanitizeCEP(lead.cep) || sanitizeCEP(info.cep);
    if (!cep) {
      console.warn(`⚠️ CEP ausente ou inválido para ${lead.id}`);
      continue;
    }

    const empresa = await buscarCNPJporNomeEndereco(info.nome, cep);
    if (!empresa) continue;

    const cnaeEmpresa = empresa.main_activity?.code || '';
    const cnaeLead = lead.cnae || '';

    if (!validarCNAE(cnaeLead, cnaeEmpresa)) {
      console.warn(`🚫 CNAE incompatível: ${lead.id} | lead: ${cnaeLead} ≠ empresa: ${cnaeEmpresa}`);
      continue;
    }

    const cnpjLimpo = empresa.cnpj.replace(/\D/g, '');

    await prisma.lead_bruto.update({
      where: { id: lead.id },
      data: {
        cnpj: cnpjLimpo,
        status: 'enriquecido'
      }
    });

    await prisma.lead_enriquecido.upsert({
      where: { cnpj: cnpjLimpo },
      update: {
        nome_fantasia: empresa.fantasy_name,
        razao_social: empresa.name,
        porte: empresa.size,
        municipio: empresa.address.city,
        estado: empresa.address.state,
        cnae_principal: empresa.main_activity.code,
        descricao_cnae: empresa.main_activity.description,
        atualizado_em: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        cnpj: cnpjLimpo,
        nome_fantasia: empresa.fantasy_name,
        razao_social: empresa.name,
        porte: empresa.size,
        municipio: empresa.address.city,
        estado: empresa.address.state,
        cnae_principal: empresa.main_activity.code,
        descricao_cnae: empresa.main_activity.description,
        atualizado_em: new Date(),
      }
    });

    console.log(`✅ ${lead.id}: ${empresa.fantasy_name} | CNPJ ${cnpjLimpo} | CNAE OK`);
  }

  console.log('🏁 Job finalizado: enriquecimento por coordenadas concluído.');
}
