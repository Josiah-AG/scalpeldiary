import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logLoginSession, logActivity } from './activity-monitor';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceFingerprint, deviceInfo, isPWA } = req.body;

    console.log('Login attempt for email:', email);

    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    console.log('Users found:', result.rows.length, result.rows.map(u => ({ id: u.id, email: u.email, name: u.name })));

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    console.log('Password valid:', validPassword, 'for user:', user.name, user.email);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('LOGIN SUCCESS - User ID:', user.id, 'Name:', user.name, 'Email:', user.email, 'Role:', user.role);

    // Silent activity tracking — never blocks login
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    logLoginSession(user.id, deviceFingerprint || 'unknown', deviceInfo || 'unknown', ip, isPWA || false);
    logActivity(user.id, 'LOGIN');

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

export default router;
