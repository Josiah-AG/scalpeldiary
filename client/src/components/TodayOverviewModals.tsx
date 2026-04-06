import React, { useEffect, useState } from 'react';
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
  const todayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && todayRef.current) {
      setTimeout(() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const now = new Date();
  const dutyByDate = new Map<string, any[]>();

  // Fixed duty category order and colors
  const DUTY_ORDER: {[key: string]: number} = { 'Senior Resident': 0, 'Ward': 1, 'ICU': 2, 'EOPD': 3, 'Consultation': 4 };
  const DUTY_COLORS: {[key: string]: string} = { 'EOPD': '#DC2626', 'ICU': '#7C3AED', 'Ward': '#2563EB', 'Senior Resident': '#D97706', 'Consultation': '#EC4899' };
  const getDutyColor = (name: string) => DUTY_COLORS[name] || '#6B7280';
  const getDutyOrder = (name: string) => DUTY_ORDER[name] ?? 99;

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
                <div key={date} className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} ref={isToday ? todayRef : undefined}>
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE, MMM dd')} {isToday && '(Today)'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayDuties
                      .sort((a: any, b: any) => getDutyOrder(a.duty_category_name) - getDutyOrder(b.duty_category_name))
                      .map((duty: any, idx: number) => {
                      const isMe = duty.resident_id === currentUserId;
                      return (
                        <div key={idx} className={'text-white px-2 py-1 rounded text-xs font-medium ' + (isMe ? 'ring-2 ring-offset-1 ring-black' : '')} style={{ backgroundColor: getDutyColor(duty.duty_category_name) }}>
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
              colorOverride={getDutyColor}
              orderOverride={getDutyOrder}
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
  const actTodayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && actTodayRef.current) {
      setTimeout(() => actTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [isOpen]);

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
                <div key={date} className={`p-3 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} ref={isToday ? actTodayRef : undefined}>
                  <div className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE, MMM dd')} {isToday && '(Today)'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      // Group by category
                      const grouped = new Map<string, {color: string; residents: {name: string; isMe: boolean}[]}>();
                      dayActs.forEach((act: any) => {
                        const key = act.activity_category_name;
                        if (!grouped.has(key)) grouped.set(key, { color: act.color || '#9333EA', residents: [] });
                        grouped.get(key)!.residents.push({ name: act.resident_name, isMe: act.resident_id === currentUserId });
                      });
                      return Array.from(grouped.entries()).map(([cat, data]) => (
                        <div key={cat} className="w-full rounded-lg p-2 mb-1" style={{ backgroundColor: data.color + '18', borderLeft: `3px solid ${data.color}` }}>
                          <div className="text-xs font-bold mb-0.5" style={{ color: data.color }}>{cat}</div>
                          <div className="flex flex-wrap gap-1">
                            {data.residents.map((r, i) => (
                              <span key={i} className={`text-xs bg-white rounded px-1.5 py-0.5 ${r.isMe ? 'ring-1 ring-black font-bold' : ''}`}>{r.name}{r.isMe ? ' ★' : ''}</span>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
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

function CalendarGrid({ days, dataMap, color, categoryKey, colorOverride, orderOverride }: {
  days: Date[];
  dataMap: Map<string, any[]>;
  color: string;
  categoryKey: string;
  colorOverride?: (name: string) => string;
  orderOverride?: (name: string) => number;
}) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
            onClick={() => items.length > 0 && setSelectedDay(dateStr)}
            className={`min-h-[70px] p-1 rounded border-2 ${items.length > 0 ? c.bg + ' ' + c.border + ' cursor-pointer hover:shadow-md' : 'bg-white border-gray-200'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
            <div className={`text-xs font-semibold mb-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{format(day, 'd')}</div>
            {groups.size > 0 && (
              <div className="space-y-0.5">
                {Array.from(groups.entries())
                  .sort((a, b) => orderOverride ? orderOverride(a[0]) - orderOverride(b[0]) : 0)
                  .map(([cat, residents], idx) => {
                  const itemColor = colorOverride ? colorOverride(cat) : (items.find((i: any) => i[categoryKey] === cat)?.color || items.find((i: any) => i[categoryKey] === cat)?.duty_color || (color === 'purple' ? '#9333EA' : '#D97706'));
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
      {/* Day detail popup */}
      {selectedDay && (() => {
        const items = dataMap.get(selectedDay) || [];
        const grouped = new Map<string, {color: string; residents: {name: string; isMe: boolean}[]}>();
        items.forEach((item: any) => {
          const key = item[categoryKey];
          if (!grouped.has(key)) grouped.set(key, { color: colorOverride ? colorOverride(key) : (item.color || item.duty_color || '#9333EA'), residents: [] });
          grouped.get(key)!.residents.push({ name: item.resident_name, isMe: item.resident_id === currentUserId });
        });
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
            <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">{format(new Date(selectedDay + 'T00:00:00'), 'EEEE, MMM dd')}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="space-y-3">
                {Array.from(grouped.entries())
                  .sort((a, b) => orderOverride ? orderOverride(a[0]) - orderOverride(b[0]) : 0)
                  .map(([cat, data]) => (
                  <div key={cat} className="rounded-lg p-3" style={{ backgroundColor: data.color + '18', borderLeft: `4px solid ${data.color}` }}>
                    <div className="text-sm font-bold mb-1" style={{ color: data.color }}>{cat}</div>
                    <div className="flex flex-wrap gap-1">
                      {data.residents.map((r, i) => (
                        <span key={i} className={`text-xs bg-white rounded px-2 py-1 shadow-sm ${r.isMe ? 'ring-1 ring-black font-bold' : ''}`}>
                          {r.name}{r.isMe ? ' ★' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
