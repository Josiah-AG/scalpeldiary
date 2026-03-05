import { X, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface RotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rotations: any[];
}

export function RotationModal({ isOpen, onClose, rotations }: RotationModalProps) {
  if (!isOpen) return null;

  const months = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-3" size={28} />
            Yearly Rotation Schedule
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {rotations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {months.map((month, index) => {
                const rotation = rotations.find(r => r.month === index + 1);
                return (
                  <div
                    key={month}
                    className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
                    style={{
                      borderColor: rotation?.color || '#E5E7EB',
                      backgroundColor: rotation ? `${rotation.color}10` : '#F9FAFB'
                    }}
                  >
                    <div className="text-sm font-semibold text-gray-600 mb-2">{month}</div>
                    {rotation ? (
                      <div
                        className="px-3 py-2 rounded-lg font-bold text-white text-center"
                        style={{ backgroundColor: rotation.color }}
                      >
                        {rotation.category_name}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm text-center py-2">
                        Not assigned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No rotations assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  duties: any[];
}

export function DutyModal({ isOpen, onClose, duties }: DutyModalProps) {
  if (!isOpen) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of duties by date
  const dutyMap = new Map();
  duties.forEach(duty => {
    const date = duty.duty_date.split('T')[0];
    if (!dutyMap.has(date)) {
      dutyMap.set(date, []);
    }
    dutyMap.get(date).push(duty);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-3" size={28} />
            {format(now, 'MMMM yyyy')} - Duty Schedule
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
            
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayDuties = dutyMap.get(dateStr) || [];
              const isToday = isSameDay(day, new Date());

              // Group duties by category
              const dutyGroups = new Map();
              dayDuties.forEach((duty: any) => {
                const key = duty.duty_category_name;
                if (!dutyGroups.has(key)) {
                  dutyGroups.set(key, []);
                }
                dutyGroups.get(key).push(duty.resident_name);
              });

              return (
                <div
                  key={dateStr}
                  className={`min-h-24 p-2 rounded-lg border-2 transition-all ${
                    dayDuties.length > 0
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-white border-gray-200'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  {dutyGroups.size > 0 && (
                    <div className="space-y-1">
                      {Array.from(dutyGroups.entries()).map(([category, residents]: [string, any], idx) => (
                        <div key={idx} className="bg-amber-600 text-white px-2 py-1 rounded text-xs">
                          <div className="font-bold truncate">{category}</div>
                          <div className="text-[10px] opacity-90 truncate">
                            {residents.join(', ')}
                          </div>
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

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: any[];
}

export function ActivityModal({ isOpen, onClose, activities }: ActivityModalProps) {
  if (!isOpen) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of activities by date
  const activityMap = new Map();
  activities.forEach(activity => {
    const date = activity.activity_date.split('T')[0];
    if (!activityMap.has(date)) {
      activityMap.set(date, []);
    }
    activityMap.get(date).push(activity);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-3" size={28} />
            {format(now, 'MMMM yyyy')} - Activity Schedule
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
            
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayActivities = activityMap.get(dateStr) || [];
              const isToday = isSameDay(day, new Date());

              // Group activities by category
              const activityGroups = new Map();
              dayActivities.forEach((activity: any) => {
                const key = activity.activity_category_name;
                if (!activityGroups.has(key)) {
                  activityGroups.set(key, []);
                }
                activityGroups.get(key).push(activity.resident_name);
              });

              return (
                <div
                  key={dateStr}
                  className={`min-h-24 p-2 rounded-lg border-2 transition-all ${
                    dayActivities.length > 0
                      ? 'bg-purple-50 border-purple-400'
                      : 'bg-white border-gray-200'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  {activityGroups.size > 0 && (
                    <div className="space-y-1">
                      {Array.from(activityGroups.entries()).map(([category, residents]: [string, any], idx) => (
                        <div key={idx} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                          <div className="font-bold truncate">{category}</div>
                          <div className="text-[10px] opacity-90 truncate">
                            {residents.join(', ')}
                          </div>
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
