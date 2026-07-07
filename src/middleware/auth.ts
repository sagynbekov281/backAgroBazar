import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export const JWT_SECRET = process.env.JWT_SECRET || 'agrobazar_dev_secret_2025';
export interface AR extends Request { userId?: string; }

export function auth(req: AR, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Авторизация талап кылынат' });
  try { const p = jwt.verify(h.slice(7), JWT_SECRET) as { userId: string }; req.userId = p.userId; next(); }
  catch { return res.status(401).json({ message: 'Токен жараксыз' }); }
}

export function optAuth(req: AR, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) { try { const p = jwt.verify(h.slice(7), JWT_SECRET) as { userId: string }; req.userId = p.userId; } catch {} }
  next();
}
