# Youon Intelligence – Plataforma de Inteligência Comercial para o Setor de Energia

Bem-vindo à plataforma **Youon Intelligence**, uma solução robusta e escalável voltada para mapeamento, enriquecimento e priorização de leads estratégicos no setor de energia brasileiro. O sistema coleta e cruza dados da ANEEL com APIs externas como CNPJá e Google Maps, alimentando um pipeline de inteligência comercial dividido por segmentos: **C\&I (Comercial e Industrial)**, **Home** (futuro), e **GTD** (Governamental e Grandes Consumidores).

---

## 🧠 Visão Geral

* 📅 Importação automatizada de dados públicos da ANEEL (BDGD);
* 🧠 Enriquecimento com dados de CNPJ, localização, CNAE e nome fantasia;
* 🔎 Classificação inteligente dos leads em HOT, WARM ou COLD;
* 🗘️ Visualização futura em mapas com filtros por região, prioridade e segmento;
* 🔧 Sugestão futura de soluções ideais baseadas em consumo, demanda e qualidade.

---

## 🧱 Estrutura Final de Pastas

```bash
youon-inteligence/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── dev.db
│   │   │   └── migrations/
│   │   ├── data/
│   │   │   ├── downloads/
│   │   │   ├── aneel_datasets_map.json
│   │   │   ├── dataset_campos_map.json
│   │   │   ├── datasets.json
│   │   │   └── mapeamento_campos_aneel.json
│   │   ├── docs/
│   │   │   ├── api-endpoints.md
│   │   │   ├── arquitetura.md
│   │   │   ├── dados-externos.md
│   │   │   └── DicionarioANEEL.md
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── cni/
│   │   │   │   ├── gtd/
│   │   │   │   └── home/
│   │   │   ├── controllers/
│   │   │   │   └── cni/
│   │   │   ├── services/
│   │   │   │   ├── aneel.service.ts
│   │   │   │   ├── cnpj.service.ts
│   │   │   │   └── google.service.ts
│   │   │   ├── jobs/
│   │   │   │   ├── importers/
│   │   │   │   │   └── importLeadBruto.job.ts
│   │   │   │   ├── enrichment/
│   │   │   │   │   └── enrichLeads.job.ts
│   │   │   │   ├── quality/
│   │   │   │   │   └── importQuality.job.ts
│   │   │   │   ├── classification/
│   │   │   │   │   └── classifyLeads.job.ts
│   │   │   │   └── utils/
│   │   │   │       ├── generateFieldMap.job.ts
│   │   │   │       └── scanBDGD.job.ts
│   │   │   ├── utils/
│   │   │   │   └── csvUtils.ts
│   │   │   ├── database/
│   │   │   │   └── prismaClient.ts
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   └── server.ts
│   └── frontend/
│       ├── public/
│       └── src/
│           ├── components/
│           ├── layouts/
│           ├── pages/
│           ├── services/
│           └── styles/
├── infra/
│   ├── db/
│   ├── docker/
│   └── monitoring/
├── packages/
│   ├── api-clients/
│   ├── shared-utils/
├── README.md
```

---

## 🚀 Pipeline de Execução

Todos os scripts abaixo devem ser executados em ordem sequencial para garantir integridade:

1. `importLeadBruto.job.ts` – Importa dados de identificação da unidade consumidora.
2. `importEnergiaDemanda.job.ts` – Insere dados mensais de energia e demanda.
3. `importQuality.job.ts` – Insere indicadores de qualidade (DIC, FIC, sem rede).
4. `enrichLeads.job.ts` – Enriquecimento via APIs externas.
5. `classifyLeads.job.ts` – Classificação por perfil de prioridade.

---

## 📦 Instalação e Execução

```bash
git clone https://github.com/GuilhermeCostaProenca/youon-inteligence.git
cd apps/backend

# .env
DATABASE_URL="file:./dev.db" # ou PostgreSQL URL
GOOGLE_API_KEY=...
CNPJ_API_KEY=...

npm install
npm run dev

# Execução dos scripts em ordem:
npx tsx src/jobs/importers/importLeadBruto.job.ts
npx tsx src/jobs/importers/importEnergiaDemanda.job.ts
npx tsx src/jobs/quality/importQuality.job.ts
npx tsx src/jobs/enrichment/enrichLeads.job.ts
npx tsx src/jobs/classification/classifyLeads.job.ts
```

---

## 📚 Dicionário dos Datasets ANEEL

| Dataset   | Segmento | Tensão | Sigla | Link                                                  |
| --------- | -------- | ------ | ----- | ----------------------------------------------------- |
| UCAT\_tab | C\&I     | Alta   | UCAT  | [Link ANEEL](https://dados.aneel.gov.br/dataset/ucat) |
| UCMT\_tab | C\&I     | Média  | UCMT  | [Link ANEEL](https://dados.aneel.gov.br/dataset/ucmt) |
| UCBT\_tab | C\&I     | Baixa  | UCBT  | [Link ANEEL](https://dados.aneel.gov.br/dataset/ucbt) |

Campos comuns: `COD_ID_ENCR`, `CLAS_SUB`, `GRU_TAR`, `TIP_CC`, `DIST`, `MUN`, `CNPJ`, etc.

---

## 🛠 Requisitos Técnicos

* Node.js 18+
* Prisma ORM
* SQLite (dev) e PostgreSQL (produção)
* React + Tailwind (frontend)
* APIs: CNPJá, Google Maps
* CRON jobs ou scripts agendados

---

## 🧽 Timeline de Desenvolvimento

### ✅ Fase 1: Setup Base

* Estrutura monorepo e pastas
* Tabelas Prisma: `LeadBruto`, `LeadEnergia`, `LeadDemanda`, `LeadQualidade`, `LeadEnriquecido`
* Configuração SQLite

### 📅 Fase 2: Importação ANEEL

* Scripts `importLeadBruto`, `importEnergiaDemanda`, `importQuality`
* Validação de duplicatas e erros

### 🔗 Fase 3: Enriquecimento Inteligente

* APIs externas para CNPJ, CNAE, endereço
* Fallbacks e tratamento de erros

### 🔥 Fase 4: Classificação de Leads

* Algoritmo de HOT/WARM/COLD
* Regras baseadas em consumo, qualidade, perfil econômico

### 🔌 Fase 5: API REST

* Endpoints: `/leads`, `/lead/:id`, filtros e paginação
* Swagger ou Postman

### 🧽 Fase 6: Frontend React

* Mapa interativo com filtros
* Cards de lead com dados técnicos
* Tela detalhada de oportunidades

### 📡 Fase 7: Produção & Escalabilidade

* PostgreSQL na Azure
* Agendamento de jobs
* Monitoramento e logging

### 🌟 Fase 8: Evolução & Versão 2.0

* Docker + Deploy
* LGPD compliance
* Machine Learning para recomendação de solução

---

## 👨‍💼 Desenvolvedor Responsável

**Guilherme Costa Proença**
[GitHub](https://github.com/GuilhermeCostaProenca)

---

## 📎 Licença

MIT – Livre para uso e modificação com créditos.
