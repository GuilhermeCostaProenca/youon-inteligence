import { Router } from 'express';
import { getAllLeads } from '../../controllers/cni/lead.controller';

export const leadRoutes = Router();

leadRoutes.get('/leads', getAllLeads);
