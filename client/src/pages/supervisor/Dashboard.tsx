import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Users, ChevronRight, FileText, Presentation, TrendingUp, Activity, Star, User, CalendarDays, ClipboardCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const response = await api.get('/analytics/supervisor');
    setAnalytics(response.data);
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
          onClick={() => navigate('/rated-procedures')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Surgeries Supervised</h3>
          <p className="text-4xl font-bold mb-2">{analytics?.totalSurgeries || 0}</p>
          <p className="text-xs opacity-75">Click to view all rated procedures →</p>
        </button>

        <button
          onClick={() => navigate('/rated-presentations')}
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
          <p className="text-xs opacity-75">Click to view all rated presentations →</p>
        </button>

        <button
          onClick={() => setShowRotationsModal(true)}
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
          onClick={() => setShowActivitiesModal(true)}
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

      {/* Rotations Modal */}
      {showRotationsModal && <RotationsViewModal onClose={() => setShowRotationsModal(false)} />}

      {/* Activities Modal */}
      {showActivitiesModal && <ActivitiesViewModal onClose={() => setShowActivitiesModal(false)} />}
    </Layout>
  );
}

// Rotations View Modal Component
function RotationsViewModal({ onClose }: { onClose: () => void }) {
  const [rotations, setRotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRotations();
  }, []);

  const fetchRotations = async () => {
    try {
      const response = await api.get('/rotations');
      setRotations(response.data);
    } catch (error) {
      console.error('Failed to fetch rotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];

  // Group rotations by resident
  const rotationsByResident = rotations.reduce((acc: any, rotation: any) => {
    if (!acc[rotation.resident_id]) {
      acc[rotation.resident_id] = {
        resident_name: rotation.resident_name,
        rotations: []
      };
    }
    acc[rotation.resident_id].rotations.push(rotation);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <CalendarDays className="mr-3" size={28} />
            Yearly Rotation Schedule - All Residents
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading rotations...</p>
            </div>
          ) : Object.keys(rotationsByResident).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(rotationsByResident).map(([residentId, data]: [string, any]) => (
                <div key={residentId} className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{data.resident_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {months.map((month, index) => {
                      const rotation = data.rotations.find((r: any) => r.month === index + 1);
                      return (
                        <div
                          key={month}
                          className="border-2 rounded-lg p-3 transition-all"
                          style={{
                            borderColor: rotation?.color || '#E5E7EB',
                            backgroundColor: rotation ? `${rotation.color}15` : '#FFFFFF'
                          }}
                        >
                          <div className="text-xs font-semibold text-gray-600 mb-2">{month}</div>
                          {rotation ? (
                            <div
                              className="px-2 py-1 rounded text-xs font-bold text-white text-center"
                              style={{ backgroundColor: rotation.color }}
                            >
                              {rotation.category_name}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-1">
                              Not assigned
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No rotations assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Activities View Modal Component
function ActivitiesViewModal({ onClose }: { onClose: () => void }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchActivities();
  }, [currentMonth]);

  const fetchActivities = async () => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const response = await api.get(`/activities?month=${month}&year=${year}`);
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <ClipboardCheck className="mr-3" size={28} />
            Monthly Activities - All Residents
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-semibold"
            >
              ← Previous
            </button>
            <h3 className="text-xl font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-semibold"
            >
              Next →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50 rounded-lg p-2 min-h-[100px]"></div>
              ))}
              
              {/* Calendar days */}
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayActivities = activityMap.get(dateStr) || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={dateStr}
                    className={`border-2 rounded-lg p-2 min-h-[100px] ${
                      isToday ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      isToday ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayActivities.map((activity: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs p-1 rounded text-white truncate"
                          style={{ backgroundColor: activity.color || '#F59E0B' }}
                          title={`${activity.resident_name}: ${activity.activity_name}`}
                        >
                          {activity.resident_name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
