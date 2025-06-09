# Backend

Este diretório contém os jobs de importação e a API Express utilizada no projeto.

## Instalação

```bash
cd apps/backend
npm install
```

Configure as variáveis de ambiente baseando-se em `.env.example` e execute as migrações do Prisma:

```bash
npm run migrate
```

## Executando os jobs

Para rodar todo o pipeline de importação em sequência:

```bash
npm run import:tudo
```

Cada job também pode ser executado individualmente usando os scripts definidos em `package.json`.
