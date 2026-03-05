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
      className={`bg-white rounded-xl shadow-lg p-6 ${onClick ? 'cursor-pointer hover:shadow-xl' : ''} transition-shadow`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="mr-2 text-blue-600" size={24} />
          Year {progress.year} Performance Progress
        </h3>
        <span className="text-3xl font-bold text-blue-600">
          {progress.overallProgress.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
          style={{ width: `${Math.min(progress.overallProgress, 100)}%` }}
        >
          {progress.overallProgress > 15 && (
            <span className="text-white text-sm font-bold">
              {progress.totalAchieved} / {progress.totalRequired}
            </span>
          )}
        </div>
      </div>
      
      {onClick && (
        <p className="text-sm text-gray-600 mt-3 text-center">
          Click to view detailed category breakdown →
        </p>
      )}
    </div>
  );
}
