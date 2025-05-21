# 📘 Youon Intelligence - Dicionário de Datasets ANEEL

Este documento é o guia oficial de referência para todos os dados públicos utilizados no projeto **Youon Intelligence**. Ele tem como objetivos:

* Servir como **base técnica** de apoio ao desenvolvimento
* Apresentar os dados para a **liderança** da You.on
* Ajudar na **decisão sobre quais campos** usar no banco de dados
* Ser um **pipeline vivo**: sempre que um novo dataset for adicionado, ele será documentado aqui

---

## 🔄 Pipeline de Coleta e Processamento

1. **Download automatizado** de arquivos `.csv` e `.zip` (via script)
2. **Extração de colunas** automaticamente dos cabeçalhos
3. **Organização dos dados** por origem e tipo
4. **Processamento posterior** para enriquecer, normalizar e importar no banco

Todos os dados são armazenados temporariamente e apagados após leitura. Os metadados (colunas, links, origem) são mantidos no arquivo `datasets.json`.

---

## 📦 Tabelas Mapeadas

### 1. `UCAT_tab` - Unidade Consumidora AT (Alta Tensão)

* **Link**: [ucat\_pj.csv](https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/f6671cba-f269-42ef-8eb3-62cb3bfa0b98/download/ucat_pj.csv)
* **Origem**: C\&I
* **Formato**: CSV
* **Campos**: 76 colunas, incluindo:

  * `CNAE`, `CLAS_SUB`, `GRU_TAR`: perfil da unidade consumidora
  * `ENE_01` a `ENE_12`: consumo mensal
  * `DEM_01` a `DEM_12`: demanda mensal
  * `DIC_*`, `FIC_*`: indicadores de continuidade
  * `POINT_X`, `POINT_Y`: localização geográfica

### 2. `UCMT_tab` - Unidade Consumidora MT (Média Tensão)

* **Link**: [ucmt\_pj.csv](https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/f6671cba-f269-42ef-8eb3-62cb3bfa0b98/download/ucmt_pj.csv)
* **Origem**: C\&I
* **Formato**: CSV
* **Observação**: estrutura idêntica à `UCAT_tab`

### 3. `UCBT_tab` - Unidade Consumidora BT (Baixa Tensão)

* **Link**: [ucbt\_pj.zip](https://dadosabertos.aneel.gov.br/dataset/4459e483-451f-4444-8022-bd8b5eac05c5/resource/3ae4d382-7072-4b08-90a4-dcd187a2eae2/download/ucbt_pj.zip)
* **Origem**: C\&I
* **Formato**: ZIP contendo CSV
* **Campos adicionais**: inclui `RAMAL`, `UNI_TR_MT`, e `OBJECTID`

---

## 🔎 Dicionário de Colunas (Principais)

| Coluna              | Significado                                               |
| ------------------- | --------------------------------------------------------- |
| `CNAE`              | Classificação da Atividade Econômica da unidade           |
| `CLAS_SUB`          | Classe/Subclasse (ex: industrial, comercial, residencial) |
| `GRU_TAR`           | Grupo tarifário da unidade (ex: A3, B1)                   |
| `DAT_CON`           | Data de conexão                                           |
| `ENE_01`...`ENE_12` | Energia consumida (kWh) em cada mês do ano                |
| `DEM_01`...`DEM_12` | Demanda (kW) em cada mês do ano                           |
| `DIC_01`...`DIC_12` | Duração de interrupções mensais (DEC)                     |
| `FIC_01`...`FIC_12` | Frequência de interrupções mensais (FEC)                  |
| `SEMRED`            | Indica se está em região sem rede (isolada)               |
| `POINT_X/Y`         | Coordenadas geográficas (longitude/latitude)              |
| `TIP_SIST`          | Tipo de sistema (ex: interligado, isolado)                |
| `ARE_LOC`           | Área local (usada para agrupamento regional)              |
| `CAR_INST`          | Característica da instalação (potência instalada)         |

Este dicionário será expandido conforme novas tabelas forem inseridas.

---

## 📁 Localização no Projeto

* Pasta dos scripts: `apps/backend/scripts/`
* Arquivo principal de coleta: `scanBDGD.ts`
* Saída automática: `datasets.json`
* Pasta temporária de downloads: `apps/backend/downloads/`

---

## 🧠 Notas finais

* Os dados extraídos dessas tabelas alimentam a base de **leads brutos**.
* Enriquecimentos futuros serão feitos com APIs externas (ReceitaWS, CNPJa, etc)
* Classificações como "lead quente", "arbitragem", "backup", etc, virão depois
* Este README é um **documento vivo**: qualquer tabela nova, adicione aqui!

---

Se precisar automatizar isso, o script `scanBDGD.ts` está pronto para evoluir com você.

> *Youon Intelligence. Dados bons. Leads certos.*
