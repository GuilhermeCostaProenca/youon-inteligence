# Youon Intelligence – Plataforma de Mapeamento de Leads Estratégicos no Setor de Energia

Bem-vindo ao projeto **Youon Intelligence**, uma plataforma modular e escalável voltada para o mapeamento, enriquecimento e análise de leads estratégicos do setor de energia no Brasil. Esta plataforma integra dados públicos da ANEEL, APIs externas (como CNPJá e Google Maps) e algoritmos de classificação para entregar inteligência comercial de alto nível para os segmentos **C&I (Comercial e Industrial)** e, futuramente, **Home**, **GTD** e outros.

---

## Visão Geral

O sistema realiza:

- **Importação automatizada** de datasets públicos da ANEEL.
- **Armazenamento estruturado** em banco de dados relacional (PostgreSQL).
- **Enriquecimento de dados** com APIs públicas (CNPJ, localização, categoria econômica, etc.).
- **Classificação dos leads** com base em consumo, qualidade e perfil.
- **Visualização futura** dos leads em mapa interativo com filtros por região, segmento e prioridade.
- **Sugestão futura de soluções energéticas** com base em perfil técnico e tarifário.

---

## Pipeline de Execução (Ordem Obrigatória)

> Cada script deve ser executado **em ordem** para que os dados fluam corretamente e não quebrem dependências.

### 1. `importLeadBruto.job.ts`
- **Função:** Baixa os datasets (UCAT, UCMT, UCBT), extrai os dados principais de identificação e insere na tabela `LeadBruto`.
- **Output:** Leads brutos com campos: nomeUc, classe, grupoTensao, modalidade, tipoEnergia, distribuidora, município, UF, CNPJ, etc.

### 2. `importEnergiaDemanda.job.ts`
- **Função:** Lê os mesmos CSVs e insere dados de energia e demanda mensal nas tabelas `LeadEnergia` e `LeadDemanda`.
- **Requisitos:** Leads precisam já existir na tabela `LeadBruto`.

### 3. `importQualidade.job.ts`
- **Função:** Lê dados de DIC, FIC e outros indicadores de qualidade por lead e insere em `LeadQualidade`.
- **Nota:** Também verifica ausência de rede e marca `semRede`.

### 4. `enrichLeads.job.ts`
- **Função:** Enriquecer cada lead com base no CNPJ usando APIs externas (ex: nome fantasia, CNAE, endereço completo).
- **Output:** Tabela `LeadEnriquecido` + update do status do lead para `enriquecido`.

### 5. `classifyLeads.job.ts`
- **Função:** Classifica leads em categorias HOT, WARM e COLD com base nos dados internos e externos.
- **Output:** Campo `classificacao` em `LeadBruto` preenchido.

---

## Estrutura Final de Pastas

