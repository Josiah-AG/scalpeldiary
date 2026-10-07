import { transactional } from '../database/transaction';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logLoginSession, logActivity } from './activity-monitor';

const router = Router();

router.post('/login', transactional(async (req, res) => {
  try {
    const { email, password, deviceFingerprint, deviceInfo, isPWA } = req.body;



    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );



    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_suspended) return res.status(401).json({ error: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.password);



    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, version: user.token_version || 0 },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );



    // Silent activity tracking — never blocks login
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    await logLoginSession(user.id, deviceFingerprint || 'unknown', deviceInfo || 'unknown', ip, isPWA || false);
    await logActivity(user.id, 'LOGIN');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        has_management_access: user.has_management_access || false,
        is_chief_resident: user.is_chief_resident || false
      }
    });
  } catch (error) {
    console.error('Operation failed: auth.ts:62');
    res.status(500).json({ error: 'Login failed' });
  }
}));

router.post('/change-password', authenticate, transactional(async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) return res.status(400).json({error:'Password must be 8–72 bytes'});

    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password change failed' });
  }
}));

export default router;
