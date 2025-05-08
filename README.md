# Projeto: Plataforma de Mapeamento Estratégico de Leads Energéticos (You.on)

## Visão Geral

Este projeto tem como objetivo construir uma plataforma completa de inteligência comercial para o setor de energia, com foco inicial em leads C\&I (Comercial e Industrial). A solução será capaz de coletar dados de forma automática, enriquecer com informações externas, classificar os leads e recomendar soluções ideais com base em parâmetros técnicos e comerciais.

A base dos dados vem da **API pública da ANEEL**, com suporte para expansão futura para outros segmentos como ROM (Residencial, Off-grid, Microgeração) e GTD (Governo, Agro, Grandes Clientes).

## Tecnologias utilizadas

* **Node.js + Express** – Backend principal da aplicação
* **Prisma ORM** – Interface com banco de dados PostgreSQL na Azure
* **PostgreSQL (Azure)** – Banco de dados escalável e seguro
* **Google Maps API** – Enriquecimento de leads com nome, tipo e localização comercial
* **API da ANEEL** – Fonte principal de dados regulatórios e técnicos

---

## Estrutura de Pastas (Arquitetura Modular e Escalável)

```
youon-inteligencia/
│
├── apps/
│   ├── backend/                 # Backend com Node.js, Express e Prisma
│   │   ├── src/
│   │   │   ├── api/             # Rotas REST divididas por segmento
│   │   │   │   ├── cni/         # Comercial & Industrial
│   │   │   │   ├── home/         # Residencial / Microgeração
│   │   │   │   └── gtd/         # Governo, Agro, Grandes Players
│   │   │   ├── controllers/     # Regras de negócio (ex: classificação, enriquecimento)
│   │   │   ├── services/        # Conexões com APIs externas (ANEEL, Google, ReclameAqui)
│   │   │   ├── models/          # Modelos de dados Prisma (leads, tarifas, etc)
│   │   │   ├── jobs/            # Scripts agendados (cron) para coleta mensal de dados
│   │   │   ├── middlewares/     # Logs, segurança, tratamento de erros
│   │   │   ├── utils/           # Funções auxiliares reutilizáveis
│   │   │   ├── database/        # Inicialização do banco, seeds, helpers SQL
│   │   │   └── server.ts        # Arquivo principal do Express
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Modelagem dos dados com Prisma
│   │   │   └── migrations/      # Histórico de mudanças do banco
│   │   ├── .env
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                # Futuro: Next.js com Tailwind para dashboard
│       ├── public/
│       ├── src/
│       │   ├── components/      # UI reutilizável
│       │   ├── pages/           # Rotas da aplicação
│       │   ├── layouts/         # Estrutura de layout global
│       │   └── services/        # Comunicação com a API
│       ├── .env.local
│       ├── package.json
│       └── tailwind.config.js
│
├── packages/                    # Módulos reutilizáveis
│   ├── shared-utils/           # Utilitários JS/TS para uso em vários lugares
│   └── api-clients/            # Clients das APIs públicas que a plataforma usa
│
├── infra/
│   ├── db/                     # Scripts SQL, dumps, backups
│   ├── docker/                 # Dockerfile, docker-compose.yml
│   └── monitoring/            # Logs, rastreadores, alertas automáticos
│
├── docs/                       # Documentação do projeto
│   ├── arquitetura.md
│   ├── dados-externos.md
│   └── api-endpoints.md
│
├── README.md                   # Este documento
└── .gitignore
```

---

## Etapas do Fluxo

### 1. Leads brutos

* Extraídos da API da ANEEL (classe Comercial/Industrial, localização, grupo de tensão)
* Salvos na tabela `leads_brutos_aneel`

### 2. Enriquecimento externo

* Google Maps → nome do comércio, tipo de estabelecimento
* Reclame Aqui → reputação e notas
* ANEEL (outros datasets) → tarifas (TUSD/TE), indicadores DEC, FEC, DIC, FIC
* Resultado final salvo na tabela `leads_enriquecidos`

### 3. Classificação automática

* Regras internas para definir se é um lead **HOT**, **WARM** ou **COLD**
* Considera tarifas, frequência de quedas, perfil de consumo, tipo de cliente

### 4. Sugestão de solução

* Recomendação automática: **UFV**, **híbrido**, **bateria isolada**, **backup**, etc.

---

## Visão futura

* Suporte para novos segmentos: Home (residencial, off-grid), GTD (governo, agro)
* Dashboard interativo com mapa do Brasil e filtros visuais
* Notificações automáticas quando leads mudarem de classificação (ex: de Warm para Hot)
* Painel de administração com histórico de análise de cada lead
* Deploy escalável na Azure, com monitoramento e rastreamento de jobs

---

## Requisitos para rodar localmente (Requisitos do Projeto)

* Node.js v18+
* PostgreSQL (Azure ou local)
* Prisma instalado globalmente (ou via npx)
* Conta na Google Cloud (para usar Google Maps API)
* Conta da Azure com PostgreSQL configurado
* Variáveis de ambiente:

```env
DATABASE_URL=postgresql://<usuario>:<senha>@<host>:<porta>/<db>
GOOGLE_API_KEY=xxxxxx
ANEEL_API_BASE=https://dadosabertos.aneel.gov.br
```

---

## Instruções para subir local

```bash
cd apps/backend
npm install
npx prisma migrate dev --name init
npx prisma db seed (opcional)
npm run dev
```

---

Se houver dúvidas ou sugestões, entre em contato com os desenvolvedores do projeto.

Desenvolvido por: Guilherme Costa Proença & Co-Worker (ChatGPT 🤖)

Versão inicial: C\&I - 2025
