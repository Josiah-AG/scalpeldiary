import { AsyncLocalStorage } from 'async_hooks';
import { PoolClient } from 'pg';
import { RequestHandler } from 'express';
import pool from './db';
export const transactionContext = new AsyncLocalStorage<PoolClient>();
// Buffer JSON until COMMIT; a caught route error must roll back earlier writes.
export function transactional(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    if (transactionContext.getStore()) return handler(req, res, next);
    let client: PoolClient | undefined;
    const original = res.json.bind(res);
    let payload: any; let responded = false;
    res.json = ((body: any) => { payload = body; responded = true; return res; }) as any;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await transactionContext.run(client, async () => { await handler(req, res, next); });
      if (res.statusCode < 400 && (req as any).user && (req.originalUrl.startsWith('/api/users') || req.originalUrl.startsWith('/api/auth/change-password'))) {
        await client.query('INSERT INTO security_audit(actor_id,action) VALUES($1,$2)',[(req as any).user.id, req.method+' '+req.path]);
      }
      const completion = await client.query(res.statusCode >= 400 ? 'ROLLBACK' : 'COMMIT');
      if (res.statusCode < 400 && completion.command !== 'COMMIT') throw new Error('Transaction did not commit');
      res.json = original;
      if (responded) original(payload);
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      res.json = original;
      next(error);
    } finally { client?.release(); }
  };
}
