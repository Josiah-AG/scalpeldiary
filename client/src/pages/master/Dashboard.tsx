import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Users, UserCheck, Shield, TrendingUp, Activity, CalendarDays, ClipboardCheck, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function MasterDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [showMasters, setShowMasters] = useState(false);
  const [showRotationsModal, setShowRotationsModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created'>('created');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data);
  };

  const residents = users.filter((u) => u.role === 'RESIDENT');
  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');
  const masters = users.filter((u) => u.role === 'MASTER');
  const activeUsers = users.filter((u) => !u.is_suspended);
  const suspendedUsers = users.filter((u) => u.is_suspended);

  // Sort users based on selected option
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // Default: sort by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Layout title="Master Dashboard">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Residents Card */}
        <button
          onClick={() => navigate('/browse-residents')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Residents</h3>
          <p className="text-4xl font-bold mb-2">{residents.length}</p>
          <p className="text-xs opacity-75">Click to browse by year →</p>
        </button>

        {/* Supervisors Card */}
        <button
          onClick={() => navigate('/browse-supervisors')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <UserCheck className="w-8 h-8" />
            </div>
            <Activity className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Supervisors</h3>
          <p className="text-4xl font-bold mb-2">{supervisors.length}</p>
          <p className="text-xs opacity-75">Click to view statistics →</p>
        </button>

        {/* Rotations Card */}
        <button
          onClick={() => setShowRotationsModal(true)}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
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

        {/* Activities Card */}
        <button
          onClick={() => setShowActivitiesModal(true)}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
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

        {/* Masters Card */}
        <button
          onClick={() => setShowMasters(!showMasters)}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <Activity className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Masters</h3>
          <p className="text-4xl font-bold mb-2">{masters.length}</p>
          <p className="text-xs opacity-75">Click to view list →</p>
        </button>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeUsers.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Suspended Users</h3>
              <p className="text-3xl font-bold text-red-600 mt-1">{suspendedUsers.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Masters List Modal */}
      {showMasters && (
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-500">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Master Accounts</h3>
            </div>
            <button
              onClick={() => setShowMasters(false)}
              className="text-white hover:text-purple-100"
            >
              ✕
            </button>
          </div>
          <div className="p-6">
            {masters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No master accounts found</p>
            ) : (
              <div className="space-y-3">
                {masters.map((master) => (
                  <div
                    key={master.id}
                    className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{master.name}</p>
                      <p className="text-sm text-gray-600">{master.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                      MASTER
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">All Users</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created">Date Created</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'MASTER' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rotations Modal */}
      {showRotationsModal && <RotationsViewModal onClose={() => setShowRotationsModal(false)} />}

      {/* Activities Modal */}
      {showActivitiesModal && <ActivitiesViewModal onClose={() => setShowActivitiesModal(false)} />}
    </Layout>
  );
}

// Reuse the same modal components from supervisor dashboard
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
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
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
                            <div className="text-gray-400 text-xs text-center py-1">Not assigned</div>
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
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-semibold"
            >
              ← Previous
            </button>
            <h3 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-gray-600 py-2">{day}</div>
              ))}
              
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50 rounded-lg p-2 min-h-[100px]"></div>
              ))}
              
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
