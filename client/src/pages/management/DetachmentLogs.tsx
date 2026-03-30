import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { ArrowLeft, X, MapPin, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RATING_GUIDE } from '../../utils/ratingUtils';

export default function DetachmentLogs() {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [detailLogs, setDetailLogs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyRating, setVerifyRating] = useState('');
  const [verifyComment, setVerifyComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/logs/detachment-summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch detachment summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (group: any) => {
    setSelectedGroup(group);
    setDetailLoading(true);
    try {
      const params = group.detachment_month ? `?month=${group.detachment_month}` : '';
      const response = await api.get(`/logs/detachment/${group.resident_id}/${group.detachment_type}${params}`);
      setDetailLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch detachment details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedGroup || !verifyRating) return;
    try {
      await api.post('/logs/detachment-verify', {
        residentId: selectedGroup.resident_id,
        detachmentType: selectedGroup.detachment_type,
        rating: parseInt(verifyRating),
        comment: verifyComment,
        month: selectedGroup.detachment_month || null,
      });
      alert('Detachment logs verified successfully');
      setShowVerifyModal(false);
      setVerifyRating('');
      setVerifyComment('');
      fetchSummary();
      viewDetails(selectedGroup);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to verify');
    }
  };

  const getDetachmentLabel = (type: string) => {
    const labels: Record<string, string> = {
      ALERT: 'ALERT', ORTHOPEDICS: 'Orthopedics', TASH: 'TASH', ABEBECH_GOBENA: 'Abebech Gobena',
      ER: 'ER', ANESTHESIOLOGY: 'Anesthesiology', ICU: 'ICU'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout title="Detachment Logs">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Detachment Logs">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium mb-6">
        <ArrowLeft size={20} /><span>Back</span>
      </button>

      {!selectedGroup ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold flex items-center"><MapPin className="mr-2" size={24} />Detachment Logs Summary</h3>
          </div>
          {summary.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No detachment logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detachment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Procedures</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Presentations</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.map((group, idx) => (
                    <tr key={idx} className="hover:bg-amber-50 cursor-pointer transition-colors" onClick={() => viewDetails(group)}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.resident_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Year {group.year}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">{getDetachmentLabel(group.detachment_type)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {group.detachment_month ? new Date(group.detachment_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-blue-600">{group.procedure_count}</td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-green-600">{group.presentation_count}</td>
                      <td className="px-6 py-4 text-center">
                        {group.batch_verified ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center justify-center">
                            <CheckCircle size={14} className="mr-1" />Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelectedGroup(null)} className="flex items-center space-x-2 text-amber-600 hover:text-amber-800 font-medium mb-4">
            <ArrowLeft size={18} /><span>Back to Summary</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedGroup.resident_name}</h3>
                <p className="text-amber-100 text-sm">
                  Year {selectedGroup.year} · {getDetachmentLabel(selectedGroup.detachment_type)} Detachment
                  {selectedGroup.detachment_month && ` · ${new Date(selectedGroup.detachment_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </p>
              </div>
              {!selectedGroup.batch_verified && (
                <button onClick={() => setShowVerifyModal(true)} className="bg-white text-amber-700 px-4 py-2 rounded-lg font-semibold hover:bg-amber-50 transition-colors">
                  Verify All Logs
                </button>
              )}
            </div>

            {detailLoading ? (
              <div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRN/Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailLogs.map((log) => (
                      <tr key={log.id} className={log.detachment_verified ? 'bg-green-50' : log.status !== 'PENDING' ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-3 text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.item_type === 'presentation' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {log.item_type === 'presentation' ? 'Presentation' : 'Procedure'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{log.mrn || log.title}</td>
                        <td className="px-4 py-3 text-sm">{log.procedure || log.presentation_type?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-sm">{log.supervisor_name || log.external_supervisor_name || 'External'}</td>
                        <td className="px-4 py-3 text-sm">
                          {log.detachment_verified ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Verified</span>
                          ) : log.status !== 'PENDING' ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Rated by Resident</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedGroup.batch_verified && selectedGroup.detachment_rating && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-2">Detachment Verification</h4>
              <p className="text-sm text-gray-600">Rating: <span className="font-bold text-lg">{selectedGroup.detachment_rating}/100</span></p>
              {selectedGroup.detachment_comment && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">{selectedGroup.detachment_comment}</p>}
            </div>
          )}
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-lg font-bold">Verify Detachment Logs</h3>
              <button onClick={() => setShowVerifyModal(false)} className="hover:bg-green-800 p-2 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Verifying all unverified {getDetachmentLabel(selectedGroup.detachment_type)} logs for {selectedGroup.resident_name}.
                Enter the rating and comment from the paper form.
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{RATING_GUIDE}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-100)</label>
                <input type="number" min="0" max="100" value={verifyRating} onChange={(e) => setVerifyRating(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea value={verifyComment} onChange={(e) => setVerifyComment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" rows={3}
                  placeholder="Comment from the detachment paper form..." />
              </div>
              <div className="flex space-x-3">
                <button onClick={handleVerify} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">Verify All</button>
                <button onClick={() => setShowVerifyModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
