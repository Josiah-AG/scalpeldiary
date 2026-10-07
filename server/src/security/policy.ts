import { query } from '../database/db';
import { AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
export const ratingLabel = (n: number) => n >= 90 ? 'Excellent' : n >= 71 ? 'Good' : n >= 50 ? 'Satisfactory' : 'Poor';
export const validRating = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export function residentScope(req: AuthRequest, res: Response, next: NextFunction) {
  const target = req.params.residentId || req.query.residentId;
  if (target && req.user?.role === 'RESIDENT' && target !== req.user.id) return res.status(403).json({error:'Forbidden'});
  next();
}
export async function ownedYear(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'RESIDENT') return res.status(403).json({error:'Only residents can submit training records'});
  const yearId = req.body.yearId;
  if (typeof yearId !== 'string' || !/^[0-9a-f-]{36}$/i.test(yearId)) return res.status(400).json({error:'Invalid year'});
  try {
  const result = await query('SELECT id FROM resident_years WHERE id = $1 AND resident_id = $2', [yearId, req.user.id]);
  if (!result.rowCount) return res.status(400).json({error:'Select one of your resident years'});
  next();
  } catch { res.status(503).json({error:'Unable to validate year; please retry'}); }
}
// Resident records expose qualitative ratings, never hidden feedback or exact scores.
export function residentResponse(value: any, viewerId: string): any {
  if (Array.isArray(value)) return value.filter(x => !x?.is_anonymous).map(x => residentResponse(x, viewerId));
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (value.resident_id && value.resident_id !== viewerId) return value; // assigned senior-rater response
  const result: any = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'anonymous_comment' || key === 'anonymousComment') continue;
    if (['rating','detachment_rating'].includes(key) && typeof item === 'number') result[key] = ratingLabel(item);
    else if (['averageRating','seniorSupervisorRating','avgPresentationRating','avgRating','avg_rating'].includes(key)) { result[key] = null; const minimum = key.includes('Presentation') ? 5 : 10; const count = key.includes('Presentation') ? value.verifiedPresentations : value.verifiedSurgeries; if (Number(count) >= minimum && item != null) result[key+'Label'] = ratingLabel(Number(item)); }
    else result[key] = residentResponse(item, viewerId);
  }
  return result;
}

export async function supervisorAssignment(req: AuthRequest, res: Response, next: NextFunction) {
 const id=req.body.supervisorId;
 if (!id) return next();
 if (id === req.user?.id) return res.status(400).json({error:'You cannot supervise your own record'});
 try {
  const supervisor=await query('SELECT role,is_suspended FROM users WHERE id=$1',[id]);
  const role=supervisor.rows[0]?.role;
  if (!role || supervisor.rows[0].is_suspended || !['RESIDENT','SUPERVISOR'].includes(role)) return res.status(400).json({error:'Invalid supervisor'});
  if(role === 'RESIDENT') {
   if(req.baseUrl.includes('presentations')) return res.status(400).json({error:'Presentations require a supervisor'});
   const years=await query('SELECT resident_id,MAX(year) AS year FROM resident_years WHERE resident_id=ANY($1::uuid[]) GROUP BY resident_id',[[id,req.user!.id]]);
   const senior=years.rows.find(x=>x.resident_id===id)?.year || 0;
   const junior=years.rows.find(x=>x.resident_id===req.user!.id)?.year || 0;
   if(senior === 2 && !['Minor Surgery','MINOR_SURGERY'].includes(req.body.procedureCategory)) return res.status(400).json({error:'Year 2 resident supervisors can rate only Minor Surgery'});
   if(senior <= junior) return res.status(400).json({error:'Resident supervisor must be strictly senior'});
  }
  next();
 } catch {res.status(400).json({error:'Invalid supervisor'});}
}
