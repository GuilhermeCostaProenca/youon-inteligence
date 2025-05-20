import { importarDadosANEEL } from "./integrations/aneel/importJob";

importarDadosANEEL().then(() => {
  console.log("✅ Script encerrado.");
  process.exit(0);
});
