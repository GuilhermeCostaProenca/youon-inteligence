import express from 'express';
import cors from 'cors';
import { leadRoutes } from './api/cni/lead.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/cni', leadRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
