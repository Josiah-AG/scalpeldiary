import { Router } from 'express';
import { query } from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Create presentation assignment (Chief Resident & Supervisor)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is Chief Resident or Supervisor
    const userRole = req.user!.role;
    let isChiefResident = false;
    
    if (userRole === 'RESIDENT') {
      const userCheck = await query('SELECT is_chief_resident FROM users WHERE id = $1', [req.user!.id]);
      isChiefResident = userCheck.rows[0]?.is_chief_resident;
      
      if (!isChiefResident) {
        return res.status(403).json({ error: 'Only Chief Residents can assign presentations' });
      }
    } else if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({ error: 'Only Chief Residents and Supervisors can assign presentations' });
    }

    const { title, type, presenter_id, moderator_id, scheduled_date, description } = req.body;

    console.log('Creating presentation assignment:', { title, type, presenter_id, moderator_id, scheduled_date, description, created_by: req.user!.id });

    // Validate required fields
    if (!title || !type || !presenter_id || !moderator_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(
      `INSERT INTO presentation_assignments (
        title, type, presenter_id, moderator_id, scheduled_date, description, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'assigned') RETURNING *`,
      [title, type, presenter_id, moderator_id, scheduled_date || null, description, req.user!.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to create presentation assignment:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create presentation assignment', details: error.message });
  }
});

// Get all assignments (Chief Resident & Supervisor)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    let isChiefResident = false;
    
    if (userRole === 'RESIDENT') {
      const userCheck = await query('SELECT is_chief_resident FROM users WHERE id = $1', [req.user!.id]);
      isChiefResident = userCheck.rows[0]?.is_chief_resident;
      
      if (!isChiefResident) {
        return res.status(403).json({ error: 'Only Chief Residents can view all assignments' });
      }
    } else if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({ error: 'Only Chief Residents and Supervisors can view all assignments' });
    }

    let result;
    
    // Chief Residents see ALL assignments
    if (isChiefResident) {
      result = await query(
        `SELECT pa.*,
                presenter.name as presenter_name,
                moderator.name as moderator_name,
                creator.name as created_by_name
         FROM presentation_assignments pa
         JOIN users presenter ON pa.presenter_id = presenter.id
         JOIN users moderator ON pa.moderator_id = moderator.id
         JOIN users creator ON pa.created_by = creator.id
         ORDER BY pa.created_at DESC`
      );
    } 
    // Supervisors see only assignments they created OR where they are the moderator
    else if (userRole === 'SUPERVISOR') {
      result = await query(
        `SELECT pa.*,
                presenter.name as presenter_name,
                moderator.name as moderator_name,
                creator.name as created_by_name
         FROM presentation_assignments pa
         JOIN users presenter ON pa.presenter_id = presenter.id
         JOIN users moderator ON pa.moderator_id = moderator.id
         JOIN users creator ON pa.created_by = creator.id
         WHERE pa.created_by = $1 OR pa.moderator_id = $1
         ORDER BY pa.created_at DESC`,
        [req.user!.id]
      );
    }

    res.json(result.rows);
  } catch (error: any) {
    console.error('Failed to fetch assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get my assigned presentations (Resident)
router.get('/my-assignments', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'RESIDENT') {
      return res.status(403).json({ error: 'Only residents can view their assignments' });
    }

    const result = await query(
      `SELECT pa.*,
              moderator.name as moderator_name,
              creator.name as created_by_name
       FROM presentation_assignments pa
       JOIN users moderator ON pa.moderator_id = moderator.id
       JOIN users creator ON pa.created_by = creator.id
       WHERE pa.presenter_id = $1 AND pa.status = 'assigned'
       ORDER BY pa.scheduled_date ASC`,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Failed to fetch my assignments:', error);
    res.status(500).json({ error: 'Failed to fetch my assignments' });
  }
});

