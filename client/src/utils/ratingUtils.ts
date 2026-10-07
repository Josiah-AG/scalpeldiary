// Rating label system - residents see labels, supervisors/master see numbers

export function getRatingLabel(rating: number | string): string {
  if (typeof rating === 'string') return rating;
  if (rating >= 90) return 'Excellent';
  if (rating >= 71) return 'Good';
  if (rating >= 50) return 'Satisfactory';
  return 'Poor';
}

export function getRatingColor(rating: number | string): string {
  if (typeof rating === 'string') rating = ({Excellent:95,Good:80,Satisfactory:60,Poor:25} as Record<string,number>)[rating] ?? 0;
  if (rating >= 90) return 'bg-green-500';
  if (rating >= 71) return 'bg-blue-500';
  if (rating >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getRatingTextColor(rating: number | string): string {
  if (typeof rating === 'string') rating = ({Excellent:95,Good:80,Satisfactory:60,Poor:25} as Record<string,number>)[rating] ?? 0;
  if (rating >= 90) return 'text-green-600';
  if (rating >= 71) return 'text-blue-600';
  if (rating >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// Returns the badge for resident view (label only)
export function getResidentRatingBadge(rating: number | string | null, status: string): { text: string; className: string } {
  if (status === 'NOT_WITNESSED') return { text: 'N/A', className: 'bg-gray-200 text-gray-700' };
  if (rating == null || status === 'PENDING') return { text: 'Pending', className: 'bg-yellow-100 text-yellow-700' };
  const label = getRatingLabel(rating);
  const color = getRatingColor(rating);
  return { text: label, className: color + ' text-white' };
}

// Returns the badge for supervisor/master view (exact number with 4-tier colors)
export function getSupervisorRatingBadge(rating: number | string | null, status: string): { text: string; className: string } {
  if (status === 'NOT_WITNESSED') return { text: 'N/A', className: 'bg-gray-200 text-gray-700' };
  if (rating == null || status === 'PENDING') return { text: 'Pending', className: 'bg-yellow-100 text-yellow-700' };
  const color = getRatingColor(rating);
  return { text: `${rating}/100`, className: color + ' text-white' };
}

// Check if user should see exact scores
export function canSeeExactScores(userRole: string | undefined, isReadOnlyMode: boolean): boolean {
  if (!userRole) return false;
  if (userRole === 'SUPERVISOR' || userRole === 'MASTER' || userRole === 'MANAGEMENT') return true;

  return false;
}

// Rating guide text for rating modals
export const RATING_GUIDE = `90-100: Excellent · 71-89: Good · 50-70: Satisfactory · Below 50: Poor`;

// A band rank is for styling/filtering qualitative responses, never an exact score.
export function ratingRank(rating: number | string | null | undefined): number {
  if (typeof rating === 'number') return rating;
  return ({Poor:0,Satisfactory:50,Good:71,Excellent:90} as Record<string,number>)[rating || ''] ?? -1;
}
