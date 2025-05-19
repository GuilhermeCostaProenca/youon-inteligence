-- CreateTable
CREATE TABLE "LeadBruto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classe" TEXT NOT NULL,
    "subclasse" TEXT,
    "grupoTensao" TEXT,
    "modalidade" TEXT,
    "distribuidora" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "dataConexao" DATETIME,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
