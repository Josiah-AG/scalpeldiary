import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity, Award, TrendingUp, MessageSquare, Calendar, Building2, UserCheck } from 'lucide-react';
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
  const navigate = useNavigate();

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

  // Map specific colors for procedure types
  const PROCEDURE_TYPE_COLORS: Record<string, string> = {
    'ELECTIVE': '#3b82f6',
    'SEMI ELECTIVE': '#f59e0b',
    'EMERGENCY': '#ef4444',
  };

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
    if (commentFilter === 'excellent') return comment.rating >= 90;
    if (commentFilter === 'good') return comment.rating >= 71 && comment.rating < 90;
    if (commentFilter === 'bad') return comment.rating < 50;
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
          {analytics?.verifiedSurgeries != null && (
            <p className="text-blue-200 text-xs mt-1">({analytics.verifiedSurgeries} Verified)</p>
          )}
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
          {analytics?.verifiedPresentations != null && (
            <p className="text-purple-200 text-xs mt-1">({analytics.verifiedPresentations} Verified)</p>
          )}
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
                  cy="45%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${Math.round(percent * 100)}%)`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: string) => [value, name]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                  cy="45%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${Math.round(percent * 100)}%)`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {procedureTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROCEDURE_TYPE_COLORS[entry.name.toUpperCase()] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: string) => [value, name]} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unitPerformanceData.map((unit: any, index: number) => {
                    const totalUnit = unitPerformanceData.reduce((s: number, u: any) => s + u.count, 0);
                    return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-purple-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{unit.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-purple-600">
                        {unit.count}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {totalUnit > 0 ? Math.round((unit.count / totalUnit) * 100) : 0}%
                      </td>
                    </tr>
                    );
                  })}
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
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.topProcedures.map((proc: any, index: number) => {
                    const totalProc = analytics.topProcedures.reduce((s: number, p: any) => s + parseInt(p.count), 0);
                    return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{proc.procedure}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-blue-600">{proc.count}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {totalProc > 0 ? Math.round((parseInt(proc.count) / totalProc) * 100) : 0}%
                      </td>
                    </tr>
                    );
                  })}
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
                    label={({ value, percent }) => `${value} (${Math.round(percent * 100)}%)`}
                    labelLine={false}
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
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.institutionProcedures.map((inst: any, index: number) => {
                      const totalInst = analytics.institutionProcedures.reduce((s: number, i: any) => s + parseInt(i.count), 0);
                      return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inst.place_of_practice === 'ABEBECH_GOBENA' ? 'Abebech Gobena' : inst.place_of_practice}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold text-right text-blue-600">{inst.count}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500">
                          {totalInst > 0 ? Math.round((parseInt(inst.count) / totalInst) * 100) : 0}%
                        </td>
                      </tr>
                      );
                    })}
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
            <UserCheck className="mr-2 text-green-600" size={20} />
            Procedures by Supervisor
          </h3>
          {analytics?.supervisorDistribution && analytics.supervisorDistribution.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Procedures</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.supervisorDistribution.map((sup: any, index: number) => {
                    const totalSup = analytics.supervisorDistribution.reduce((s: number, sv: any) => s + parseInt(sv.count), 0);
                    return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{sup.supervisor_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-green-600">{sup.count}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {totalSup > 0 ? Math.round((parseInt(sup.count) / totalSup) * 100) : 0}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        {sup.avg_rating ? (
                          <span className={sup.avg_rating > 50 ? 'text-green-600' : 'text-red-600'}>
                            {sup.avg_rating}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Supervisor Comments Section - unified list */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
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
              <option value="excellent">Excellent (90+)</option>
              <option value="good">Good (71-89)</option>
              <option value="bad">Poor (&lt;50)</option>
            </select>
          </div>
        </div>
        <div className="space-y-4 overflow-y-auto">
          {(() => {
            // Build unified comment list from procedure comments + post-op follow-ups + presentation comments
            const allComments: any[] = [];
            (filteredComments || []).forEach((c: any) => {
              if (c.comment && c.comment.trim() !== '') {
                allComments.push({ ...c, type: 'procedure', sortDate: c.date });
              }
              if (c.postop_followup_comment && c.postop_followup_comment.trim() !== '') {
                allComments.push({ ...c, type: 'postop', sortDate: c.postop_followup_at });
              }
            });
            // Add presentation comments
            (analytics?.presentationComments || []).forEach((c: any) => {
              if (commentFilter === 'all' ||
                  (commentFilter === 'excellent' && c.rating >= 90) ||
                  (commentFilter === 'good' && c.rating >= 71 && c.rating < 90) ||
                  (commentFilter === 'bad' && c.rating < 50)) {
                allComments.push({ ...c, type: 'presentation', sortDate: c.date, procedure: c.title });
              }
            });
            allComments.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

            const displayComments = allComments.slice(0, 10);
            const hasMore = allComments.length > 10;

            if (allComments.length === 0) {
              return (
                <p className="text-gray-500 text-center py-8">
                  {analytics?.comments?.length > 0 
                    ? 'No comments match the selected filter' 
                    : 'No comments yet'}
                </p>
              );
            }

            return (
              <>
                {displayComments.map((item: any, index: number) => (
                  <div 
                    key={`${item.id}-${item.type}-${index}`} 
                    className={`border-l-4 ${item.type === 'postop' ? 'border-purple-500 bg-purple-50' : item.type === 'presentation' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'} p-4 rounded-r-lg hover:opacity-90 transition-colors`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.supervisor_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.procedure && `${item.procedure} · `}
                          {new Date(item.sortDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.type === 'postop' 
                            ? 'bg-purple-500 text-white' 
                            : item.type === 'presentation'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {item.type === 'postop' ? 'Post-Op Follow-Up' : item.type === 'presentation' ? 'Presentation Comment' : 'Procedure Comment'}
                        </span>
                        {item.rating && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.rating >= 90 ? 'bg-green-500 text-white' : item.rating >= 71 ? 'bg-blue-500 text-white' : item.rating >= 50 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {item.rating >= 90 ? 'Excellent' : item.rating >= 71 ? 'Good' : item.rating >= 50 ? 'Satisfactory' : 'Poor'}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {item.type === 'postop' ? item.postop_followup_comment : item.comment}
                    </p>
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={() => navigate(isReadOnlyMode ? '/resident-view/all-comments' : '/all-comments')}
                    className="w-full py-3 text-center bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 font-semibold text-sm rounded-lg border border-blue-200 mt-2 transition-colors"
                  >
                    View All Comments ({allComments.length})
                  </button>
                )}
              </>
            );
          })()}
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
