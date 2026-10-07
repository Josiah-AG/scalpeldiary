import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Request failed', {path:req.path, type:(err as any).code || err.name});
  const status = (err as any).status === 413 ? 413 : 500;
  res.status(status).json({ error: status === 413 ? 'File too large; maximum image size is 2 MB' : 'Internal server error' });
};
