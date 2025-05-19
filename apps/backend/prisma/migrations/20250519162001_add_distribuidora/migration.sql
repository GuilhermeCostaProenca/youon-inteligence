/*
  Warnings:

  - You are about to drop the `LeadBruto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LeadBruto";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Distribuidora" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "regiao" TEXT,
    "uf" TEXT NOT NULL,
    "cnpj" TEXT,
    "outorga" TEXT,
    "tipo" TEXT,
    "grupo" TEXT,
    "subgrupo" TEXT,
    "classe" TEXT
);
