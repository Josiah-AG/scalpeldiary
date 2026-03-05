import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format } from 'date-fns';
import { X, Filter } from 'lucide-react';

export default function RatedLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'rated', // Only show rated logs
  });

  // Check if in read-only mode
  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchLogs();
    }
  }, [selectedYear, filters]);

  const fetchYears = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      const response = await api.get(`/users/resident-years/${viewingResidentId}`);
      const yearsData = response.data;
      setYears(yearsData);
      if (yearsData.length > 0) {
        const yearId = yearsData[yearsData.length - 1].id;
        setSelectedYear(yearId);
        // Fetch logs immediately with the years data
        const yearData = yearsData.find((y: any) => y.id === yearId);
        if (yearData) {
          const logsResponse = await api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`);
          const ratedLogs = logsResponse.data.filter((log: any) => log.status !== 'PENDING');
          setLogs(ratedLogs);
        }
      }
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      if (response.data.length > 0) {
        setSelectedYear(response.data[response.data.length - 1].id);
      }
    }
  };

  const fetchLogs = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      if (years.length === 0) return; // Wait for years to load
      const yearData = years.find(y => y.id === parseInt(selectedYear));
      if (yearData) {
        const response = await api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`);
        const ratedLogs = response.data.filter((log: any) => log.status !== 'PENDING');
        setLogs(ratedLogs);
      }
    } else {
      // For Year 2+ residents, show logs they rated as supervisor
      const response = await api.get('/logs/rated');
      setLogs(response.data);
    }
  };

  const getRatingBadge = (rating: number | null, status: string) => {
    if (!rating || status === 'PENDING') {
      return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold text-xs sm:text-sm">Unrated</span>;
    }
    const color = rating > 50 ? 'bg-green-500' : 'bg-red-500';
    return <span className={`px-3 py-1 rounded-full ${color} text-white font-semibold text-xs sm:text-sm`}>{rating}/100</span>;
  };

  const getRowColor = (log: any) => {
    if (!log.rating) return 'bg-gray-50';
    return log.rating > 50 ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <Layout title="Rated Logs">
      {/* Year Selector */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              Year {year.year}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
            <Filter className="mr-2 text-blue-600" size={20} />
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`${getRowColor(log)} rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => setSelectedLog(log)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{log.procedure}</p>
                <p className="text-sm text-gray-600">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
              </div>
              {getRatingBadge(log.rating, log.status)}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700"><span className="font-medium">Resident:</span> {log.resident_name}</p>
              <p className="text-gray-700"><span className="font-medium">MRN:</span> {log.mrn}</p>
              <p className="text-gray-700"><span className="font-medium">Diagnosis:</span> {log.diagnosis}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No logs rated as supervisor yet
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Resident</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`${getRowColor(log)} hover:opacity-75 transition-opacity cursor-pointer`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-sm font-medium">{log.resident_name}</td>
                  <td className="px-6 py-4 text-sm font-medium">{log.procedure}</td>
                  <td className="px-6 py-4 text-sm">{log.diagnosis}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getRatingBadge(log.rating, log.status)}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{log.comment || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No logs rated as supervisor yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="text-lg sm:text-xl font-bold">Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="hover:bg-blue-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Resident</label>
                  <p className="text-gray-900">{selectedLog.resident_name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Date</label>
                  <p className="text-gray-900">{format(new Date(selectedLog.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">MRN</label>
                  <p className="text-gray-900">{selectedLog.mrn}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Age</label>
                  <p className="text-gray-900">{selectedLog.age}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Sex</label>
                  <p className="text-gray-900">{selectedLog.sex}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Diagnosis</label>
                <p className="text-gray-900">{selectedLog.diagnosis}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Procedure</label>
                <p className="text-gray-900 font-medium">{selectedLog.procedure}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Type</label>
                  <p className="text-gray-900">{selectedLog.procedure_type}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Institution</label>
                  <p className="text-gray-900">{selectedLog.place_of_practice}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Role</label>
                  <p className="text-gray-900">{selectedLog.surgery_role?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {selectedLog.rating && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Rating</label>
                    <p className="text-2xl font-bold text-blue-600">{selectedLog.rating}/100</p>
                  </div>
                  {selectedLog.comment && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Comment</label>
                      <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedLog.comment}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