// Get count of pending assignments (Resident)
router.get('/my-assignments/count', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'RESIDENT') {
      return res.status(403).json({ error: 'Only residents can view their assignment count' });
    }

    const result = await query(
      `SELECT COUNT(*) as count
       FROM presentation_assignments
       WHERE presenter_id = $1 AND status = 'assigned'`,
      [req.user!.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error: any) {
    console.error('Failed to fetch assignment count:', error);
    res.status(500).json({ error: 'Failed to fetch assignment count' });
  }
});

// Get count of pending moderator assignments (Supervisor)
router.get('/moderator-assignments/count', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'SUPERVISOR') {
      return res.status(403).json({ error: 'Only supervisors can view their moderator assignment count' });
    }

    const result = await query(
      `SELECT COUNT(*) as count
       FROM presentation_assignments
       WHERE moderator_id = $1 AND status = 'assigned'`,
      [req.user!.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error: any) {
    console.error('Failed to fetch moderator assignment count:', error);
    res.status(500).json({ error: 'Failed to fetch moderator assignment count' });
  }
});

// Mark assignment as presented (Resident)
router.post('/:id/mark-presented', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'RESIDENT') {
      return res.status(403).json({ error: 'Only residents can mark presentations as presented' });
    }

    const { id } = req.params;
    const { presented_date, yearId } = req.body;

    // Get assignment details
    const assignmentResult = await query(
      'SELECT * FROM presentation_assignments WHERE id = $1 AND presenter_id = $2',
      [id, req.user!.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    // Create presentation entry
    const presentationResult = await query(
      `INSERT INTO presentations (
        resident_id, year_id, date, title, venue, presentation_type, description, supervisor_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING') RETURNING *`,
      [
        req.user!.id,
        yearId,
        presented_date,
        assignment.title,
        'Assigned', // Default venue for assigned presentations
        assignment.type,
        assignment.description,
        assignment.moderator_id
      ]
    );

    const presentation = presentationResult.rows[0];

    // Update assignment status
    await query(
      `UPDATE presentation_assignments 
       SET status = 'presented', presented_date = $1, presentation_id = $2, updated_at = NOW()
       WHERE id = $3`,
      [presented_date, presentation.id, id]
    );

    res.json({ 
      success: true, 
      message: 'Presentation marked as presented',
      presentation: presentation
    });
  } catch (error: any) {
    console.error('Failed to mark as presented:', error);
    res.status(500).json({ error: 'Failed to mark as presented' });
  }
});

// Update assignment (Chief Resident & Supervisor)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    let isChiefResident = false;
    
    if (userRole === 'RESIDENT') {
      const userCheck = await query('SELECT is_chief_resident FROM users WHERE id = $1', [req.user!.id]);
      isChiefResident = userCheck.rows[0]?.is_chief_resident;
      
      if (!isChiefResident) {
        return res.status(403).json({ error: 'Only Chief Residents can update assignments' });
      }
    } else if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({ error: 'Only Chief Residents and Supervisors can update assignments' });
    }

    const { id } = req.params;
    const { title, type, presenter_id, moderator_id, scheduled_date, description } = req.body;

    const result = await query(
      `UPDATE presentation_assignments 
       SET title = $1, type = $2, presenter_id = $3, moderator_id = $4, 
           scheduled_date = $5, description = $6, updated_at = NOW()
       WHERE id = $7 AND created_by = $8
       RETURNING *`,
      [title, type, presenter_id, moderator_id, scheduled_date || null, description, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to update assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment (Chief Resident & Supervisor)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role;
    let isChiefResident = false;
    
    if (userRole === 'RESIDENT') {
      const userCheck = await query('SELECT is_chief_resident FROM users WHERE id = $1', [req.user!.id]);
      isChiefResident = userCheck.rows[0]?.is_chief_resident;
      
      if (!isChiefResident) {
        return res.status(403).json({ error: 'Only Chief Residents can delete assignments' });
      }
    } else if (userRole !== 'SUPERVISOR') {
      return res.status(403).json({ error: 'Only Chief Residents and Supervisors can delete assignments' });
    }

    const { id } = req.params;

    const result = await query(
      'DELETE FROM presentation_assignments WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
