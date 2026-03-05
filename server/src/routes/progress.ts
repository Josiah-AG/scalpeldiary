import express from 'express';
import { calculateYearProgress } from '../../shared/procedureUtils';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get progress for a resident's year
router.get('/year/:yearId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId } = req.params;
    const residentId = req.query.residentId || req.user!.id;

    if (!residentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get year number
    const yearResult = await db.query(
      'SELECT year FROM resident_years WHERE id = $1',
      [yearId]
    );

    if (yearResult.rows.length === 0) {
      return res.status(404).json({ error: 'Year not found' });
    }

    const yearNumber = yearResult.rows[0].year;

    // Get all procedures for this year
    const proceduresResult = await db.query(
      `SELECT 
        procedure, 
        surgery_role, 
        procedure_category 
      FROM surgical_logs 
      WHERE year_id = $1 AND resident_id = $2`,
      [yearId, residentId]
    );

    const progress = calculateYearProgress(yearNumber, proceduresResult.rows);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
