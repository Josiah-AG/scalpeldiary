import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';

export default function UnrespondedLogs() {
  const location = useLocation();
  const [logs, setLogs] = useState<any[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<any>(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'procedures' | 'presentations'>(
    (location.state as any)?.activeTab || 'procedures'
  );

  useEffect(() => {
    fetchLogs();
    fetchPresentations();
  }, []);

  const fetchLogs = async () => {
    const response = await api.get('/logs/to-rate');
    setLogs(response.data);
  };

  const fetchPresentations = async () => {
    try {
      const response = await api.get('/presentations/to-rate');
      setPresentations(response.data);
    } catch (error) {
      console.error('Failed to fetch presentations to rate');
    }
  };

  const handleRate = async () => {
    try {
      await api.post(`/logs/${selectedLog.id}/rate`, {
        rating: rating ? parseInt(rating) : null,
        comment,
      });
      alert('Log rated successfully');
      setSelectedLog(null);
      setRating('');
      setComment('');
      fetchLogs();
    } catch (error) {
      alert('Failed to rate log');
    }
  };

  const handleRatePresentation = async () => {
    try {
      await api.post(`/presentations/${selectedPresentation.id}/rate`, {
        rating: rating ? parseInt(rating) : null,
        comment,
      });
      alert('Presentation rated successfully');
      setSelectedPresentation(null);
      setRating('');
      setComment('');
      fetchPresentations();
    } catch (error) {
      alert('Failed to rate presentation');
    }
  };

  return (
    <Layout title="Unresponded Logs">
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('procedures')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'procedures'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Procedures ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('presentations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'presentations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Presentations ({presentations.length})
          </button>
        </nav>
      </div>

      {/* Procedures Tab */}
      {activeTab === 'procedures' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{log.resident_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">Year {log.resident_year}</td>
                    <td className="px-6 py-4 text-sm">{log.procedure}</td>
                    <td className="px-6 py-4 text-sm">{log.diagnosis}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-semibold"
                      >
                        Rate
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No unresponded procedures
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{log.resident_name}</p>
                    <p className="text-xs text-gray-500">Year {log.resident_year}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-medium">Procedure:</span> {log.procedure}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Diagnosis:</span> {log.diagnosis}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLog(log);
                  }}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                >
                  Rate Procedure
                </button>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500">
                No unresponded procedures
              </div>
            )}
          </div>
        </div>
      )}

      {/* Presentations Tab */}
      {activeTab === 'presentations' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {presentations.map((pres) => (
                  <tr 
                    key={pres.id}
                    onClick={() => setSelectedPresentation(pres)}
                    className="cursor-pointer hover:bg-green-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(pres.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{pres.resident_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">Year {pres.resident_year}</td>
                    <td className="px-6 py-4 text-sm">{pres.title}</td>
                    <td className="px-6 py-4 text-sm">{pres.presentation_type}</td>
                    <td className="px-6 py-4 text-sm">{pres.venue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPresentation(pres);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-semibold"
                      >
                        Rate
                      </button>
                    </td>
                  </tr>
                ))}
                {presentations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No unresponded presentations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {presentations.map((pres) => (
              <div
                key={pres.id}
                onClick={() => setSelectedPresentation(pres)}
                className="p-4 hover:bg-green-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{pres.resident_name}</p>
                    <p className="text-xs text-gray-500">Year {pres.resident_year}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(pres.date).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-medium">Title:</span> {pres.title}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Type:</span> {pres.presentation_type}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Venue:</span> {pres.venue}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPresentation(pres);
                  }}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                >
                  Rate Presentation
                </button>
              </div>
            ))}
            {presentations.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500">
                No unresponded presentations
              </div>
            )}
          </div>
        </div>
      )}

      {/* Procedure Rating Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Rate Procedure</h3>
            <div 
              className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => {
                // Show detailed modal
                const detailModal = document.getElementById('procedure-detail-modal');
                if (detailModal) detailModal.style.display = 'block';
              }}
            >
              <p className="text-sm text-gray-600 mb-2">Click to view full details</p>
              <p><strong>Resident:</strong> {selectedLog.resident_name}</p>
              <p><strong>Diagnosis:</strong> {selectedLog.diagnosis}</p>
              <p><strong>Procedure:</strong> {selectedLog.procedure}</p>
              <p><strong>Role:</strong> {selectedLog.surgery_role?.replace(/_/g, ' ')}</p>
            </div>
            
            {/* Detailed Procedure Info (expandable) */}
            <div id="procedure-detail-modal" style={{ display: 'none' }} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">Full Procedure Details</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const detailModal = document.getElementById('procedure-detail-modal');
                    if (detailModal) detailModal.style.display = 'none';
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                <p><strong>Date:</strong> {new Date(selectedLog.date).toLocaleDateString()}</p>
                <p><strong>MRN:</strong> {selectedLog.mrn}</p>
                <p><strong>Age:</strong> {selectedLog.age}</p>
                <p><strong>Sex:</strong> {selectedLog.sex}</p>
                <p><strong>Diagnosis:</strong> {selectedLog.diagnosis}</p>
                <p><strong>Procedure:</strong> {selectedLog.procedure}</p>
                <p><strong>Procedure Type:</strong> {selectedLog.procedure_type?.replace(/_/g, ' ')}</p>
                <p><strong>Procedure Category:</strong> {selectedLog.procedure_category?.replace(/_/g, ' ')}</p>
                <p><strong>Place of Practice:</strong> {selectedLog.place_of_practice}</p>
                <p><strong>Surgery Role:</strong> {selectedLog.surgery_role?.replace(/_/g, ' ')}</p>
                {selectedLog.remark && <p><strong>Remark:</strong> {selectedLog.remark}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Leave empty if not witnessed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRate}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setSelectedLog(null);
                    setRating('');
                    setComment('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Rating Modal */}
      {selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Rate Presentation</h3>
            <div 
              className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => {
                // Show detailed modal
                const detailModal = document.getElementById('presentation-detail-modal');
                if (detailModal) detailModal.style.display = 'block';
              }}
            >
              <p className="text-sm text-gray-600 mb-2">Click to view full details</p>
              <p><strong>Resident:</strong> {selectedPresentation.resident_name}</p>
              <p><strong>Title:</strong> {selectedPresentation.title}</p>
              <p><strong>Type:</strong> {selectedPresentation.presentation_type?.replace(/_/g, ' ')}</p>
            </div>
            
            {/* Detailed Presentation Info (expandable) */}
            <div id="presentation-detail-modal" style={{ display: 'none' }} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">Full Presentation Details</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const detailModal = document.getElementById('presentation-detail-modal');
                    if (detailModal) detailModal.style.display = 'none';
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                <p><strong>Date:</strong> {new Date(selectedPresentation.date).toLocaleDateString()}</p>
                <p><strong>Title:</strong> {selectedPresentation.title}</p>
                <p><strong>Type:</strong> {selectedPresentation.presentation_type?.replace(/_/g, ' ')}</p>
                <p><strong>Venue:</strong> {selectedPresentation.venue}</p>
                {selectedPresentation.description && (
                  <p><strong>Description:</strong> {selectedPresentation.description}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Leave empty if not witnessed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRatePresentation}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setSelectedPresentation(null);
                    setRating('');
                    setComment('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
