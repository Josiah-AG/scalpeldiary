import { useState } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface ProcedureProgress {
  category: string;
  procedureGroup: string[];
  requiredAssisted: number | null;
  requiredPerformed: number | null;
  achievedAssisted: number;
  achievedPerformed: number;
  assistedProgress: number;
  performedProgress: number;
  isComplete: boolean;
}

interface YearProgress {
  year: number;
  categories: {
    [category: string]: ProcedureProgress[];
  };
  overallProgress: number;
  totalRequired: number;
  totalAchieved: number;
}

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl md:rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 flex justify-between items-center">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg md:text-2xl font-bold text-white truncate">
              Year {progress.year} - Detailed Progress
            </h2>
            <p className="text-blue-100 mt-0.5 md:mt-1 text-xs md:text-base">
              Overall: {progress.overallProgress.toFixed(1)}% 
              <span className="hidden sm:inline">
                ({progress.totalAchieved} / {progress.totalRequired} procedures)
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors flex-shrink-0"
          >
            <X size={24} className="md:w-7 md:h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="space-y-3 md:space-y-4">
            {Object.entries(progress.categories)
              .map(([category, procedures]) => {
                // Calculate category progress
                let totalRequired = 0;
                let totalAchieved = 0;
                
                procedures.forEach(proc => {
                  if (proc.requiredAssisted) {
                    totalRequired += proc.requiredAssisted;
                    totalAchieved += Math.min(proc.achievedAssisted, proc.requiredAssisted);
                  }
                  if (proc.requiredPerformed) {
                    totalRequired += proc.requiredPerformed;
                    totalAchieved += Math.min(proc.achievedPerformed, proc.requiredPerformed);
                  }
                });
                
                const categoryProgress = totalRequired > 0 ? (totalAchieved / totalRequired) * 100 : 0;
                
                return { category, procedures, categoryProgress, totalRequired, totalAchieved };
              })
              .sort((a, b) => b.categoryProgress - a.categoryProgress) // Sort by progress (highest first)
              .map(({ category, procedures, categoryProgress, totalRequired, totalAchieved }) => {
              const isExpanded = expandedCategories.has(category);
              
              // Determine color based on progress
              const getProgressColor = (progress: number) => {
                if (progress < 50) return 'bg-red-500';
                if (progress < 80) return 'bg-blue-500';
                return 'bg-green-500';
              };
              
              const progressColor = getProgressColor(categoryProgress);
              
              // Determine category circle color based on progress
              const getCategoryCircleColor = (progress: number) => {
                if (progress < 50) return 'bg-red-500';
                if (progress < 80) return 'bg-blue-500';
                return 'bg-green-500';
              };
              
              const categoryCircleColor = getCategoryCircleColor(categoryProgress);
              
              return (
                <div key={category} className="border-2 border-gray-200 rounded-lg md:rounded-xl overflow-hidden hover:border-blue-300 transition-colors">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 md:p-5">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex justify-between items-center mb-2 md:mb-3"
                    >
                      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                        <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full ${categoryCircleColor} flex-shrink-0`}></div>
                        <span className="font-bold text-base md:text-xl text-gray-900 truncate">{category}</span>
                        <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">
                          ({procedures.filter(p => p.isComplete).length}/{procedures.length})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0 ml-2">
                        <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                        {isExpanded ? <ChevronUp size={20} className="md:w-6 md:h-6" /> : <ChevronDown size={20} className="md:w-6 md:h-6" />}
                      </div>
                    </button>
                    
                    {/* Category Progress Bar */}
                    <div className="w-full">
                      <div className="flex justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                        <span className="text-gray-700 font-medium">Progress:</span>
                        <span className="font-bold text-gray-900">
                          {totalAchieved}/{totalRequired} ({categoryProgress.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${Math.min(categoryProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Details */}
                  {isExpanded && (
                    <div className="p-3 md:p-6 space-y-3 md:space-y-4 bg-white">
                      {procedures
                        .sort((a, b) => {
                          // Calculate total required for each procedure
                          const aTotalRequired = (a.requiredAssisted || 0) + (a.requiredPerformed || 0);
                          const bTotalRequired = (b.requiredAssisted || 0) + (b.requiredPerformed || 0);
                          
                          // Sort by total required (highest first)
                          return bTotalRequired - aTotalRequired;
                        })
                        .map((proc, idx) => {
                          // Determine color for procedure progress bars
                          const getBarColor = (progress: number) => {
                            if (progress < 50) return 'bg-red-500';
                            if (progress < 80) return 'bg-blue-500';
                            return 'bg-green-500';
                          };
                          
                          // Calculate average progress for the procedure
                          let avgProgress = 0;
                          let progressCount = 0;
                          if (proc.requiredAssisted !== null) {
                            avgProgress += proc.assistedProgress;
                            progressCount++;
                          }
                          if (proc.requiredPerformed !== null) {
                            avgProgress += proc.performedProgress;
                            progressCount++;
                          }
                          avgProgress = progressCount > 0 ? avgProgress / progressCount : 0;
                          
                          // Determine circle color based on average progress
                          const getCircleColor = (progress: number) => {
                            if (progress < 50) return 'bg-red-500';
                            if (progress < 80) return 'bg-blue-500';
                            return 'bg-green-500';
                          };
                          
                          const circleColor = getCircleColor(avgProgress);
                          
                          return (
                        <div 
                          key={idx} 
                          className={`border-l-4 ${
                            proc.isComplete ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
                          } pl-3 md:pl-5 pr-3 md:pr-4 py-3 md:py-4 rounded-r-lg`}
                        >
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${circleColor} flex-shrink-0`}></div>
                              <p className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg break-words">
                                {proc.procedureGroup.join(', ')}
                              </p>
                            </div>
                            {proc.isComplete && (
                              <div className="flex items-center space-x-1 md:space-x-2 bg-green-600 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full flex-shrink-0 ml-2">
                                <CheckCircle size={14} className="md:w-4 md:h-4" />
                                <span className="text-xs md:text-sm font-bold">Done</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Assisted Progress */}
                          {proc.requiredAssisted !== null && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700 font-medium">Assisted:</span>
                                <span className="font-bold text-gray-900">
                                  {proc.achievedAssisted} / {proc.requiredAssisted}
                                  <span className="text-gray-500 ml-2">
                                    ({proc.assistedProgress.toFixed(0)}%)
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(proc.assistedProgress)}`}
                                  style={{ width: `${Math.min(proc.assistedProgress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Performed Progress */}
                          {proc.requiredPerformed !== null && (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700 font-medium">Performed:</span>
                                <span className="font-bold text-gray-900">
                                  {proc.achievedPerformed} / {proc.requiredPerformed}
                                  <span className="text-gray-500 ml-2">
                                    ({proc.performedProgress.toFixed(0)}%)
                                  </span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(proc.performedProgress)}`}
                                  style={{ width: `${Math.min(proc.performedProgress, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* No requirements message */}
                          {proc.requiredAssisted === null && proc.requiredPerformed === null && (
                            <p className="text-sm text-gray-600 italic">
                              No specific requirements for this year
                            </p>
                          )}
                        </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
