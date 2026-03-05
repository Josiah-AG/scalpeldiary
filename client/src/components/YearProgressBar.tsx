import { TrendingUp } from 'lucide-react';

interface YearProgress {
  year: number;
  overallProgress: number;
  totalRequired: number;
  totalAchieved: number;
}

interface Props {
  progress: YearProgress;
  onClick?: () => void;
}

export default function YearProgressBar({ progress, onClick }: Props) {
  return (
    <div 
      className={`bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 ${onClick ? 'cursor-pointer hover:shadow-xl' : ''} transition-shadow`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h3 className="text-base md:text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="mr-1.5 md:mr-2 text-blue-600" size={20} />
          <span className="hidden sm:inline">Year {progress.year} Performance Progress</span>
          <span className="sm:hidden">Year {progress.year} Progress</span>
        </h3>
        <span className="text-2xl md:text-3xl font-bold text-blue-600">
          {progress.overallProgress.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-6 md:h-8 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 md:pr-3"
          style={{ width: `${Math.min(progress.overallProgress, 100)}%` }}
        >
          {progress.overallProgress > 15 && (
            <span className="text-white text-xs md:text-sm font-bold">
              {progress.totalAchieved} / {progress.totalRequired}
            </span>
          )}
        </div>
      </div>
      
      {onClick && (
        <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 text-center">
          <span className="hidden sm:inline">Click to view detailed category breakdown →</span>
          <span className="sm:hidden">Tap for details →</span>
        </p>
      )}
    </div>
  );
}
