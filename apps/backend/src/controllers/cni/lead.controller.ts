import { Request, Response } from 'express';
import { prisma } from '../../database/prismaClient';

export const getAllLeads = async (_req: Request, res: Response) => {
  try {
    const leads = await prisma.leadBruto.findMany();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar leads.', error });
  }
};
