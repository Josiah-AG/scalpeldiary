import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { residentResponse } from '../security/policy';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const result = await query('SELECT id, email, name, role, is_suspended, token_version FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user || user.is_suspended || (decoded.version || 0) !== user.token_version) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    req.user = user;
    res.setHeader('Cache-Control', 'no-store');
    if (user.role === 'RESIDENT') {
      const json = res.json.bind(res);
      res.json = ((body: any) => json(residentResponse(body, user.id))) as any;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