```bash
apps/
└── backend/
    ├── src/
    │   ├── api/                   # Rotas Express
    │   │   ├── cni/               # Rotas para leads comerciais e industriais
    │   │   └── ...                # Futuros segmentos: home/, gtd/
    │   ├── controllers/          # Regras de negócio das rotas
    │   │   └── cni/               # Ex: lead.controller.ts
    │   ├── services/             # Integrações com APIs externas
    │   │   ├── cnpj.service.ts
    │   │   ├── google.service.ts
    │   │   └── aneel.service.ts
    │   ├── jobs/                 # Scripts de automação executados em ordem
    │   │   ├── importLeadBruto.job.ts
    │   │   ├── importEnergiaDemanda.job.ts
    │   │   ├── importQualidade.job.ts
    │   │   ├── enrichLeads.job.ts
    │   │   └── classifyLeads.job.ts
    │   ├── middlewares/          # Segurança, erros e logs (futuro)
    │   ├── utils/                # Funções auxiliares
    │   │   ├── csvUtils.ts
    │   │   └── calcUtils.ts
    │   ├── database/
    │   │   ├── prismaClient.ts
    │   │   └── seed.ts (opcional)
    │   └── server.ts             # Inicialização da API Express
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── data/
    │   ├── datasets.json               # Lista dos datasets usados (gerado)
    │   ├── dataset_campos_map.json    # Mapeamento de colunas para campos
    │   └── downloads/                 # CSVs temporários (ignorar no git)
    └── docs/
        ├── README.md
        └── DicionarioDatasetsANEEL.md
Instruções de Execução
Clone o repositório:

bash
Copiar
Editar
git clone https://github.com/GuilhermeCostaProenca/youon-inteligence.git
cd youon-inteligence/apps/backend
Crie o arquivo .env com a seguinte estrutura:

env
Copiar
Editar
DATABASE_URL="file:./dev.db" # ou URL PostgreSQL em produção
GOOGLE_API_KEY=...
CNPJ_API_KEY=...
Instale as dependências:

bash
Copiar
Editar
npm install
Execute a API:

bash
Copiar
Editar
npm run dev
Execute os scripts na ordem:

bash
Copiar
Editar
npx tsx src/jobs/importLeadBruto.job.ts
npx tsx src/jobs/importEnergiaDemanda.job.ts
npx tsx src/jobs/importQualidade.job.ts
npx tsx src/jobs/enrichLeads.job.ts
npx tsx src/jobs/classifyLeads.job.ts
Dicionário dos Datasets ANEEL
Dataset	Origem	Tipo de Unidade	Sigla	Link Direto
UCAT_tab	ANEEL – BDGD	Alta Tensão – Empresas	C&I	https://dados.aneel.gov.br/dataset/ucat
UCMT_tab	ANEEL – BDGD	Média Tensão	C&I	https://dados.aneel.gov.br/dataset/ucmt
UCBT_tab	ANEEL – BDGD	Baixa Tensão	C&I	https://dados.aneel.gov.br/dataset/ucbt

Todos os arquivos possuem colunas como: COD_ID_ENCR, CLAS_SUB, GRU_TAR, TIP_CC, DIST, MUN, CNPJ, etc.

Requisitos Técnicos
Node.js v18+

PostgreSQL (desenvolvimento em SQLite, produção PostgreSQL)

Prisma como ORM

React/Next.js (frontend, futuro)

API externa: CNPJá, Google Maps API (geocoding, place details)

Orquestração: Pipeline manual ou agendado via CRON

Futuro do Projeto
Integração com segmentos Home e GTD

Mapa interativo com leads filtráveis por região e prioridade

Dashboard comercial e técnico (gráficos, indicadores, relatórios)

API REST completa com autenticação

Deploy Azure + monitoramento

Algoritmo de sugestão de solução ideal por lead

Machine Learning para predição de conversão e perfil

Desenvolvedor Responsável
Guilherme Costa Proença

Se tiver dúvidas, sugestões ou quiser contribuir, entre em contato!


Timeline de Desenvolvimento – Youon Intelligence
Fase 1: Estruturação Base (Arquitetura e Setup)
Objetivo: Deixar o projeto organizado, escalável e com base sólida antes de crescer.

 Criar estrutura de pastas definitiva (seguindo o README)

 Definir todas as tabelas no Prisma (LeadBruto, LeadEnergia, LeadDemanda, LeadQualidade, LeadEnriquecido)

 Documentar o dicionário de datasets da ANEEL

 Organizar scripts em /jobs/ e utilitários em /utils/

 Criar e preencher .env com variáveis seguras

 Configurar Prisma (migrate + client) com SQLite local (pré-Postgres)

Fase 2: Pipeline ANEEL (Importação de Dados Públicos)
Objetivo: Coletar, organizar e armazenar todos os dados oficiais.

 importLeadBruto.job.ts – Baixar os CSVs e importar leads brutos (UCAT, UCMT, UCBT)

 importEnergiaDemanda.job.ts – Importar dados de energia e demanda mensal

 importQualidade.job.ts – Importar DIC, FIC e outros indicadores técnicos

 Validação de duplicatas e qualidade de dados (logar erros)

Fase 3: Enriquecimento Inteligente (APIs Externas)
Objetivo: Dar contexto e informação útil ao lead bruto.

 enrichLeads.job.ts – Buscar CNPJ, nome fantasia, CNAE, endereço completo

 Criar serviço para Google Maps (nome de estabelecimento, tipo de negócio)

 Criar estrutura de fallback para dados incompletos (ex: CNPJ inválido)

 Atualizar status dos leads enriquecidos

Fase 4: Classificação Estratégica dos Leads
Objetivo: Priorizar oportunidades para o time comercial com base em perfil.

 classifyLeads.job.ts – Aplicar lógica de classificação (HOT/WARM/COLD)

 Criar regras baseadas em: consumo, demanda, qualidade, tipo de negócio

 Criar tabela ou campo classificacao no lead

 Gerar relatório de leads classificados por região

Fase 5: API REST + Visualização
Objetivo: Expor dados ao front-end e montar interface de uso real.

 Criar rotas REST com filtros e paginação (GET /leads, /lead/:id)

 Endpoint consolidado com dados enriquecidos e indicadores

 Aplicar CORS, logging, middleware de erro

 Configurar Swagger ou Postman collection

Fase 6: Front-end com React/Next.js
Objetivo: Visualizar tudo de forma interativa e usável.

 Setup do front-end (apps/frontend)

 Tela de dashboard com mapa interativo

 Filtros por classificação, cidade, distribuidora, segmento

 Telas de lead individual com dados técnicos e sugestões

Fase 7: Produção e Escalabilidade
Objetivo: Tornar a plataforma utilizável em escala real.

 Migrar banco para PostgreSQL (Azure)

 Rodar jobs por agendador (CRON ou agendador interno)

 Automatizar limpeza de dados antigos/desnecessários

 Estudar Machine Learning para previsão e recomendação

 Conformidade com LGPD (restrições, segurança, criptografia)

Fase 8: Entrega e Evolução
Objetivo: Manter, escalar, documentar e impressionar.

 Finalizar documentação técnica e instruções de uso

 Gravar vídeo de apresentação ou preparar pitch deck

 Validar com engenharia e time comercial

 Preparar versão 2.0 com recursos extras

 (Opcional) Automatizar versão beta com Docker + deploy

