import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function AllComments() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [commentFilter, setCommentFilter] = useState<'all' | 'excellent' | 'good' | 'bad'>('all');
  const navigate = useNavigate();

  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  useEffect(() => { fetchYears(); }, []);
  useEffect(() => { if (selectedYear) fetchAnalytics(); }, [selectedYear]);

  const fetchYears = async () => {
    const url = isReadOnlyMode && viewingResidentId
      ? `/users/resident-years/${viewingResidentId}`
      : '/users/resident-years/me';
    const response = await api.get(url);
    setYears(response.data);
    if (response.data.length > 0) setSelectedYear(response.data[response.data.length - 1].id);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/analytics/resident?yearId=${selectedYear}`;
      if (isReadOnlyMode && viewingResidentId) url += `&residentId=${viewingResidentId}`;
      const response = await api.get(url);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const filteredComments = analytics?.comments?.filter((comment: any) => {
    if (commentFilter === 'all') return true;
    if (commentFilter === 'excellent') return comment.rating >= 90;
    if (commentFilter === 'good') return comment.rating >= 71 && comment.rating < 90;
    if (commentFilter === 'bad') return comment.rating < 50;
    return true;
  }) || [];

  // Build unified comment list
  const allComments: any[] = [];
  (filteredComments || []).forEach((c: any) => {
    if (c.comment && c.comment.trim() !== '') allComments.push({ ...c, type: 'procedure', sortDate: c.date });
    if (c.postop_followup_comment && c.postop_followup_comment.trim() !== '') allComments.push({ ...c, type: 'postop', sortDate: c.postop_followup_at });
  });
  (analytics?.presentationComments || []).forEach((c: any) => {
    if (commentFilter === 'all' ||
        (commentFilter === 'excellent' && c.rating >= 90) ||
        (commentFilter === 'good' && c.rating >= 71 && c.rating < 90) ||
        (commentFilter === 'bad' && c.rating < 50)) {
      allComments.push({ ...c, type: 'presentation', sortDate: c.date, procedure: c.title });
    }
  });
  allComments.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  if (loading) {
    return (
      <Layout title="All Comments">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="All Supervisor Comments">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Analytics</span>
        </button>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                Year {year.year} {year.id === years[years.length - 1]?.id ? '(Current)' : ''}
              </option>
            ))}
          </select>
          <select
            value={commentFilter}
            onChange={(e) => setCommentFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Comments</option>
            <option value="excellent">Excellent (90+)</option>
            <option value="good">Good (71-89)</option>
            <option value="bad">Poor (&lt;50)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="mr-2 text-blue-600" size={20} />
          All Supervisor Comments ({allComments.length})
        </h3>
        <div className="space-y-4">
          {allComments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments match the selected filter</p>
          ) : (
            allComments.map((item: any, index: number) => (
              <div
                key={`${item.id}-${item.type}-${index}`}
                className={`border-l-4 ${item.type === 'postop' ? 'border-purple-500 bg-purple-50' : item.type === 'presentation' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'} p-4 rounded-r-lg`}
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
                      item.type === 'postop' ? 'bg-purple-500 text-white' : item.type === 'presentation' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
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
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
