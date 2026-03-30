import { useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useAuthStore } from '../store/authStore';

// Lock body scroll when modal is open
function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);
}

interface RotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rotations: any[];
}

export function RotationModal({ isOpen, onClose, rotations }: RotationModalProps) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const allMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Batch start month (calendar month 1-12, e.g. 4=April)
  const batchStartMonth = rotations[0]?.residency_start_month || 7;
  // Academic year start month (hardcoded as 7=July since that's what the DB uses)
  const academicStartMonth = 7;
  
  // Generate 12 display months starting from batch start month
  const months = Array.from({ length: 12 }, (_, i) => {
    const calMonth = ((batchStartMonth - 1 + i) % 12) + 1; // 1-12 calendar month
    return allMonthNames[calMonth - 1];
  });

  // Map display slot index to the correct academic month_number
  const getMonthNumber = (displayIndex: number) => {
    const calMonth = ((batchStartMonth - 1 + displayIndex) % 12) + 1;
    // Convert calendar month to academic month_number
    let monthNum = calMonth - academicStartMonth + 1;
    if (monthNum <= 0) monthNum += 12;
    return monthNum;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <Calendar className="mr-2" size={20} />
            Yearly Rotation Schedule
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X size={22} /></button>
        </div>
        <div className="p-3 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {rotations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {months.map((month, index) => {
                const rotation = rotations.find(r => r.month === getMonthNumber(index));
                return (
                  <div key={month} className="border-2 rounded-lg p-2 sm:p-4"
                    style={{ borderColor: rotation?.color || '#E5E7EB', backgroundColor: rotation ? rotation.color + '10' : '#F9FAFB' }}>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">{month}</div>
                    {rotation ? (
                      <div className="px-2 py-1 rounded-lg font-bold text-white text-center text-xs sm:text-sm"
                        style={{ backgroundColor: rotation.color }}>{rotation.category_name}</div>
                    ) : (
                      <div className="text-gray-400 text-xs text-center py-1">Not assigned</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No rotations assigned yet</div>
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
  useBodyScrollLock(isOpen);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  if (!isOpen) return null;

  const now = new Date();
  const dutyByDate = new Map<string, any[]>();
  duties.forEach(duty => {
    const date = duty.duty_date.split('T')[0];
    if (!dutyByDate.has(date)) dutyByDate.set(date, []);
    dutyByDate.get(date)!.push(duty);
  });
  const sortedDates = Array.from(dutyByDate.keys()).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <Calendar className="mr-2" size={20} />
            {format(now, 'MMMM yyyy')} - Duty Schedule
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X size={22} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {/* Mobile: List View */}
          <div className="sm:hidden p-3 space-y-3">
            {sortedDates.length > 0 ? sortedDates.map(date => {
              const dayDuties = dutyByDate.get(date)!;
              const isToday = date === format(now, 'yyyy-MM-dd');
              return (
                <div key={date} className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE, MMM dd')} {isToday && '(Today)'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayDuties.map((duty: any, idx: number) => {
                      const isMe = duty.resident_id === currentUserId;
                      return (
                        <div key={idx} className={'text-white px-2 py-1 rounded text-xs font-medium ' + (isMe ? 'ring-2 ring-offset-1 ring-black' : '')} style={{ backgroundColor: duty.duty_color || '#D97706' }}>
                          {duty.duty_category_name} · {duty.resident_name}{isMe ? ' ★' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-500 text-center py-8">No duties this month</p>
            )}
          </div>
          {/* Desktop: Calendar Grid */}
          <div className="hidden sm:block p-6">
            <CalendarGrid
              days={eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })}
              dataMap={dutyByDate}
              color="amber"
              categoryKey="duty_category_name"
            />
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
  useBodyScrollLock(isOpen);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  if (!isOpen) return null;

  const now = new Date();
  const actByDate = new Map<string, any[]>();
  activities.forEach(act => {
    const date = act.activity_date.split('T')[0];
    if (!actByDate.has(date)) actByDate.set(date, []);
    actByDate.get(date)!.push(act);
  });
  const sortedDates = Array.from(actByDate.keys()).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl shadow-2xl sm:max-w-4xl sm:max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <Calendar className="mr-2" size={20} />
            {format(now, 'MMMM yyyy')} - Activity Schedule
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X size={22} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {/* Mobile: List View */}
          <div className="sm:hidden p-3 space-y-3">
            {sortedDates.length > 0 ? sortedDates.map(date => {
              const dayActs = actByDate.get(date)!;
              const isToday = date === format(now, 'yyyy-MM-dd');
              return (
                <div key={date} className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE, MMM dd')} {isToday && '(Today)'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayActs.map((act: any, idx: number) => {
                      const isMe = act.resident_id === currentUserId;
                      return (
                        <div key={idx} className={'text-white px-2 py-1 rounded text-xs font-medium ' + (isMe ? 'ring-2 ring-offset-1 ring-black' : '')} style={{ backgroundColor: act.color || '#9333EA' }}>
                          {act.activity_category_name} · {act.resident_name}{isMe ? ' ★' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-500 text-center py-8">No activities this month</p>
            )}
          </div>
          {/* Desktop: Calendar Grid */}
          <div className="hidden sm:block p-6">
            <CalendarGrid
              days={eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })}
              dataMap={actByDate}
              color="purple"
              categoryKey="activity_category_name"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({ days, dataMap, color, categoryKey }: {
  days: Date[];
  dataMap: Map<string, any[]>;
  color: string;
  categoryKey: string;
}) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const c = color === 'purple'
    ? { bg: 'bg-purple-50', border: 'border-purple-400', badge: 'bg-purple-600' }
    : { bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-600' };

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="text-center font-semibold text-gray-600 text-xs py-1">{day}</div>
      ))}
      {Array.from({ length: days[0].getDay() }).map((_, i) => (
        <div key={'e' + i} className="min-h-[70px]"></div>
      ))}
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const items = dataMap.get(dateStr) || [];
        const isToday = isSameDay(day, new Date());
        const groups = new Map<string, string[]>();
        items.forEach((item: any) => {
          const key = item[categoryKey];
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(item.resident_name);
        });

        return (
          <div key={dateStr}
            className={`min-h-[70px] p-1 rounded border-2 ${items.length > 0 ? c.bg + ' ' + c.border : 'bg-white border-gray-200'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
            <div className={`text-xs font-semibold mb-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{format(day, 'd')}</div>
            {groups.size > 0 && (
              <div className="space-y-0.5">
                {Array.from(groups.entries()).map(([cat, residents], idx) => {
                  // Find the color from the original items
                  const itemColor = items.find((i: any) => i[categoryKey] === cat)?.color || items.find((i: any) => i[categoryKey] === cat)?.duty_color || (color === 'purple' ? '#9333EA' : '#D97706');
                  const hasMe = residents.some((r: string) => items.some((i: any) => i[categoryKey] === cat && i.resident_id === currentUserId));
                  return (
                    <div key={idx} className={'text-white px-1 py-0.5 rounded text-[10px] leading-tight ' + (hasMe ? 'ring-1 ring-black' : '')} style={{ backgroundColor: itemColor }}>
                      <div className="font-bold truncate">{cat}</div>
                      <div className="opacity-90 truncate">{residents.join(', ')}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
