import procedureRequirements from './procedureRequirements.json';

export interface ProcedureRequirement {
  procedures: string[];
  minimum_expected_assisted: number | null;
  minimum_expected_performed: number | null;
}

export interface CategoryRequirements {
  [category: string]: ProcedureRequirement[];
}

export interface YearRequirements {
  [year: string]: CategoryRequirements;
}

// Type the imported JSON
const requirements: YearRequirements = procedureRequirements as YearRequirements;

/**
 * Get all categories across all years
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  Object.values(requirements).forEach(yearData => {
    Object.keys(yearData).forEach(category => categories.add(category));
  });
  return Array.from(categories).sort();
}

/**
 * Get all procedures for a specific category across all years
 */
export function getAllProceduresForCategory(category: string): string[] {
  const procedures = new Set<string>();
  Object.values(requirements).forEach(yearData => {
    if (yearData[category]) {
      yearData[category].forEach(req => {
        req.procedures.forEach(proc => procedures.add(proc));
      });
    }
  });
  
  // Add "Other [Category] Procedure" option
  const procedureList = Array.from(procedures).sort();
  procedureList.push(`Other ${category} Procedure`);
  
  return procedureList;
}

/**
 * Get requirements for a specific year
 */
export function getRequirementsForYear(year: number): CategoryRequirements | null {
  return requirements[`Year ${year}`] || null;
}

/**
 * Get minimum requirements for a specific procedure in a specific year
 */
export function getRequirementsForProcedure(
  year: number,
  category: string,
  procedureName: string
): { assisted: number | null; performed: number | null } | null {
  const yearData = requirements[`Year ${year}`];
  if (!yearData || !yearData[category]) {
    return null;
  }

  for (const req of yearData[category]) {
    if (req.procedures.includes(procedureName)) {
      return {
        assisted: req.minimum_expected_assisted,
        performed: req.minimum_expected_performed
      };
    }
  }

  return null;
}

/**
 * Calculate progress for a resident's year
 */
export interface ProcedureProgress {
  category: string;
  procedureGroup: string[];
  requiredAssisted: number | null;
  requiredPerformed: number | null;
  achievedAssisted: number;
  achievedPerformed: number;
  assistedProgress: number; // percentage
  performedProgress: number; // percentage
  isComplete: boolean;
}

export interface YearProgress {
  year: number;
  categories: {
    [category: string]: ProcedureProgress[];
  };
  overallProgress: number; // percentage
  totalRequired: number;
  totalAchieved: number;
}

/**
 * Calculate progress based on logged procedures
 */
export function calculateYearProgress(
  year: number,
  loggedProcedures: Array<{ procedure: string; surgery_role: string; category?: string }>
): YearProgress {
  const yearReqs = getRequirementsForYear(year);
  if (!yearReqs) {
    return {
      year,
      categories: {},
      overallProgress: 0,
      totalRequired: 0,
      totalAchieved: 0
    };
  }

  const categories: { [category: string]: ProcedureProgress[] } = {};
  let totalRequired = 0;
  let totalAchieved = 0;

  // Count procedures by role
  const countProcedures = (procedureNames: string[], category: string) => {
    let assisted = 0;
    let performed = 0;

    loggedProcedures.forEach(log => {
      // Match procedure name
      const matchesProcedure = procedureNames.some(name => 
        log.procedure.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(log.procedure.toLowerCase())
      );

      if (matchesProcedure) {
        // Check role
        const role = log.surgery_role;
        if (role === 'PRIMARY_SURGEON' || role === 'PRIMARY_SURGEON_ASSISTED') {
          performed++;
        } else if (role === 'FIRST_ASSISTANT' || role === 'SECOND_ASSISTANT' || role === 'OBSERVER') {
          assisted++;
        }
      }
    });

    return { assisted, performed };
  };

  // Process each category
  Object.entries(yearReqs).forEach(([category, requirements]) => {
    categories[category] = [];

    requirements.forEach(req => {
      const counts = countProcedures(req.procedures, category);
      
      const assistedProgress = req.minimum_expected_assisted 
        ? Math.min((counts.assisted / req.minimum_expected_assisted) * 100, 100)
        : 100;
      
      const performedProgress = req.minimum_expected_performed
        ? Math.min((counts.performed / req.minimum_expected_performed) * 100, 100)
        : 100;

      const isComplete = 
        (req.minimum_expected_assisted === null || counts.assisted >= req.minimum_expected_assisted) &&
        (req.minimum_expected_performed === null || counts.performed >= req.minimum_expected_performed);

      categories[category].push({
        category,
        procedureGroup: req.procedures,
        requiredAssisted: req.minimum_expected_assisted,
        requiredPerformed: req.minimum_expected_performed,
        achievedAssisted: counts.assisted,
        achievedPerformed: counts.performed,
        assistedProgress,
        performedProgress,
        isComplete
      });

      // Calculate totals
      if (req.minimum_expected_assisted) totalRequired += req.minimum_expected_assisted;
      if (req.minimum_expected_performed) totalRequired += req.minimum_expected_performed;
      totalAchieved += counts.assisted + counts.performed;
    });
  });

  const overallProgress = totalRequired > 0 ? Math.min((totalAchieved / totalRequired) * 100, 100) : 0;

  return {
    year,
    categories,
    overallProgress,
    totalRequired,
    totalAchieved
  };
}

/**
 * Get updated surgery roles
 */
export const SURGERY_ROLES = {
  PRIMARY_SURGEON: 'Primary Surgeon',
  PRIMARY_SURGEON_ASSISTED: 'Primary Surgeon (Assisted)',
  FIRST_ASSISTANT: '1st Assistant',
  SECOND_ASSISTANT: '2nd Assistant',
  OBSERVER: 'Observer'
} as const;

export type SurgeryRoleKey = keyof typeof SURGERY_ROLES;

/**
 * Check if a role counts as "performed"
 */
export function isPerformedRole(role: string): boolean {
  return role === 'PRIMARY_SURGEON' || role === 'PRIMARY_SURGEON_ASSISTED';
}

/**
 * Check if a role counts as "assisted"
 */
export function isAssistedRole(role: string): boolean {
  return role === 'FIRST_ASSISTANT' || role === 'SECOND_ASSISTANT' || role === 'OBSERVER';
}
