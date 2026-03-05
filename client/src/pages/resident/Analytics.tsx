import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity, Award, TrendingUp, MessageSquare, Calendar, Building2 } from 'lucide-react';
import YearProgressBar from '../../components/YearProgressBar';
import ProgressDetailModal from '../../components/ProgressDetailModal';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [yearProgress, setYearProgress] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'excellent' | 'good' | 'bad'>('all');

  // Check if in read-only mode
  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchAnalytics();
      fetchYearProgress();
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      const response = await api.get(`/users/resident-years/${viewingResidentId}`);
      setYears(response.data);
      if (response.data.length > 0) {
        setSelectedYear(response.data[response.data.length - 1].id);
      }
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      if (response.data.length > 0) {
        setSelectedYear(response.data[response.data.length - 1].id);
      }
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/analytics/resident?yearId=${selectedYear}`;
      if (isReadOnlyMode && viewingResidentId) {
        url += `&residentId=${viewingResidentId}`;
      }
      const response = await api.get(url);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearProgress = async () => {
    try {
      const url = isReadOnlyMode && viewingResidentId
        ? `/progress/year/${selectedYear}?residentId=${viewingResidentId}`
        : `/progress/year/${selectedYear}`;
      const response = await api.get(url);
      setYearProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch year progress');
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const roleData = analytics?.roleDistribution
    ? Object.entries(analytics.roleDistribution).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        value,
      }))
    : [];

  const procedureTypeData = analytics?.procedureTypeDistribution
    ? Object.entries(analytics.procedureTypeDistribution).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        value,
      }))
    : [];

  // Get top 5 categories by count that resident has recorded
  const unitPerformanceData = analytics?.categoryDistribution
    ?.map((cat: any) => ({
      name: cat.procedure_category?.replace(/_/g, ' ') || 'Unknown',
      count: parseInt(cat.count)
    }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5) || [];

  // Filter comments based on rating
  const filteredComments = analytics?.comments?.filter((comment: any) => {
    if (commentFilter === 'all') return true;
    if (commentFilter === 'excellent') return comment.rating > 80;
    if (commentFilter === 'good') return comment.rating > 50 && comment.rating <= 80;
    if (commentFilter === 'bad') return comment.rating <= 50;
    return true;
  }) || [];

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      {/* Year Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Year (View)</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              Year {year.year} {year.id === years[years.length - 1]?.id ? '(Current)' : ''}
            </option>
          ))}
        </select>
        {selectedYear !== years[years.length - 1]?.id && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Viewing previous year analytics - New logs can only be added for current year
          </p>
        )}
      </div>

      {/* Year Progress Bar */}
      {yearProgress && (
        <div className="mb-8">
          <YearProgressBar 
            progress={yearProgress} 
            onClick={() => setShowProgressModal(true)}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity size={24} className="text-blue-100" />
          </div>
          <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Surgeries</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.totalSurgeries || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={24} className="text-green-100" />
          </div>
          <p className="text-green-100 text-xs sm:text-sm font-medium">This Month</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.monthSurgeries || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award size={24} className="text-purple-100" />
          </div>
          <p className="text-purple-100 text-xs sm:text-sm font-medium">Total Presentations</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.totalPresentations || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="text-orange-100" />
          </div>
          <p className="text-orange-100 text-xs sm:text-sm font-medium">Avg Rating</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.averageRating?.toFixed(1) || 'N/A'}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award size={24} className="text-pink-100" />
          </div>
          <p className="text-pink-100 text-xs sm:text-sm font-medium">Senior Rating</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.seniorSupervisorRating?.toFixed(1) || 'N/A'}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award size={24} className="text-indigo-100" />
          </div>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium">Presentation Rating</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{analytics?.avgPresentationRating?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Role Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="mr-2 text-blue-600" size={20} />
            Role Distribution
          </h3>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>

        {/* Procedure Type Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Building2 className="mr-2 text-green-600" size={20} />
            Procedure Type
          </h3>
          {procedureTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={procedureTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {procedureTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Unit Performance and Top Procedures - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Unit Performance */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-purple-600" size={20} />
            Unit Performance
          </h3>
          {unitPerformanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unitPerformanceData.map((unit: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-purple-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{unit.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-purple-600">
                        {unit.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>

        {/* Top Procedures */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" size={20} />
            Top Procedures
          </h3>
          {analytics?.topProcedures && analytics.topProcedures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.topProcedures.map((proc: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{proc.procedure}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-600">{proc.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Institution Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Building2 className="mr-2 text-blue-600" size={20} />
            Procedures by Institution
          </h3>
          {analytics?.institutionProcedures && analytics.institutionProcedures.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.institutionProcedures.map((inst: any) => ({
                      name: inst.place_of_practice === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : inst.place_of_practice,
                      value: parseInt(inst.count)
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {analytics.institutionProcedures.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.institutionProcedures.map((inst: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inst.place_of_practice === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : inst.place_of_practice}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-right text-blue-600">{inst.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Building2 className="mr-2 text-green-600" size={20} />
            Presentations by Institution
          </h3>
          {analytics?.institutionPresentations && analytics.institutionPresentations.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.institutionPresentations.map((inst: any) => ({
                      name: inst.venue === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : inst.venue,
                      value: parseInt(inst.count)
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {analytics.institutionPresentations.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.institutionPresentations.map((inst: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inst.venue === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : inst.venue}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-right text-green-600">{inst.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <MessageSquare className="mr-2 text-blue-600" size={20} />
            Supervisor Comments
          </h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={commentFilter}
              onChange={(e) => setCommentFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Comments</option>
              <option value="excellent">Excellent (&gt;80%)</option>
              <option value="good">Good (50-80%)</option>
              <option value="bad">Needs Improvement (&lt;50%)</option>
            </select>
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredComments.map((comment: any, index: number) => (
            <div 
              key={index} 
              className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{comment.supervisor_name}</p>
                  <p className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</p>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  comment.rating > 50 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {comment.rating}/100
                </span>
              </div>
              <p className="text-gray-700 text-sm">{comment.comment}</p>
            </div>
          ))}
          {filteredComments.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              {analytics?.comments?.length > 0 
                ? 'No comments match the selected filter' 
                : 'No comments yet'}
            </p>
          )}
        </div>
      </div>

      {/* Progress Detail Modal */}
      {showProgressModal && yearProgress && (
        <ProgressDetailModal
          progress={yearProgress}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </Layout>
  );
}
