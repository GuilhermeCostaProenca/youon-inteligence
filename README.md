📘 README.md — Projeto Youon Intelligence
md
Copiar
Editar
# Youon Intelligence – Plataforma de Inteligência Comercial para o Setor de Energia

Bem-vindo à plataforma **Youon Intelligence**, uma solução robusta e escalável voltada para mapeamento, enriquecimento e priorização de leads estratégicos no setor de energia brasileiro. O sistema coleta e cruza dados da ANEEL com APIs externas como CNPJá e Google Maps, alimentando um pipeline de inteligência comercial dividido por segmentos: **C&I (Comercial e Industrial)**, **Home** (futuro), e **GTD** (Governamental e Grandes Consumidores).

---

## 🧠 Visão Geral

- 📥 Importação automatizada de dados públicos da ANEEL (BDGD);
- 🧠 Enriquecimento com dados de CNPJ, localização, CNAE e nome fantasia;
- 🔎 Classificação inteligente dos leads em HOT, WARM ou COLD;
- 🗺️ Visualização futura em mapas com filtros por região, prioridade e segmento;
- 🔧 Sugestão futura de soluções ideais baseadas em consumo, demanda e qualidade.

---

## 🧱 Estrutura Final de Pastas

```bash
youon-inteligence/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── cni/
│   │   │   ├── controllers/
│   │   │   │   └── cni/
│   │   │   ├── services/
│   │   │   ├── jobs/
│   │   │   │   ├── importLeadBruto.job.ts
│   │   │   │   ├── importEnergiaDemanda.job.ts
│   │   │   │   ├── importQualidade.job.ts
│   │   │   │   ├── enrichLeads.job.ts
│   │   │   │   └── classifyLeads.job.ts
│   │   │   ├── middlewares/
│   │   │   ├── utils/
│   │   │   ├── database/
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   ├── data/
│   │   └── docs/
│   └── frontend/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── styles/
│       │   └── App.tsx
│       └── tailwind.config.ts
🚀 Pipeline de Execução
Todos os scripts abaixo devem ser executados em ordem sequencial para garantir integridade.

importLeadBruto.job.ts

Importa dados de identificação da unidade consumidora.

importEnergiaDemanda.job.ts

Insere dados mensais de energia e demanda.

importQualidade.job.ts

Insere indicadores de qualidade (DIC, FIC, sem rede).

enrichLeads.job.ts

Enriquecimento via APIs externas.

classifyLeads.job.ts

Classificação por perfil de prioridade.

📦 Instalação e Execução
bash
Copiar
Editar
git clone https://github.com/GuilhermeCostaProenca/youon-inteligence.git
cd apps/backend

# .env com:
DATABASE_URL="file:./dev.db" # ou PostgreSQL URL
GOOGLE_API_KEY=...
CNPJ_API_KEY=...

npm install
npm run dev

# Execução dos scripts em ordem
npx tsx src/jobs/importLeadBruto.job.ts
npx tsx src/jobs/importEnergiaDemanda.job.ts
npx tsx src/jobs/importQualidade.job.ts
npx tsx src/jobs/enrichLeads.job.ts
npx tsx src/jobs/classifyLeads.job.ts
📚 Dicionário dos Datasets ANEEL
Dataset	Segmento	Tensão	Sigla	Link
UCAT_tab	C&I	Alta	UCAT	Link ANEEL
UCMT_tab	C&I	Média	UCMT	Link ANEEL
UCBT_tab	C&I	Baixa	UCBT	Link ANEEL

Campos comuns: COD_ID_ENCR, CLAS_SUB, GRU_TAR, TIP_CC, DIST, MUN, CNPJ, etc.

🛠 Requisitos Técnicos
Node.js 18+

Prisma ORM

SQLite (dev) e PostgreSQL (produção)

React + Tailwind (frontend)

APIs: CNPJá, Google Maps

CRON jobs ou scripts agendados

🧭 Timeline de Desenvolvimento
✅ Fase 1: Setup Base
Estrutura monorepo e pastas

Tabelas Prisma: LeadBruto, LeadEnergia, LeadDemanda, LeadQualidade, LeadEnriquecido

Configuração SQLite

📥 Fase 2: Importação ANEEL
Scripts importLeadBruto, importEnergiaDemanda, importQualidade

Validação de duplicatas e erros

🔗 Fase 3: Enriquecimento Inteligente
APIs externas para CNPJ, CNAE, endereço

Fallbacks e tratamento de erros

🔥 Fase 4: Classificação de Leads
Algoritmo de HOT/WARM/COLD

Regras baseadas em consumo, qualidade, perfil econômico

🔌 Fase 5: API REST
Endpoints: /leads, /lead/:id, filtros e paginação

Swagger ou Postman

🧭 Fase 6: Frontend React
Mapa interativo com filtros

Cards de lead com dados técnicos

Tela detalhada de oportunidades

📡 Fase 7: Produção & Escalabilidade
PostgreSQL na Azure

Agendamento de jobs

Monitoramento e logging

🎯 Fase 8: Evolução & Versão 2.0
Docker + Deploy

LGPD compliance

Machine Learning para recomendação de solução

👨‍💻 Desenvolvedor Responsável
Guilherme Costa Proença
GitHub

📎 Licença
MIT – Livre para uso e modificação com créditos.

