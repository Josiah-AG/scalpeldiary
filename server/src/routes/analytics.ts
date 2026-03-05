import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get dashboard metrics for resident
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, residentId } = req.query;
    const targetResidentId = residentId || req.user!.id;
    
    // Total surgeries
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2',
      [targetResidentId, yearId]
    );

    // Average rating
    const ratingResult = await query(
      'SELECT AVG(rating) as avg_rating FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [targetResidentId, yearId]
    );

    // Role distribution
    const roleResult = await query(
      'SELECT surgery_role, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY surgery_role',
      [targetResidentId, yearId]
    );

    // Calendar data (surgeries per day)
    const calendarResult = await query(
      'SELECT date, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY date ORDER BY date',
      [targetResidentId, yearId]
    );

    // Recent surgeries
    const recentResult = await query(
      `SELECT sl.*, u.name as supervisor_name 
       FROM surgical_logs sl
       LEFT JOIN users u ON sl.supervisor_id = u.id
       WHERE sl.resident_id = $1 AND sl.year_id = $2
       ORDER BY sl.date DESC LIMIT 10`,
      [targetResidentId, yearId]
    );

    // Recent presentations
    const recentPresentationsResult = await query(
      `SELECT p.* 
       FROM presentations p
       WHERE p.resident_id = $1 AND p.year_id = $2
       ORDER BY p.date DESC LIMIT 5`,
      [targetResidentId, yearId]
    );

    res.json({
      totalSurgeries: parseInt(totalResult.rows[0].count),
      averageRating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
      roleDistribution: roleResult.rows.reduce((acc, row) => {
        acc[row.surgery_role] = parseInt(row.count);
        return acc;
      }, {}),
      surgeryCalendar: calendarResult.rows.reduce((acc, row) => {
        acc[row.date] = parseInt(row.count);
        return acc;
      }, {}),
      recentSurgeries: recentResult.rows,
      recentPresentations: recentPresentationsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get analytics for resident
router.get('/resident', authenticate, async (req: AuthRequest, res) => {
  try {
    const { yearId, residentId } = req.query;
    const targetResidentId = residentId || req.user!.id;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total surgeries for year
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2',
      [targetResidentId, yearId]
    );

    // Month surgeries
    const monthResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 AND date >= $3',
      [targetResidentId, yearId, firstDayOfMonth]
    );

    // Role distribution
    const roleResult = await query(
      'SELECT surgery_role, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY surgery_role',
      [targetResidentId, yearId]
    );

    // Procedure type distribution
    const procedureTypeResult = await query(
      'SELECT procedure_type, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY procedure_type',
      [targetResidentId, yearId]
    );

    // Category distribution (procedure_category)
    const categoryResult = await query(
      'SELECT procedure_category, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY procedure_category ORDER BY count DESC',
      [targetResidentId, yearId]
    );

    // Top 5 procedures
    const topProceduresResult = await query(
      'SELECT procedure, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY procedure ORDER BY count DESC LIMIT 5',
      [targetResidentId, yearId]
    );

    // Average rating
    const ratingResult = await query(
      'SELECT AVG(rating) as avg_rating FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [targetResidentId, yearId]
    );

    // Senior supervisor rating (supervisors with SUPERVISOR role)
    const seniorRatingResult = await query(
      `SELECT AVG(sl.rating) as avg_rating 
       FROM surgical_logs sl
       JOIN users u ON sl.supervisor_id = u.id
       WHERE sl.resident_id = $1 AND sl.year_id = $2 AND sl.rating IS NOT NULL AND u.role = 'SUPERVISOR'`,
      [targetResidentId, yearId]
    );

    // Comments
    const commentsResult = await query(
      `SELECT sl.comment, sl.rating, sl.rated_at as date, u.name as supervisor_name
       FROM surgical_logs sl
       JOIN users u ON sl.supervisor_id = u.id
       WHERE sl.resident_id = $1 AND sl.year_id = $2 AND sl.comment IS NOT NULL
       ORDER BY sl.rated_at DESC`,
      [targetResidentId, yearId]
    );

    // Total presentations
    const totalPresentationsResult = await query(
      'SELECT COUNT(*) as count FROM presentations WHERE resident_id = $1 AND year_id = $2',
      [targetResidentId, yearId]
    );

    // Average presentation rating
    const presentationRatingResult = await query(
      'SELECT AVG(rating) as avg_rating FROM presentations WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [targetResidentId, yearId]
    );

    // Institution distribution for procedures
    const institutionProceduresResult = await query(
      'SELECT place_of_practice, COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 GROUP BY place_of_practice',
      [targetResidentId, yearId]
    );

    // Institution distribution for presentations
    const institutionPresentationsResult = await query(
      'SELECT venue, COUNT(*) as count FROM presentations WHERE resident_id = $1 AND year_id = $2 GROUP BY venue',
      [targetResidentId, yearId]
    );

    res.json({
      totalSurgeries: parseInt(totalResult.rows[0].count),
      monthSurgeries: parseInt(monthResult.rows[0].count),
      roleDistribution: roleResult.rows.reduce((acc, row) => {
        acc[row.surgery_role] = parseInt(row.count);
        return acc;
      }, {}),
      procedureTypeDistribution: procedureTypeResult.rows.reduce((acc, row) => {
        acc[row.procedure_type] = parseInt(row.count);
        return acc;
      }, {}),
      categoryDistribution: categoryResult.rows,
      topProcedures: topProceduresResult.rows,
      averageRating: parseFloat(ratingResult.rows[0].avg_rating) || 0,
      seniorSupervisorRating: parseFloat(seniorRatingResult.rows[0].avg_rating) || 0,
      totalPresentations: parseInt(totalPresentationsResult.rows[0].count),
      avgPresentationRating: parseFloat(presentationRatingResult.rows[0].avg_rating) || 0,
      institutionProcedures: institutionProceduresResult.rows,
      institutionPresentations: institutionPresentationsResult.rows,
      comments: commentsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get supervisor analytics
router.get('/supervisor', authenticate, async (req: AuthRequest, res) => {
  try {
    // Total surgeries supervised
    const totalSurgeriesResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE supervisor_id = $1',
      [req.user!.id]
    );

    // Total presentations supervised
    const totalPresentationsResult = await query(
      'SELECT COUNT(*) as count FROM presentations WHERE supervisor_id = $1',
      [req.user!.id]
    );

    res.json({
      totalSurgeries: parseInt(totalSurgeriesResult.rows[0].count),
      totalPresentations: parseInt(totalPresentationsResult.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supervisor analytics' });
  }
});

// Get residents by year for supervisor
router.get('/supervisor/residents', authenticate, async (req: AuthRequest, res) => {
  try {
    const { year } = req.query;

    // Get all residents whose CURRENT year (max year) matches the requested year
    const residentsResult = await query(
      `SELECT DISTINCT 
        u.id, 
        u.name, 
        u.profile_picture,
        u.is_chief_resident,
        (SELECT COUNT(*) FROM surgical_logs sl 
         JOIN resident_years ry ON sl.year_id = ry.id 
         WHERE sl.resident_id = u.id AND ry.year = $1) as total_procedures,
        (SELECT COUNT(*) FROM presentations p 
         JOIN resident_years ry ON p.year_id = ry.id 
         WHERE p.resident_id = u.id AND ry.year = $1) as total_presentations,
        (SELECT AVG(rating) FROM surgical_logs sl 
         JOIN resident_years ry ON sl.year_id = ry.id 
         WHERE sl.resident_id = u.id AND ry.year = $1 AND sl.rating IS NOT NULL) as avg_procedure_rating,
        (SELECT AVG(rating) FROM presentations p 
         JOIN resident_years ry ON p.year_id = ry.id 
         WHERE p.resident_id = u.id AND ry.year = $1 AND p.rating IS NOT NULL) as avg_presentation_rating,
        (SELECT COUNT(*) FROM surgical_logs sl 
         WHERE sl.supervisor_id = u.id AND sl.rating IS NOT NULL) as rated_logs
       FROM users u
       WHERE u.role = 'RESIDENT' 
       AND (SELECT MAX(year) FROM resident_years WHERE resident_id = u.id) = $1
       ORDER BY u.name`,
      [year]
    );

    const residents = residentsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      profilePicture: row.profile_picture,
      is_chief_resident: row.is_chief_resident || false,
      totalProcedures: parseInt(row.total_procedures) || 0,
      totalPresentations: parseInt(row.total_presentations) || 0,
      avgProcedureRating: parseFloat(row.avg_procedure_rating) || 0,
      avgPresentationRating: parseFloat(row.avg_presentation_rating) || 0,
      ratedLogs: parseInt(row.rated_logs) || 0
    }));

    res.json(residents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Get specific resident analytics for supervisor
router.get('/supervisor/resident/:residentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { residentId } = req.params;
    const { year } = req.query;

    // Get year_id
    const yearResult = await query(
      'SELECT id FROM resident_years WHERE resident_id = $1 AND year = $2',
      [residentId, year]
    );

    if (yearResult.rows.length === 0) {
      return res.json({
        totalProcedures: 0,
        totalPresentations: 0,
        avgProcedureRating: 0,
        avgPresentationRating: 0
      });
    }

    const yearId = yearResult.rows[0].id;

    // Total procedures
    const proceduresResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE resident_id = $1 AND year_id = $2',
      [residentId, yearId]
    );

    // Avg procedure rating
    const procedureRatingResult = await query(
      'SELECT AVG(rating) as avg FROM surgical_logs WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [residentId, yearId]
    );

    // Total presentations
    const presentationsResult = await query(
      'SELECT COUNT(*) as count FROM presentations WHERE resident_id = $1 AND year_id = $2',
      [residentId, yearId]
    );

    // Avg presentation rating
    const presentationRatingResult = await query(
      'SELECT AVG(rating) as avg FROM presentations WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL',
      [residentId, yearId]
    );

    // Rated logs (procedures this resident has rated as a supervisor)
    const ratedLogsResult = await query(
      'SELECT COUNT(*) as count FROM surgical_logs WHERE supervisor_id = $1 AND rating IS NOT NULL',
      [residentId]
    );

    res.json({
      totalProcedures: parseInt(proceduresResult.rows[0].count),
      totalPresentations: parseInt(presentationsResult.rows[0].count),
      avgProcedureRating: parseFloat(procedureRatingResult.rows[0].avg) || 0,
      avgPresentationRating: parseFloat(presentationRatingResult.rows[0].avg) || 0,
      ratedLogs: parseInt(ratedLogsResult.rows[0].count)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch resident analytics' });
  }
});

export default router;
