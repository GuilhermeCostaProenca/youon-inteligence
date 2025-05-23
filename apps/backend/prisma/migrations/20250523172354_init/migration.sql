-- CreateTable
CREATE TABLE "LeadBruto" (
    "id" TEXT NOT NULL,
    "nomeUc" TEXT,
    "cnpj" TEXT,
    "classe" TEXT,
    "subgrupo" TEXT,
    "modalidade" TEXT,
    "situacao" TEXT,
    "grupoTensao" TEXT,
    "tipoSistema" TEXT,
    "origem" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "distribuidora" TEXT NOT NULL,
    "municipioIbge" TEXT NOT NULL,
    "subestacao" TEXT,
    "bairro" TEXT,
    "cep" TEXT,
    "cnae" TEXT,
    "dataConexao" TIMESTAMP(3),
    "coordenadas" JSONB,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'raw',

    CONSTRAINT "LeadBruto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEnergia" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "ene" INTEGER[],
    "potencia" DOUBLE PRECISION,

    CONSTRAINT "LeadEnergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDemanda" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "demPonta" INTEGER[],
    "demForaPonta" INTEGER[],

    CONSTRAINT "LeadDemanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadQualidade" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dic" INTEGER[],
    "fic" INTEGER[],
    "dec" DOUBLE PRECISION,
    "fec" DOUBLE PRECISION,
    "tensaoOk" DOUBLE PRECISION,

    CONSTRAINT "LeadQualidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEnriquecido" (
    "cnpj" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "razaoSocial" TEXT,
    "tipo" TEXT,
    "porte" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "atividade" TEXT,
    "filiais" INTEGER,

    CONSTRAINT "LeadEnriquecido_pkey" PRIMARY KEY ("cnpj")
);

-- CreateTable
CREATE TABLE "LeadReputacao" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "reclamacoesN1" INTEGER,
    "reclamacoesN2" INTEGER,
    "ouvidoria" INTEGER,
    "iasc" DOUBLE PRECISION,

    CONSTRAINT "LeadReputacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEconomia" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tarifaMedia" DOUBLE PRECISION,
    "beneficioTarifario" TEXT,
    "inadimplencia" DOUBLE PRECISION,
    "perdaDistribuidora" DOUBLE PRECISION,

    CONSTRAINT "LeadEconomia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoInfoLead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipoLocal" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "nomeEstabelecimento" TEXT,

    CONSTRAINT "GeoInfoLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubestacaoInfraestrutura" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipioIbge" TEXT NOT NULL,
    "capacidadeMVA" DOUBLE PRECISION,
    "tensaoPrimariaKV" DOUBLE PRECISION,
    "alimentadores" INTEGER,
    "transformadores" INTEGER,
    "temGeracaoDistribuida" BOOLEAN,

    CONSTRAINT "SubestacaoInfraestrutura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubestacaoIndicadoresHistorico" (
    "id" TEXT NOT NULL,
    "subestacao" TEXT NOT NULL,
    "municipioIbge" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "dicMedio" DOUBLE PRECISION,
    "ficMedio" DOUBLE PRECISION,
    "decMedio" DOUBLE PRECISION,
    "fecMedio" DOUBLE PRECISION,
    "tensaoConforme" DOUBLE PRECISION,
    "iasc" DOUBLE PRECISION,

    CONSTRAINT "SubestacaoIndicadoresHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistribuidoraPerfilHistorico" (
    "id" TEXT NOT NULL,
    "distribuidora" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "decMedio" DOUBLE PRECISION,
    "fecMedio" DOUBLE PRECISION,
    "iasc" DOUBLE PRECISION,
    "inadimplencia" DOUBLE PRECISION,
    "tempoLigacao" DOUBLE PRECISION,
    "perdas" DOUBLE PRECISION,

    CONSTRAINT "DistribuidoraPerfilHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadBruto_cnpj_idx" ON "LeadBruto"("cnpj");

-- CreateIndex
CREATE INDEX "LeadBruto_classe_idx" ON "LeadBruto"("classe");

-- CreateIndex
CREATE INDEX "LeadBruto_segmento_idx" ON "LeadBruto"("segmento");

-- CreateIndex
CREATE INDEX "LeadBruto_distribuidora_idx" ON "LeadBruto"("distribuidora");

-- CreateIndex
CREATE INDEX "LeadBruto_municipioIbge_idx" ON "LeadBruto"("municipioIbge");

-- CreateIndex
CREATE INDEX "LeadBruto_subestacao_idx" ON "LeadBruto"("subestacao");

-- CreateIndex
CREATE INDEX "LeadBruto_cep_idx" ON "LeadBruto"("cep");

-- CreateIndex
CREATE INDEX "LeadBruto_cnae_idx" ON "LeadBruto"("cnae");

-- CreateIndex
CREATE INDEX "LeadBruto_dataConexao_idx" ON "LeadBruto"("dataConexao");

-- CreateIndex
CREATE INDEX "LeadBruto_status_idx" ON "LeadBruto"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEnergia_leadId_key" ON "LeadEnergia"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadDemanda_leadId_key" ON "LeadDemanda"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadQualidade_leadId_key" ON "LeadQualidade"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEnriquecido_leadId_key" ON "LeadEnriquecido"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadReputacao_leadId_key" ON "LeadReputacao"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEconomia_leadId_key" ON "LeadEconomia"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoInfoLead_leadId_key" ON "GeoInfoLead"("leadId");

-- CreateIndex
CREATE INDEX "SubestacaoInfraestrutura_nome_idx" ON "SubestacaoInfraestrutura"("nome");

-- CreateIndex
CREATE INDEX "SubestacaoInfraestrutura_municipioIbge_idx" ON "SubestacaoInfraestrutura"("municipioIbge");

-- CreateIndex
CREATE INDEX "SubestacaoIndicadoresHistorico_subestacao_idx" ON "SubestacaoIndicadoresHistorico"("subestacao");

-- CreateIndex
CREATE INDEX "SubestacaoIndicadoresHistorico_municipioIbge_idx" ON "SubestacaoIndicadoresHistorico"("municipioIbge");

-- CreateIndex
CREATE INDEX "SubestacaoIndicadoresHistorico_ano_idx" ON "SubestacaoIndicadoresHistorico"("ano");

-- CreateIndex
CREATE INDEX "DistribuidoraPerfilHistorico_distribuidora_idx" ON "DistribuidoraPerfilHistorico"("distribuidora");

-- CreateIndex
CREATE INDEX "DistribuidoraPerfilHistorico_ano_idx" ON "DistribuidoraPerfilHistorico"("ano");

-- AddForeignKey
ALTER TABLE "LeadEnergia" ADD CONSTRAINT "LeadEnergia_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDemanda" ADD CONSTRAINT "LeadDemanda_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadQualidade" ADD CONSTRAINT "LeadQualidade_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEnriquecido" ADD CONSTRAINT "LeadEnriquecido_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReputacao" ADD CONSTRAINT "LeadReputacao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEconomia" ADD CONSTRAINT "LeadEconomia_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeoInfoLead" ADD CONSTRAINT "GeoInfoLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "LeadBruto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
