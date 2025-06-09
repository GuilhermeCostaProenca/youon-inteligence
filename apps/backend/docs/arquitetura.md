# Visão de Arquitetura

O projeto segue uma estrutura de jobs em camadas. Os dados da ANEEL são
importados via **jobs/importers**, normalizados em **jobs/enrichment** e depois
classificados. Os serviços expostos pelo Express acessam o banco de dados via
Prisma. Futuramente a aplicação será dividida em múltiplos pacotes, mas por
hora todo o backend reside em `apps/backend`.

```
importers -> enrichment -> quality -> classification -> API
```
