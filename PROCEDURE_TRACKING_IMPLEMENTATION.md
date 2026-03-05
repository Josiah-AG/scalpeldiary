# JSON-Based Procedure Tracking System Implementation

## Status: Phase 1 Complete ✅

### Completed:
1. ✅ Created `shared/procedureRequirements.json` with all procedure data
2. ✅ Created `shared/procedureUtils.ts` with utility functions

### Next Steps:

## Phase 2: Update Types and Backend

### 2.1 Update shared/types.ts
```typescript
// Add new surgery roles
export enum SurgeryRole {
  PRIMARY_SURGEON = 'PRIMARY_SURGEON',
  PRIMARY_SURGEON_ASSISTED = 'PRIMARY_SURGEON_ASSISTED',
  FIRST_ASSISTANT = 'FIRST_ASSISTANT',
  SECOND_ASSISTANT = 'SECOND_ASSISTANT',
  OBSERVER = 'OBSERVER'
}

// Add procedure_category field to SurgicalLog interface
export interface SurgicalLog {
  // ... existing fields
  procedureCategory?: string; // Add this
}
```

### 2.2 Update Database Schema
Add `procedure_category` column to `surgical_logs` table if not exists:
```sql
ALTER TABLE surgical_logs ADD COLUMN IF NOT EXISTS procedure_category VARCHAR(100);
```

### 2.3 Create Backend API Endpoint
Create `server/src/routes/progress.ts`:
```typescript
import express from 'express';
import { calculateYearProgress } from '../../shared/procedureUtils';
import db from '../database';

const router = express.Router();

// Get progress for a resident's year
router.get('/year/:yearId', async (req, res) => {
  const { yearId } = req.params;
  const residentId = req.query.residentId || req.user.id;
  
  // Get year number
  const yearData = await db.query(
    'SELECT year FROM resident_years WHERE id = $1',
    [yearId]
  );
  
  // Get all procedures for this year
  const procedures = await db.query(
    'SELECT procedure, surgery_role, procedure_category FROM surgical_logs WHERE year_id = $1 AND resident_id = $2',
    [yearId, residentId]
  );
  
  const progress = calculateYearProgress(yearData.rows[0].year, procedures.rows);
  res.json(progress);
});

export default router;
```

## Phase 3: Update Frontend Components

### 3.1 Create Progress Bar Component
Create `client/src/components/YearProgressBar.tsx`:
```typescript
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { YearProgress } from '../../shared/procedureUtils';

interface Props {
  progress: YearProgress;
  onClick?: () => void;
}

export default function YearProgressBar({ progress, onClick }: Props) {
  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Year {progress.year} Performance Progress
        </h3>
        <span className="text-2xl font-bold text-blue-600">
          {progress.overallProgress.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
          style={{ width: `${Math.min(progress.overallProgress, 100)}%` }}
        >
          {progress.overallProgress > 10 && (
            <span className="text-white text-xs font-bold">
              {progress.totalAchieved} / {progress.totalRequired}
            </span>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        Click to view detailed category breakdown
      </p>
    </div>
  );
}
```

