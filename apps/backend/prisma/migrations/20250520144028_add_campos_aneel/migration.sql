/*
  Warnings:

  - Added the required column `codigoDistribuidora` to the `LeadBruto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeUc` to the `LeadBruto` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeadBruto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeUc" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "subclasse" TEXT,
    "grupoTensao" TEXT,
    "modalidade" TEXT,
    "codigoDistribuidora" TEXT NOT NULL,
    "distribuidora" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "dataConexao" DATETIME,
    "dataAtualizacao" DATETIME,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'raw'
);
INSERT INTO "new_LeadBruto" ("classe", "dataConexao", "dataImportacao", "distribuidora", "estado", "grupoTensao", "id", "latitude", "longitude", "modalidade", "municipio", "subclasse") SELECT "classe", "dataConexao", "dataImportacao", "distribuidora", "estado", "grupoTensao", "id", "latitude", "longitude", "modalidade", "municipio", "subclasse" FROM "LeadBruto";
DROP TABLE "LeadBruto";
ALTER TABLE "new_LeadBruto" RENAME TO "LeadBruto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
