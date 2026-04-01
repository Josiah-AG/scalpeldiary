import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: silently log activity (never throws — won't break existing flows)
export async function logActivity(userId: number | string, actionType: string, metadata?: string) {
  try {
    await query(
      'INSERT INTO user_activity (user_id, action_type, metadata, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, actionType, metadata || null]
    );
  } catch (e) {
    // Silent — never disrupt existing functionality
  }
}

// Helper: silently log login session
export async function logLoginSession(userId: number | string, deviceFingerprint: string, deviceInfo: string, ipAddress: string) {
  try {
    await query(
      'INSERT INTO login_sessions (user_id, device_fingerprint, device_info, ip_address, login_time) VALUES ($1, $2, $3, $4, NOW())',
      [userId, deviceFingerprint, deviceInfo, ipAddress]
    );
  } catch (e) {
    // Silent — never disrupt login
  }
}

// GET /activity-monitor/summary — Dashboard card data (Master only)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Forbidden' });
  try {
    // Active users (logged in last 7 days)
    const activeResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count FROM login_sessions WHERE login_time > NOW() - INTERVAL '7 days'`
    );
    // Total logins this week
    const loginsResult = await query(
      `SELECT COUNT(*) as count FROM login_sessions WHERE login_time > NOW() - INTERVAL '7 days'`
    );
    // Suspicious devices (same fingerprint used by different roles)
    const suspiciousResult = await query(
      `SELECT COUNT(*) as count FROM (
        SELECT device_fingerprint FROM login_sessions ls
        JOIN users u ON ls.user_id = u.id
        WHERE ls.login_time > NOW() - INTERVAL '30 days'
        GROUP BY device_fingerprint
        HAVING COUNT(DISTINCT u.role) > 1 AND COUNT(DISTINCT ls.user_id) > 1
      ) sub`
    );
    res.json({
      activeUsersLast7Days: parseInt(activeResult.rows[0]?.count || '0'),
      totalLoginsLast7Days: parseInt(loginsResult.rows[0]?.count || '0'),
      suspiciousDevices: parseInt(suspiciousResult.rows[0]?.count || '0'),
    });
  } catch (e) {
    // If tables don't exist yet, return zeros
    res.json({ activeUsersLast7Days: 0, totalLoginsLast7Days: 0, suspiciousDevices: 0 });
  }
});

// GET /activity-monitor/device-sessions — All login sessions (Master only)
router.get('/device-sessions', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      `SELECT ls.*, u.name, u.email, u.role
       FROM login_sessions ls
       JOIN users u ON ls.user_id = u.id
       ORDER BY ls.login_time DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (e) {
    res.json([]);
  }
});

// GET /activity-monitor/suspicious — Cross-account device alerts (Master only)
router.get('/suspicious', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      `SELECT ls.device_fingerprint, ls.device_info,
              json_agg(json_build_object('user_id', u.id, 'name', u.name, 'role', u.role, 'email', u.email, 'login_time', ls.login_time)) as users
       FROM login_sessions ls
       JOIN users u ON ls.user_id = u.id
       WHERE ls.login_time > NOW() - INTERVAL '30 days'
       AND ls.device_fingerprint IN (
         SELECT device_fingerprint FROM login_sessions ls2
         JOIN users u2 ON ls2.user_id = u2.id
         WHERE ls2.login_time > NOW() - INTERVAL '30 days'
         GROUP BY device_fingerprint
         HAVING COUNT(DISTINCT u2.role) > 1 AND COUNT(DISTINCT ls2.user_id) > 1
       )
       GROUP BY ls.device_fingerprint, ls.device_info
       ORDER BY MAX(ls.login_time) DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.json([]);
  }
});

// GET /activity-monitor/resident-activity — Resident engagement (Master only)
router.get('/resident-activity', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email,
              (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) as current_year,
              (SELECT MAX(login_time) FROM login_sessions WHERE user_id = u.id) as last_login,
              (SELECT COUNT(*) FROM surgical_logs WHERE resident_id = u.id AND date >= date_trunc('month', NOW())) as procedures_this_month,
              (SELECT COUNT(*) FROM presentations WHERE resident_id = u.id AND date >= date_trunc('month', NOW())) as presentations_this_month
       FROM users u
       WHERE u.role = 'RESIDENT' AND u.is_suspended = false
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (e) {
    res.json([]);
  }
});

// GET /activity-monitor/supervisor-responsiveness — Supervisor rating speed (Master only)
router.get('/supervisor-responsiveness', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'MASTER') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email,
              (SELECT MAX(login_time) FROM login_sessions WHERE user_id = u.id) as last_login,
              (SELECT COUNT(*) FROM surgical_logs WHERE supervisor_id = u.id AND rating IS NULL AND status = 'PENDING') as pending_procedures,
              (SELECT COUNT(*) FROM presentations WHERE supervisor_id = u.id AND rating IS NULL AND status = 'PENDING') as pending_presentations,
              (SELECT COUNT(*) FROM surgical_logs WHERE supervisor_id = u.id AND rating IS NOT NULL AND date >= date_trunc('month', NOW())) as rated_this_month,
              (SELECT COUNT(*) FROM presentations WHERE supervisor_id = u.id AND rating IS NOT NULL AND date >= date_trunc('month', NOW())) as presentations_rated_this_month
       FROM users u
       WHERE u.role = 'SUPERVISOR' AND u.is_suspended = false
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (e) {
    res.json([]);
  }
});

export default router;
