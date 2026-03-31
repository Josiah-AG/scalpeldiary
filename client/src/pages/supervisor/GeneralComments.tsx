import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { MessageSquare, ChevronDown, ChevronRight, User, Send } from 'lucide-react';

export default function GeneralComments() {
  const [residents, setResidents] = useState<any[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [residentComments, setResidentComments] = useState<any[]>([]);

  useEffect(() => { fetchResidents(); }, []);

  const fetchResidents = async () => {
    try {
      const response = await api.get('/general-comments/residents-by-year');
      setResidents(response.data);
    } catch (error) {
      console.error('Failed to fetch residents');
    }
  };

  const fetchComments = async (residentId: string) => {
    try {
      const response = await api.get(`/general-comments/resident/${residentId}`);
      setResidentComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments');
    }
  };

  const handleSelectResident = async (resident: any) => {
    setSelectedResident(resident);
    setComment('');
    setIsAnonymous(false);
    await fetchComments(resident.id);
  };

  const handleSubmit = async () => {
    if (!comment.trim() || !selectedResident) return;
    setSubmitting(true);
    try {
      await api.post('/general-comments', {
        residentId: selectedResident.id,
        comment: comment.trim(),
        isAnonymous,
      });
      setComment('');
      setIsAnonymous(false);
      await fetchComments(selectedResident.id);
      alert('Comment added successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleYear = (year: number) => {
    const next = new Set(expandedYears);
    next.has(year) ? next.delete(year) : next.add(year);
    setExpandedYears(next);
  };

  const groupedByYear = [4, 3, 2, 1].map(year => ({
    year,
    residents: residents.filter(r => r.year === year),
  }));

  return (
    <Layout title="General Comments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Resident List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <h3 className="text-lg font-bold flex items-center"><MessageSquare className="mr-2" size={20} />Residents</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {groupedByYear.map(({ year, residents: yearResidents }) => (
                <div key={year}>
                  <button onClick={() => toggleYear(year)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-bold text-gray-800">Year {year} ({yearResidents.length})</span>
                    {expandedYears.has(year) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {expandedYears.has(year) && yearResidents.map(r => (
                    <button key={r.id} onClick={() => handleSelectResident(r)}
                      className={`w-full flex items-center space-x-3 px-6 py-3 hover:bg-blue-50 transition-colors ${selectedResident?.id === r.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                      {r.profile_picture ? (
                        <img src={r.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><User size={16} className="text-blue-600" /></div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Comment Form + History */}
        <div className="lg:col-span-2">
          {selectedResident ? (
            <div className="space-y-6">
              {/* Comment Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Comment for {selectedResident.name}</h3>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                  rows={4} placeholder="Write a general comment about this resident..." />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded" />
                    <span className="text-sm text-gray-700">Anonymous comment <span className="text-yellow-600 text-xs">(hidden from resident)</span></span>
                  </label>
                  <button onClick={handleSubmit} disabled={submitting || !comment.trim()}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium transition-colors">
                    <Send size={16} /><span>{submitting ? 'Sending...' : 'Submit'}</span>
                  </button>
                </div>
              </div>

              {/* Comment History */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Comment History ({residentComments.length})</h3>
                {residentComments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet for this resident</p>
                ) : (
                  <div className="space-y-3">
                    {residentComments.map((c: any) => (
                      <div key={c.id} className={`border-l-4 ${c.is_anonymous ? 'border-yellow-400 bg-yellow-50' : 'border-blue-400 bg-blue-50'} p-4 rounded-r-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 text-sm">{c.supervisor_name}</span>
                          <div className="flex items-center space-x-2">
                            {c.is_anonymous && (
                              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded text-xs font-bold">Anonymous</span>
                            )}
                            <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Select a resident to add or view comments</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
