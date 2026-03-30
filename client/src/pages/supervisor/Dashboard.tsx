import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Users, ChevronRight, FileText, Presentation, TrendingUp, Activity, Star, User, CalendarDays, ClipboardCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { DutyModal, ActivityModal } from '../../components/TodayOverviewModals';

interface ResidentSummary {
  id: number;
  name: string;
  profilePicture: string | null;
  avgProcedureRating: number;
  avgPresentationRating: number;
  totalProcedures: number;
  totalPresentations: number;
  yearProgress?: {
    year: number;
    overallProgress: number;
    totalRequired: number;
    totalAchieved: number;
  };
}

export default function SupervisorDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [showRotationsModal, setShowRotationsModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [todayDuties, setTodayDuties] = useState<any[]>([]);
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [monthlyDuties, setMonthlyDuties] = useState<any[]>([]);
  const [monthlyActivities, setMonthlyActivities] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [rotationMonth, setRotationMonth] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
    fetchTodayDuties();
  }, []);

  const fetchAnalytics = async () => {
    const response = await api.get('/analytics/supervisor');
    setAnalytics(response.data);
  };

  const fetchTodayDuties = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const todayStr = format(today, 'yyyy-MM-dd');
      const response = await api.get('/duties/monthly/' + year + '/' + month);
      setMonthlyDuties(response.data);
      const duties = response.data.filter((d: any) => d.duty_date === todayStr);
      setTodayDuties(duties);
    } catch (error) {
      console.error('Failed to fetch today duties');
    }
  };

  const fetchMonthlyActivities = async () => {
    try {
      const now = new Date();
      const response = await api.get('/activities/monthly/' + now.getFullYear() + '/' + (now.getMonth() + 1));
      setMonthlyActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities');
    }
  };

  const fetchRotations = async () => {
    try {
      const response = await api.get('/rotations');
      setRotations(response.data);
    } catch (error) {
      console.error('Failed to fetch rotations');
    }
  };

  const fetchResidentsByYear = async (year: number) => {
    const response = await api.get(`/analytics/supervisor/residents?year=${year}`);
    const residentsData = response.data;
    
    // Fetch progress for each resident
    const residentsWithProgress = await Promise.all(
      residentsData.map(async (resident: ResidentSummary) => {
        try {
          // Get the resident's year ID
          const yearsResponse = await api.get(`/users/resident-years/${resident.id}`);
          const residentYears = yearsResponse.data;
          const currentYear = residentYears.find((y: any) => y.year === year);
          
          if (currentYear) {
            const progressResponse = await api.get(`/progress/year/${currentYear.id}?residentId=${resident.id}`);
            return {
              ...resident,
              yearProgress: progressResponse.data
            };
          }
        } catch (error) {
          console.error(`Failed to fetch progress for resident ${resident.id}:`, error);
        }
        return resident;
      })
    );
    
    setResidents(residentsWithProgress);
    setSelectedYear(year);
  };

  const viewResidentProfile = (residentId: number) => {
    // Store the resident ID in sessionStorage for read-only mode
    sessionStorage.setItem('viewingResidentId', residentId.toString());
    sessionStorage.setItem('isReadOnlyMode', 'true');
    navigate('/resident-view/dashboard');
  };

  return (
    <Layout title="Supervisor Dashboard">
      {/* Metrics - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => navigate('/ratings-done')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Procedures Supervised</h3>
          <p className="text-4xl font-bold mb-1">{analytics?.uniqueProcedures || 0}</p>
          <p className="text-xs opacity-75 mb-1">{analytics?.totalSurgeries || 0} resident logs</p>
          <p className="text-xs opacity-75">Click to view all ratings done →</p>
        </button>

        <button
          onClick={() => navigate('/ratings-done')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Presentation className="w-8 h-8" />
            </div>
            <Activity className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Presentations Supervised</h3>
          <p className="text-4xl font-bold mb-2">{analytics?.totalPresentations || 0}</p>
          <p className="text-xs opacity-75">Click to view all ratings done →</p>
        </button>

        <button
          onClick={() => { fetchRotations(); setShowRotationsModal(true); }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <CalendarDays className="w-8 h-8" />
            </div>
            <ChevronRight className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Yearly Rotations</h3>
          <p className="text-2xl font-bold mb-2">View Schedule</p>
          <p className="text-xs opacity-75">Click to view rotation calendar →</p>
        </button>

        <button
          onClick={() => { fetchMonthlyActivities(); setShowActivitiesModal(true); }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <ChevronRight className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Monthly Activities</h3>
          <p className="text-2xl font-bold mb-2">View Calendar</p>
          <p className="text-xs opacity-75">Click to view activity schedule →</p>
        </button>
      </div>

      {/* Today's Duty Residents */}
      <div 
        className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-indigo-500 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowDutyModal(true)}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center justify-between">
          <span className="flex items-center">
            <CalendarDays className="mr-2 text-indigo-600" size={22} />
            Today's Duty Residents — {format(new Date(), 'EEEE, MMM dd')}
          </span>
          <span className="text-xs text-indigo-500 font-medium">View Full Month →</span>
        </h3>
        {todayDuties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayDuties.map((duty: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: (duty.duty_color || '#6366F1') + '15' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: duty.duty_color || '#6366F1' }}></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{duty.resident_name}</p>
                  <p className="text-xs font-medium" style={{ color: duty.duty_color || '#6366F1' }}>{duty.duty_category_name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No duties assigned for today</p>
        )}
      </div>

      {/* Year Selection - Enhanced */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-bold mb-2">Browse Residents by Year</h3>
        <p className="text-indigo-100 text-sm">Select a year to view residents</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((year) => {
          const yearColors = [
            { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
            { bg: 'from-green-500 to-green-600', text: 'text-green-600' },
            { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600' },
            { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600' },
          ];
          const colors = yearColors[year - 1];
          const isSelected = selectedYear === year;
          
          return (
            <button
              key={year}
              onClick={() => fetchResidentsByYear(year)}
              className={`relative p-6 rounded-xl transition-all transform hover:scale-105 ${
                isSelected
                  ? `bg-gradient-to-br ${colors.bg} text-white shadow-xl`
                  : 'bg-white hover:shadow-lg border-2 border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-lg mb-3 mx-auto w-fit ${
                isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-100'
              }`}>
                <Users className={`w-10 h-10 ${isSelected ? 'text-white' : colors.text}`} />
              </div>
              <p className={`text-center font-bold text-xl ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                Year {year}
              </p>
            </button>
          );
        })}
      </div>

      {/* Residents List - Enhanced */}
      {selectedYear && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${
            selectedYear === 1 ? 'from-blue-500 to-blue-600' :
            selectedYear === 2 ? 'from-green-500 to-green-600' :
            selectedYear === 3 ? 'from-purple-500 to-purple-600' :
            'from-orange-500 to-orange-600'
          } text-white px-6 py-4`}>
            <h3 className="text-xl font-bold">
              Year {selectedYear} Residents
            </h3>
            <p className="text-sm opacity-90">
              {residents.length} resident{residents.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="p-6">
            {residents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No residents found for Year {selectedYear}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {residents.map((resident) => (
                  <div
                    key={resident.id}
                    onClick={() => viewResidentProfile(resident.id)}
                    className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      {resident.profilePicture ? (
                        <img 
                          src={resident.profilePicture} 
                          alt={resident.name}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-md">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{resident.name}</h4>
                        <p className="text-sm text-gray-500">Year {selectedYear} Resident</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Procedures */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-600 font-medium">Procedures</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{resident.totalProcedures}</p>
                        {resident.totalProcedures > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{resident.avgProcedureRating.toFixed(1)} avg</span>
                          </div>
                        )}
                      </div>

                      {/* Presentations */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Presentation className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 font-medium">Presentations</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{resident.totalPresentations}</p>
                        {resident.totalPresentations > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{resident.avgPresentationRating.toFixed(1)} avg</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Year Progress Bar */}
                    {resident.yearProgress && (
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-gray-700">Year {resident.yearProgress.year} Progress</span>
                          <span className="text-sm font-bold text-purple-600">
                            {resident.yearProgress.overallProgress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(resident.yearProgress.overallProgress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 text-center">
                          {resident.yearProgress.totalAchieved} / {resident.yearProgress.totalRequired} procedures
                        </p>
                      </div>
                    )}

                    {/* Click hint */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-center text-gray-400">
                        Click to view full profile →
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rotations Modal - Monthly view */}
      {showRotationsModal && (
        <RotationMonthModal 
          rotations={rotations} 
          currentMonth={rotationMonth}
          onMonthChange={setRotationMonth}
          onClose={() => setShowRotationsModal(false)} 
          onOpen={fetchRotations}
        />
      )}

      {/* Activities Modal - uses shared component */}
      {showActivitiesModal && (
        <ActivityModal
          isOpen={showActivitiesModal}
          onClose={() => setShowActivitiesModal(false)}
          activities={monthlyActivities}
        />
      )}

      {/* Monthly Duty Modal - uses shared component */}
      <DutyModal
        isOpen={showDutyModal}
        onClose={() => setShowDutyModal(false)}
        duties={monthlyDuties}
      />
    </Layout>
  );
}

// Rotation Month Modal - shows all residents' rotations for a selected month
function RotationMonthModal({ rotations, currentMonth, onMonthChange, onClose, onOpen }: { 
  rotations: any[]; currentMonth: Date; onMonthChange: (d: Date) => void; onClose: () => void; onOpen: () => void;
}) {
  useEffect(() => { onOpen(); }, []);

  // Academic year months: July=1, Aug=2, ..., June=12
  const academicMonths = [
    { name: 'July', num: 1 }, { name: 'August', num: 2 }, { name: 'September', num: 3 },
    { name: 'October', num: 4 }, { name: 'November', num: 5 }, { name: 'December', num: 6 },
    { name: 'January', num: 7 }, { name: 'February', num: 8 }, { name: 'March', num: 9 },
    { name: 'April', num: 10 }, { name: 'May', num: 11 }, { name: 'June', num: 12 }
  ];

  // Determine current academic month number
  const jsMonth = currentMonth.getMonth(); // 0-11
  const calendarMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonthName = calendarMonthNames[jsMonth];
  const currentAcademic = academicMonths.find(m => m.name === currentMonthName);
  const currentMonthNum = currentAcademic?.num || 1;

  // Group by category for this month, residents sorted senior to junior
  const categoryGroups = new Map<string, { color: string; residents: { name: string; year: number }[] }>();
  const byResident = new Map<string, any>();
  rotations.forEach(r => {
    if (!byResident.has(r.resident_id)) byResident.set(r.resident_id, { name: r.resident_name, year: r.resident_year || 1, rotations: [] });
    byResident.get(r.resident_id).rotations.push(r);
  });
  byResident.forEach((data) => {
    const rot = data.rotations.find((r: any) => r.month === currentMonthNum);
    const cat = rot?.category_name || 'Not assigned';
    const color = rot?.color || '#9CA3AF';
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, { color, residents: [] });
    categoryGroups.get(cat)!.residents.push({ name: data.name, year: data.year });
  });
  // Sort residents within each category: senior first
  categoryGroups.forEach(group => {
    group.residents.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
  });
  // Sort categories: assigned first (not "Not assigned"), then alphabetically
  const sortedCategories = Array.from(categoryGroups.entries()).sort((a, b) => {
    if (a[0] === 'Not assigned') return 1;
    if (b[0] === 'Not assigned') return -1;
    return a[0].localeCompare(b[0]);
  });

  const prevMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl shadow-2xl sm:max-w-2xl sm:max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <CalendarDays className="mr-2" size={20} />
            Rotations
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><span className="text-xl">×</span></button>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-semibold">← Prev</button>
            <h3 className="text-lg font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
            <button onClick={nextMonth} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-semibold">Next →</button>
          </div>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            {sortedCategories.length > 0 ? sortedCategories.map(([cat, group], idx) => (
              <div key={idx} className="rounded-lg overflow-hidden border-2" style={{ borderColor: group.color }}>
                <div className="px-3 py-2 text-white text-sm font-bold" style={{ backgroundColor: group.color }}>
                  {cat}
                </div>
                <div className="divide-y divide-gray-100">
                  {group.residents.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: group.color + '08' }}>
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Year {r.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No rotations data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