### 3.2 Create Progress Detail Modal
Create `client/src/components/ProgressDetailModal.tsx`:
```typescript
import { useState } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { YearProgress } from '../../shared/procedureUtils';

interface Props {
  progress: YearProgress;
  onClose: () => void;
}

export default function ProgressDetailModal({ progress, onClose }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Year {progress.year} - Detailed Progress
            </h2>
            <p className="text-blue-100 mt-1">
              Overall Progress: {progress.overallProgress.toFixed(1)}% 
              ({progress.totalAchieved} / {progress.totalRequired} procedures)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Object.entries(progress.categories).map(([category, procedures]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryComplete = procedures.every(p => p.isComplete);
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex justify-between items-center transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {categoryComplete ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-orange-500" size={24} />
                      )}
                      <span className="font-bold text-lg text-gray-900">{category}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {/* Category Details */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      {procedures.map((proc, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {proc.procedureGroup.join(', ')}
                              </p>
                            </div>
                            {proc.isComplete && (
                              <CheckCircle className="text-green-600 flex-shrink-0 ml-2" size={20} />
                            )}
                          </div>
                          
                          {/* Assisted Progress */}
                          {proc.requiredAssisted !== null && (
                            <div className="mb-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Assisted:</span>
                                <span className="font-semibold">
                                  {proc.achievedAssisted} / {proc.requiredAssisted}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-full rounded-full ${
                                    proc.assistedProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(proc.assistedProgress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Performed Progress */}
                          {proc.requiredPerformed !== null && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Performed:</span>
                                <span className="font-semibold">
                                  {proc.achievedPerformed} / {proc.requiredPerformed}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-full rounded-full ${
                                    proc.performedProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${Math.min(proc.performedProgress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 Update AddLog Page
Update `client/src/pages/resident/AddLog.tsx`:
- Import `getAllCategories` and `getAllProceduresForCategory` from `shared/procedureUtils`
- Replace hardcoded category dropdown with dynamic categories from JSON
- Update procedure dropdown to show all procedures from selected category across all years
- Update role dropdown to use new roles (PRIMARY_SURGEON, PRIMARY_SURGEON_ASSISTED, etc.)

### 3.4 Update Dashboard
Update `client/src/pages/resident/Dashboard.tsx`:
- Import `YearProgressBar` component
- Fetch progress data from new API endpoint
- Add progress bar below stats cards
- Make it clickable to open detail modal

### 3.5 Update Analytics
Update `client/src/pages/resident/Analytics.tsx`:
- Add same progress bar as Dashboard
- Show progress for selected year

### 3.6 Update Supervisor ResidentView
Update `client/src/pages/supervisor/ResidentView.tsx`:
- Add progress bar below average ratings
- Show resident's progress for selected year

## Phase 4: Testing Checklist

- [ ] Verify JSON file loads correctly
- [ ] Test category dropdown shows all categories
- [ ] Test procedure dropdown shows all procedures for selected category
- [ ] Test "Other [Category] Procedure" appears at end of each list
- [ ] Test new role dropdown with 5 roles
- [ ] Test progress calculation is accurate
- [ ] Test progress bar displays correctly
- [ ] Test clicking progress bar opens detail modal
- [ ] Test category expansion in detail modal
- [ ] Test procedure-level progress display
- [ ] Test color coding (green for complete, orange for incomplete)
- [ ] Test in Dashboard
- [ ] Test in Analytics
- [ ] Test in Supervisor ResidentView

## Implementation Notes

1. **Role Counting Logic**:
   - PRIMARY_SURGEON and PRIMARY_SURGEON_ASSISTED count as "Performed"
   - FIRST_ASSISTANT, SECOND_ASSISTANT, and OBSERVER count as "Assisted"

2. **Procedure Matching**:
   - Use fuzzy matching to handle variations in procedure names
   - Case-insensitive comparison

3. **Progress Calculation**:
   - Calculate separately for Assisted and Performed
   - Overall progress = (total achieved / total required) * 100
   - Cap at 100%

4. **UI/UX**:
   - Progress bars should be visually appealing with gradients
   - Use green for completed, blue/purple for in-progress
   - Smooth animations on expand/collapse
   - Mobile responsive

## Files Created:
1. ✅ `shared/procedureRequirements.json`
2. ✅ `shared/procedureUtils.ts`
3. ⏳ `server/src/routes/progress.ts`
4. ⏳ `client/src/components/YearProgressBar.tsx`
5. ⏳ `client/src/components/ProgressDetailModal.tsx`

## Files to Update:
1. ⏳ `shared/types.ts` - Add new surgery roles
2. ⏳ `server/src/database/migrate.ts` - Add procedure_category column
3. ⏳ `server/src/index.ts` - Register progress routes
4. ⏳ `client/src/pages/resident/AddLog.tsx` - Dynamic dropdowns
5. ⏳ `client/src/pages/resident/Dashboard.tsx` - Add progress bar
6. ⏳ `client/src/pages/resident/Analytics.tsx` - Add progress bar
7. ⏳ `client/src/pages/supervisor/ResidentView.tsx` - Add progress bar

This is a comprehensive feature. Would you like me to continue with the implementation, or would you prefer to review what's been done so far?
