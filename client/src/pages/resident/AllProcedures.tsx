import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format } from 'date-fns';
import { X, Edit2, Filter, Trash2 } from 'lucide-react';

export default function AllProcedures() {
  const [logs, setLogs] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Check if in read-only mode first
  const isReadOnlyModeCheck = sessionStorage.getItem('isReadOnlyMode') === 'true';
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    procedureCategory: '',
    placeOfPractice: '',
    supervisorId: '',
  });

  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    mrn: '',
    age: '',
    sex: 'MALE',
    diagnosis: '',
    procedure: '',
    procedureType: 'ELECTIVE',
    procedureCategory: 'GENERAL_SURGERY',
    placeOfPractice: 'Y12HMC',
    surgeryRole: 'PRIMARY_SUPERVISED',
    supervisorId: '',
    remark: '',
  });

  // Use the same check
  const isReadOnlyMode = isReadOnlyModeCheck;
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  useEffect(() => {
    fetchYears();
    fetchSupervisors();
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
      // Set to "all" by default
      setSelectedYear('all');
      // Fetch all logs immediately
      const logsResponse = await api.get(`/logs/resident/${viewingResidentId}`);
      setLogs(logsResponse.data);
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      // Set to "all" by default to show all years
      setSelectedYear('all');
    }
  };

  const isCurrentYear = (yearId: string) => {
    if (years.length === 0) return false;
    return yearId === years[years.length - 1].id;
  };

  const fetchSupervisors = async () => {
    const response = await api.get('/users/supervisors');
    setSupervisors(response.data);
  };

  const fetchLogs = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      if (years.length === 0) return; // Wait for years to load
      
      if (selectedYear === 'all') {
        // Fetch all logs across all years
        const response = await api.get(`/logs/resident/${viewingResidentId}`);
        setLogs(response.data);
      } else {
        const yearData = years.find(y => y.id === parseInt(selectedYear));
        if (yearData) {
          const response = await api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`);
          setLogs(response.data);
        }
      }
    } else {
      if (selectedYear === 'all') {
        // Fetch all logs across all years
        const params = new URLSearchParams(filters);
        const response = await api.get(`/logs/my-logs?${params}`);
        setLogs(response.data);
      } else {
        const params = new URLSearchParams({
          yearId: selectedYear,
          ...filters
        });
        const response = await api.get(`/logs/my-logs?${params}`);
        setLogs(response.data);
      }
    }
  };

  const handleEdit = (log: any) => {
    if (log.rating) {
      alert('Cannot edit a rated procedure');
      return;
    }
    setEditingLog(log);
    setEditFormData({
      date: log.date,
      mrn: log.mrn,
      age: log.age.toString(),
      sex: log.sex,
      diagnosis: log.diagnosis,
      procedure: log.procedure,
      procedureType: log.procedure_type,
      procedureCategory: log.procedure_category,
      placeOfPractice: log.place_of_practice,
      surgeryRole: log.surgery_role,
      supervisorId: log.supervisor_id,
      remark: log.remark || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    try {
      await api.put(`/logs/${editingLog.id}`, editFormData);
      alert('Procedure updated successfully');
      setShowEditModal(false);
      setEditingLog(null);
      fetchLogs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update procedure');
    }
  };

  const handleDelete = async (log: any) => {
    if (log.rating) {
      alert('Cannot delete a rated procedure');
      return;
    }

    if (confirm(`Are you sure you want to delete this procedure?\n\nProcedure: ${log.procedure}\nDate: ${format(new Date(log.date), 'MMM dd, yyyy')}`)) {
      try {
        await api.delete(`/logs/${log.id}`);
        alert('Procedure deleted successfully');
        fetchLogs();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete procedure');
      }
    }
  };

  const getRowColor = (log: any) => {
    if (!log.rating) return 'bg-gray-100';
    return log.rating > 50 ? 'bg-green-50' : 'bg-red-50';
  };

  const getRatingBadge = (rating: number | null) => {
    if (!rating) return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm">Unrated</span>;
    const color = rating > 50 ? 'bg-green-500' : 'bg-red-500';
    return <span className={`px-3 py-1 rounded-full ${color} text-white font-semibold text-sm`}>{rating}/100</span>;
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
    <Layout title="All Procedures">
      {/* Year Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Year (View)</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              Year {year.year} {year.id === years[years.length - 1]?.id ? '(Current)' : ''}
            </option>
          ))}
        </select>
        {selectedYear !== 'all' && !isCurrentYear(selectedYear) && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Viewing previous year - New procedures can only be added for your current year
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Filter className="mr-2 text-blue-600" size={20} />
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <select
                value={filters.placeOfPractice}
                onChange={(e) => setFilters({ ...filters, placeOfPractice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="Y12HMC">Y12HMC</option>
                <option value="ALERT">ALERT</option>
                <option value="ABEBECH_GOBENA">Abebech Gobena</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Category</label>
              <select
                value={filters.procedureCategory}
                onChange={(e) => setFilters({ ...filters, procedureCategory: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="GENERAL_SURGERY">General Surgery</option>
                <option value="PEDIATRIC_SURGERY">Pediatric Surgery</option>
                <option value="ORTHOPEDIC_SURGERY">Orthopedic Surgery</option>
                <option value="UROLOGY">Urology</option>
                <option value="HEPATOBILIARY_SURGERY">Hepatobiliary Surgery</option>
                <option value="CARDIOTHORACIC_SURGERY">Cardiothoracic Surgery</option>
                <option value="OBGYN_SURGERY">OBGYN Surgery</option>
                <option value="PLASTIC_SURGERY">Plastic Surgery</option>
                <option value="MINOR_SURGERY">Minor Surgery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
              <select
                value={filters.supervisorId}
                onChange={(e) => setFilters({ ...filters, supervisorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {supervisors.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sex</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">MRN</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className={`${getRowColor(log)} hover:opacity-75 transition-opacity cursor-pointer`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.sex}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.mrn}</td>
                  <td className="px-6 py-4 text-sm">{log.diagnosis}</td>
                  <td className="px-6 py-4 text-sm font-medium">{log.procedure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {getCategoryLabel(log.procedure_category || 'GENERAL_SURGERY')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{log.surgery_role?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.place_of_practice}</td>
                  <td className="px-6 py-4 text-sm">{log.supervisor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getRatingBadge(log.rating)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </button>
                    {!log.rating && !isReadOnlyMode && (
                      <>
                        <button
                          onClick={() => handleEdit(log)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit procedure"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(log)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete procedure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Procedure Details</h3>
              <button onClick={() => setSelectedLog(null)} className="hover:bg-blue-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="text-gray-900">{selectedLog.procedure_category || 'MINOR'}</p>
                </div>
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
              <div>
                <label className="text-sm font-semibold text-gray-600">Supervisor</label>
                <p className="text-gray-900">{selectedLog.supervisor_name}</p>
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
              {!selectedLog.rating && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-blue-800 font-medium">This procedure has not been rated yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold">Edit Procedure</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLog(null);
                }}
                className="hover:bg-green-800 p-2 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRN</label>
                  <input
                    type="text"
                    value={editFormData.mrn}
                    onChange={(e) => setEditFormData({ ...editFormData, mrn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                  <select
                    value={editFormData.sex}
                    onChange={(e) => setEditFormData({ ...editFormData, sex: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Type</label>
                  <select
                    value={editFormData.procedureType}
                    onChange={(e) => setEditFormData({ ...editFormData, procedureType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="ELECTIVE">Elective</option>
                    <option value="SEMI_ELECTIVE">Semi-Elective</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Category</label>
                  <select
                    value={editFormData.procedureCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, procedureCategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="GENERAL_SURGERY">General Surgery</option>
                    <option value="PEDIATRIC_SURGERY">Pediatric Surgery</option>
                    <option value="ORTHOPEDIC_SURGERY">Orthopedic Surgery</option>
                    <option value="UROLOGY">Urology</option>
                    <option value="HEPATOBILIARY_SURGERY">Hepatobiliary Surgery</option>
                    <option value="CARDIOTHORACIC_SURGERY">Cardiothoracic Surgery</option>
                    <option value="OBGYN_SURGERY">OBGYN Surgery</option>
                    <option value="PLASTIC_SURGERY">Plastic Surgery</option>
                    <option value="MINOR_SURGERY">Minor Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Place of Practice</label>
                  <select
                    value={editFormData.placeOfPractice}
                    onChange={(e) => setEditFormData({ ...editFormData, placeOfPractice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Y12HMC">Y12HMC</option>
                    <option value="ALERT">ALERT</option>
                    <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surgery Role</label>
                  <select
                    value={editFormData.surgeryRole}
                    onChange={(e) => setEditFormData({ ...editFormData, surgeryRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="PRIMARY_SUPERVISED">Primary Supervised</option>
                    <option value="FIRST_ASSISTANT">First Assistant</option>
                    <option value="SECOND_ASSISTANT">Second Assistant</option>
                    <option value="THIRD_ASSISTANT">Third Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <input
                    type="text"
                    value={editFormData.diagnosis}
                    onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
                  <input
                    type="text"
                    value={editFormData.procedure}
                    onChange={(e) => setEditFormData({ ...editFormData, procedure: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                  <select
                    value={editFormData.supervisorId}
                    onChange={(e) => setEditFormData({ ...editFormData, supervisorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((supervisor: any) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remark (Optional)</label>
                  <textarea
                    value={editFormData.remark}
                    onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Additional notes or remarks..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Update Procedure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLog(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
