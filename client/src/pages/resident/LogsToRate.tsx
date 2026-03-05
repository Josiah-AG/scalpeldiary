import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format } from 'date-fns';
import { X, AlertCircle } from 'lucide-react';

export default function LogsToRate() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [currentYear, setCurrentYear] = useState<number>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentYear();
    fetchLogs();
  }, []);

  const fetchCurrentYear = async () => {
    try {
      const response = await api.get('/users/resident-years/me');
      if (response.data.length > 0) {
        const latestYear = response.data[response.data.length - 1];
        setCurrentYear(latestYear.year);
      }
    } catch (error) {
      console.error('Failed to fetch year');
    }
  };

  const fetchLogs = async () => {
    const response = await api.get('/logs/to-rate');
    setLogs(response.data);
  };

  const canRateProcedure = (log: any) => {
    // Cannot rate yourself
    if (log.resident_id === log.supervisor_id) {
      return false;
    }
    
    const category = log.procedure_category || 'MINOR_SURGERY';
    
    if (currentYear === 2) {
      return category === 'MINOR_SURGERY';
    }
    
    return currentYear >= 3;
  };

  const handleSelectLog = (log: any) => {
    setError('');
    
    // Check if trying to rate themselves
    if (log.resident_id === log.supervisor_id) {
      setError('You cannot rate your own procedures.');
      return;
    }
    
    if (!canRateProcedure(log)) {
      const category = log.procedure_category || 'MINOR_SURGERY';
      if (category !== 'MINOR_SURGERY') {
        setError('Only Minor Surgery procedures can be rated by Year 2. Other categories require Year 3 and above.');
        return;
      }
    }
    
    setSelectedLog(log);
  };

  const handleRate = async () => {
    if (!selectedLog) return;
    
    if (!canRateProcedure(selectedLog)) {
      setError('You do not have permission to rate this procedure.');
      return;
    }

    try {
      await api.post(`/logs/${selectedLog.id}/rate`, {
        rating: rating ? parseInt(rating) : null,
        comment,
      });
      alert('Log rated successfully');
      setSelectedLog(null);
      setRating('');
      setComment('');
      setError('');
      fetchLogs();
    } catch (error) {
      alert('Failed to rate log');
    }
  };

  const getCategoryBadge = (category: string) => {
    return 'bg-blue-100 text-blue-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      GENERAL_SURGERY: 'General Surgery',
      PEDIATRIC_SURGERY: 'Pediatric Surgery',
      ORTHOPEDIC_SURGERY: 'Orthopedic Surgery',
      UROLOGY: 'Urology',
      HEPATOBILIARY_SURGERY: 'Hepatobiliary Surgery',
      CARDIOTHORACIC_SURGERY: 'Cardiothoracic Surgery',
      OBGYN_SURGERY: 'OBGYN Surgery',
      PLASTIC_SURGERY: 'Plastic Surgery',
      MINOR_SURGERY: 'Minor Surgery',
    };
    return labels[category] || category;
  };

  return (
    <Layout title="Logs to Rate">
      {currentYear === 2 && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={20} />
            <div>
              <p className="text-blue-800 font-semibold">Year 2 Restrictions</p>
              <p className="text-blue-700 text-sm">You can only rate Minor Surgery procedures. Other categories require Year 3 or above.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="text-red-600 mr-3 mt-0.5" size={20} />
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Procedures Awaiting Your Rating</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                const canRate = canRateProcedure(log);
                return (
                  <tr key={log.id} className={!canRate ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.resident_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">Year {log.resident_year}</td>
                    <td className="px-6 py-4 text-sm">{log.procedure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadge(log.procedure_category || 'GENERAL_SURGERY')}`}>
                        {getCategoryLabel(log.procedure_category || 'GENERAL_SURGERY')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleSelectLog(log)}
                        className={`font-medium ${
                          canRate
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!canRate}
                      >
                        {canRate ? 'Rate' : 'Restricted'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No procedures awaiting your rating.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Rate Procedure</h3>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setError('');
                }}
                className="hover:bg-blue-800 p-2 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Resident</p>
                    <p className="font-semibold">{selectedLog.resident_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{format(new Date(selectedLog.date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Procedure</p>
                  <p className="font-semibold text-lg">{selectedLog.procedure}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diagnosis</p>
                  <p className="font-semibold">{selectedLog.diagnosis}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getCategoryBadge(selectedLog.procedure_category || 'GENERAL_SURGERY')}`}>
                      {getCategoryLabel(selectedLog.procedure_category || 'GENERAL_SURGERY')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-semibold">{selectedLog.surgery_role?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (0-100) <span className="text-gray-500">(Leave empty if not witnessed)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter rating"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Provide feedback on the procedure..."
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleRate}
                    disabled={!comment.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Submit Rating
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLog(null);
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
