import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format } from 'date-fns';
import { X, Edit2, Filter, Trash2 } from 'lucide-react';
import { getAllCategories } from '@shared/procedureUtils';
import { useAuthStore } from '../../store/authStore';
import { getResidentRatingBadge, getSupervisorRatingBadge, canSeeExactScores, getRatingLabel, getRatingTextColor } from '../../utils/ratingUtils';

export default function AllProcedures() {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories] = useState<string[]>(getAllCategories());
  
  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');
  const { user } = useAuthStore();
  const isMaster = user?.role === 'MASTER';
  
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
    procedureCategory: 'GI Surgery',
    placeOfPractice: 'Y12HMC',
    surgeryRole: 'PRIMARY_SUPERVISED',
    supervisorId: '',
    remark: '',
  });

  useEffect(() => {
    fetchYears();
    fetchSupervisors();
  }, []);

  useEffect(() => {
    if (selectedYear || selectedYear === 'all') {
      fetchLogs();
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      const response = await api.get(`/users/resident-years/${viewingResidentId}`);
      setYears(response.data);
      setSelectedYear('all');
      const logsResponse = await api.get(`/logs/resident/${viewingResidentId}`);
      setAllLogs(logsResponse.data);
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      setSelectedYear('all');
    }
  };

  const isCurrentYear = (yearId: string) => {
    if (years.length === 0) return false;
    return yearId === String(years[years.length - 1].id);
  };

  const fetchSupervisors = async () => {
    const response = await api.get('/users/supervisors');
    setSupervisors(response.data);
  };

  const fetchLogs = async () => {
    try {
      if (isReadOnlyMode && viewingResidentId) {
        if (selectedYear === 'all') {
          const response = await api.get(`/logs/resident/${viewingResidentId}`);
          setAllLogs(response.data);
        } else {
          const yearData = years.find(y => y.id === parseInt(selectedYear));
          if (yearData) {
            const response = await api.get(`/logs/resident/${viewingResidentId}?year=${yearData.year}`);
            setAllLogs(response.data);
          }
        }
      } else {
        if (selectedYear === 'all') {
          const response = await api.get('/logs/my-logs?yearId=all');
          setAllLogs(response.data);
        } else {
          const response = await api.get('/logs/my-logs?yearId=' + selectedYear);
          setAllLogs(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  // Client-side filtering
  const filteredLogs = allLogs.filter(log => {
    if (filters.procedureCategory && log.procedure_category !== filters.procedureCategory) return false;
    if (filters.placeOfPractice && log.place_of_practice !== filters.placeOfPractice) return false;
    if (filters.supervisorId && log.supervisor_id !== filters.supervisorId) return false;
    if (filters.startDate && log.date < filters.startDate) return false;
    if (filters.endDate && log.date > filters.endDate) return false;
    return true;
  });

  const canEdit = (log: any) => {
    return log.status === 'PENDING' && !isReadOnlyMode;
  };

  const handleEdit = (log: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEdit(log)) {
      alert('Cannot edit a rated or confirmed procedure');
      return;
    }
    setEditingLog(log);
    setEditFormData({
      date: log.date?.split('T')[0] || log.date,
      mrn: log.mrn,
      age: log.age?.toString() || '',
      sex: log.sex,
      diagnosis: log.diagnosis,
      procedure: log.procedure,
      procedureType: log.procedure_type,
      procedureCategory: log.procedure_category || 'GI Surgery',
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
      await api.put('/logs/' + editingLog.id, editFormData);
      alert('Procedure updated successfully');
      setShowEditModal(false);
      setEditingLog(null);
      fetchLogs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update procedure');
    }
  };

  const handleDelete = async (log: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEdit(log) && !isMaster) {
      alert('Cannot delete a rated or confirmed procedure');
      return;
    }
    const endpoint = isMaster ? '/logs/master/' + log.id : '/logs/' + log.id;
    if (confirm('Are you sure you want to delete this procedure?\n\nProcedure: ' + log.procedure + '\nDate: ' + format(new Date(log.date), 'MMM dd, yyyy'))) {
      try {
        await api.delete(endpoint);
        alert('Procedure deleted successfully');
        fetchLogs();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete procedure');
      }
    }
  };

  const getRowColor = (log: any) => {
    if (log.status === 'NOT_WITNESSED') return 'bg-gray-100';
    if (!log.rating) return 'bg-white';
    return log.rating > 50 ? 'bg-green-50' : 'bg-red-50';
  };

  const showExactScores = canSeeExactScores(user?.role, isReadOnlyMode);

  const getRatingBadge = (rating: number | null, status: string) => {
    const badge = showExactScores ? getSupervisorRatingBadge(rating, status) : getResidentRatingBadge(rating, status);
    return <span className={'px-3 py-1 rounded-full font-semibold text-sm ' + badge.className}>{badge.text}</span>;
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No procedures found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add new procedures</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">MRN</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Procedure</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Supervisor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className={getRowColor(log) + ' hover:opacity-75 transition-opacity cursor-pointer'}
                    onClick={() => setSelectedLog(log)}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{log.mrn}</td>
                  <td className="px-4 py-3 text-sm font-medium">{log.procedure}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {log.procedure_category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.surgery_role?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm">{log.supervisor_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{getRatingBadge(log.rating, log.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    {canEdit(log) && (
                      <>
                        <button
                          onClick={(e) => handleEdit(log, e)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit procedure"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(log, e)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete procedure"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {isMaster && !canEdit(log) && (
                      <button
                        onClick={(e) => handleDelete(log, e)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-xs font-semibold"
                        title="Master delete"
                      >
                        Delete
                      </button>
                    )}
                    {isMaster && canEdit(log) && (
                      <button
                        onClick={(e) => handleDelete(log, e)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-xs font-semibold"
                        title="Master delete"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
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
                  <p className="text-gray-900">{selectedLog.procedure_category || 'N/A'}</p>
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
              {selectedLog.status === 'NOT_WITNESSED' && (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                  <p className="text-gray-700 font-medium">Not Witnessed (N/A)</p>
                </div>
              )}
              {selectedLog.rating && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Rating</label>
                    <p className={'text-2xl font-bold ' + getRatingTextColor(selectedLog.rating)}>
                      {showExactScores ? selectedLog.rating + '/100' : getRatingLabel(selectedLog.rating)}
                    </p>
                  </div>
                  {selectedLog.comment && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Comment</label>
                      <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedLog.comment}</p>
                    </div>
                  )}
                </>
              )}
              {selectedLog.postop_followup_comment && (
                <div className="border-t pt-4">
                  <label className="text-sm font-semibold text-purple-700">Supervisor Post-Op Follow-Up</label>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg mt-1">
                    <p className="text-gray-800">{selectedLog.postop_followup_comment}</p>
                  </div>
                </div>
              )}
              {selectedLog.status === 'PENDING' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-yellow-800 font-medium">This procedure has not been rated yet.</p>
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
              <button onClick={() => { setShowEditModal(false); setEditingLog(null); }} className="hover:bg-green-800 p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRN</label>
                  <input type="text" value={editFormData.mrn} onChange={(e) => setEditFormData({ ...editFormData, mrn: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input type="number" value={editFormData.age} onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                  <select value={editFormData.sex} onChange={(e) => setEditFormData({ ...editFormData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <input type="text" value={editFormData.diagnosis} onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
                  <input type="text" value={editFormData.procedure} onChange={(e) => setEditFormData({ ...editFormData, procedure: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Type</label>
                  <select value={editFormData.procedureType} onChange={(e) => setEditFormData({ ...editFormData, procedureType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="ELECTIVE">Elective</option>
                    <option value="SEMI_ELECTIVE">Semi-Elective</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select value={editFormData.procedureCategory} onChange={(e) => setEditFormData({ ...editFormData, procedureCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <select value={editFormData.placeOfPractice} onChange={(e) => setEditFormData({ ...editFormData, placeOfPractice: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="Y12HMC">Y12HMC</option>
                    <option value="ALERT">ALERT</option>
                    <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surgery Role</label>
                  <select value={editFormData.surgeryRole} onChange={(e) => setEditFormData({ ...editFormData, surgeryRole: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="PRIMARY_SURGEON">Primary Surgeon</option>
                    <option value="PRIMARY_SURGEON_ASSISTED">Primary Surgeon (Assisted)</option>
                    <option value="PRIMARY_SUPERVISED">Primary Supervised</option>
                    <option value="FIRST_ASSISTANT">1st Assistant</option>
                    <option value="SECOND_ASSISTANT">2nd Assistant</option>
                    <option value="OBSERVER">Observer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                  <select value={editFormData.supervisorId} onChange={(e) => setEditFormData({ ...editFormData, supervisorId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select Supervisor</option>
                    {supervisors.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remark (Optional)</label>
                  <textarea value={editFormData.remark} onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Additional notes..." />
                </div>
              </div>
              <div className="flex space-x-3 mt-6 pt-6 border-t">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">Update Procedure</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingLog(null); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
