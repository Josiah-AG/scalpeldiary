import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, X, Award } from 'lucide-react';

interface Presentation {
  id: string;
  date: string;
  title: string;
  venue: string;
  presentation_type: string;
  description?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  rating?: number;
  comment?: string;
  status: string;
}

export default function Presentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [assignedPresentations, setAssignedPresentations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'my-presentations' | 'assigned'>('my-presentations');
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showMarkPresentedModal, setShowMarkPresentedModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [presentedDate, setPresentedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    presentationType: '',
    venue: '',
  });
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Check if in read-only mode
  const isReadOnlyMode = sessionStorage.getItem('isReadOnlyMode') === 'true';
  const viewingResidentId = sessionStorage.getItem('viewingResidentId');

  const venues = [
    { value: 'Y12HMC', label: 'Y12HMC' },
    { value: 'ALERT', label: 'ALERT' },
    { value: 'ABEBECH_GOBENA', label: 'Abebech Gobena' },
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    venue: '',
    presentationType: 'MORNING_PRESENTATION',
    description: '',
    supervisorId: '',
  });

  useEffect(() => {
    fetchYears();
    fetchSupervisors();
    if (!isReadOnlyMode) {
      fetchAssignedPresentations();
    }
  }, []);

  useEffect(() => {
    if (selectedYear) {
      // Skip initial load in read-only mode (data already fetched in fetchYears)
      if (isReadOnlyMode && !initialLoadDone) {
        return;
      }
      fetchPresentations();
      fetchStats();
    }
  }, [selectedYear, filters]);

  const fetchYears = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      const response = await api.get(`/users/resident-years/${viewingResidentId}`);
      const yearsData = response.data;
      setYears(yearsData);
      if (yearsData.length > 0) {
        // Use latest year (current year) - same as AllProcedures
        const yearId = yearsData[yearsData.length - 1].id;
        setSelectedYear(yearId);
        // Fetch presentations immediately with the years data
        const yearData = yearsData.find((y: any) => y.id === yearId);
        if (yearData) {
          try {
            const presResponse = await api.get(`/presentations/resident/${viewingResidentId}?year=${yearData.year}`);
            console.log('Presentations fetched in fetchYears:', presResponse.data);
            setPresentations(presResponse.data);
            
            // Fetch stats
            const statsResponse = await api.get(`/analytics/supervisor/resident/${viewingResidentId}?year=${yearData.year}`);
            setStats({
              totalPresentations: statsResponse.data.totalPresentations,
              avgRating: statsResponse.data.avgPresentationRating,
              typeDistribution: {}
            });
            // Mark initial load as done AFTER setting presentations
            setTimeout(() => setInitialLoadDone(true), 100);
          } catch (error) {
            console.error('Failed to fetch presentations:', error);
            setInitialLoadDone(true);
          }
        }
      }
    } else {
      const response = await api.get('/users/resident-years/me');
      setYears(response.data);
      if (response.data.length > 0) {
        // Set to current (latest) year
        setSelectedYear(response.data[response.data.length - 1].id);
      }
    }
  };

  const fetchSupervisors = async () => {
    try {
      // For presentations, get only supervisors (not residents)
      const response = await api.get('/users/supervisors/only');
      console.log('Supervisors fetched:', response.data);
      setSupervisors(response.data);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
    }
  };

  const fetchPresentations = async () => {
    console.log('fetchPresentations called - isReadOnlyMode:', isReadOnlyMode, 'years.length:', years.length, 'selectedYear:', selectedYear);
    if (isReadOnlyMode && viewingResidentId) {
      if (years.length === 0) {
        console.log('Years not loaded yet, returning');
        return; // Wait for years to load
      }
      // Fetch for the resident being viewed
      const yearData = years.find(y => y.id == selectedYear); // Use == for loose comparison
      console.log('Looking for year with id:', selectedYear, 'Found:', yearData);
      if (yearData) {
        const response = await api.get(`/presentations/resident/${viewingResidentId}?year=${yearData.year}`);
        console.log('Presentations fetched in fetchPresentations:', response.data.length);
        setPresentations(response.data);
      } else {
        console.log('No yearData found!');
      }
    } else {
      // Fetch for current user
      const params = new URLSearchParams({
        yearId: selectedYear,
        ...filters
      });
      const response = await api.get(`/presentations/my-presentations?${params}`);
      setPresentations(response.data);
    }
  };

  const fetchStats = async () => {
    if (isReadOnlyMode && viewingResidentId) {
      // Fetch stats for the resident being viewed
      const response = await api.get(`/analytics/supervisor/resident/${viewingResidentId}?year=${years.find(y => y.id === parseInt(selectedYear))?.year}`);
      setStats({
        totalPresentations: response.data.totalPresentations,
        avgRating: response.data.avgPresentationRating,
        typeDistribution: {}
      });
    } else {
      const response = await api.get(`/presentations/stats?yearId=${selectedYear}`);
      setStats(response.data);
    }
  };

  const fetchAssignedPresentations = async () => {
    try {
      const response = await api.get('/presentation-assignments/my-assignments');
      setAssignedPresentations(response.data);
    } catch (error) {
      console.error('Failed to fetch assigned presentations:', error);
    }
  };

  const handleMarkAsPresented = (assignment: any) => {
    setSelectedAssignment(assignment);
    setPresentedDate(new Date().toISOString().split('T')[0]);
    setShowMarkPresentedModal(true);
  };

  const handleSubmitMarkPresented = async () => {
    if (!selectedAssignment) return;

    try {
      await api.post(`/presentation-assignments/${selectedAssignment.id}/mark-presented`, {
        presented_date: presentedDate,
        yearId: selectedYear
      });
      
      setShowMarkPresentedModal(false);
      setSelectedAssignment(null);
      fetchAssignedPresentations();
      fetchPresentations();
      fetchStats();
      alert('Presentation marked as presented! Your supervisor will now rate it.');
    } catch (error: any) {
      console.error('Failed to mark as presented:', error);
      alert(error.response?.data?.error || 'Failed to mark as presented');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPresentation) {
        await api.put(`/presentations/${editingPresentation.id}`, formData);
      } else {
        await api.post('/presentations', { ...formData, yearId: selectedYear });
      }
      setShowModal(false);
      setEditingPresentation(null);
      resetForm();
      fetchPresentations();
      fetchStats();
    } catch (error) {
      alert('Failed to save presentation');
    }
  };

  const handleEdit = (presentation: Presentation) => {
    if (!isCurrentYear(selectedYear)) {
      alert('You can only edit presentations from your current year');
      return;
    }
    if (presentation.rating) {
      alert('Cannot edit a presentation that has been rated');
      return;
    }
    setEditingPresentation(presentation);
    setFormData({
      date: presentation.date,
      title: presentation.title,
      venue: presentation.venue,
      presentationType: presentation.presentation_type,
      description: presentation.description || '',
      supervisorId: presentation.supervisor_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, presentation: Presentation) => {
    if (!isCurrentYear(selectedYear)) {
      alert('You can only delete presentations from your current year');
      return;
    }
    if (presentation.rating) {
      alert('Cannot delete a presentation that has been rated');
      return;
    }
    if (confirm('Are you sure you want to delete this presentation?')) {
      try {
        await api.delete(`/presentations/${id}`);
        fetchPresentations();
        fetchStats();
      } catch (error) {
        alert('Failed to delete presentation');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      venue: '',
      presentationType: 'MORNING_PRESENTATION',
      description: '',
      supervisorId: '',
    });
  };

  const getPresentationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MORNING_PRESENTATION: 'Morning Presentation',
      SEMINAR: 'Seminar',
      SHORT_PRESENTATION: 'Short Presentation',
      MDT: 'MDT',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  const getRatingBadge = (rating: number | null | undefined, status: string) => {
    if (status === 'NOT_WITNESSED') {
      return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm">N/A</span>;
    }
    if (!rating || status === 'PENDING') {
      return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm">Unrated</span>;
    }
    const color = rating > 50 ? 'bg-green-500' : 'bg-red-500';
    return <span className={`px-3 py-1 rounded-full ${color} text-white font-semibold text-sm`}>{rating}/100</span>;
  };



  const isCurrentYear = (yearId: string) => {
    if (years.length === 0) return false;
    return yearId === years[years.length - 1].id;
  };

  return (
    <Layout title="Presentations">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Year (View)</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                Year {year.year} {year.id === years[years.length - 1]?.id ? '(Current)' : '(View Only)'}
              </option>
            ))}
          </select>
          {!isCurrentYear(selectedYear) && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Viewing previous year - You can only add presentations for your current year
            </p>
          )}
        </div>
        {!isReadOnlyMode && (
          <button
            onClick={() => {
              if (!isCurrentYear(selectedYear)) {
                alert('You can only add presentations for your current year. Please switch to your current year.');
                return;
              }
              setEditingPresentation(null);
              resetForm();
              setShowModal(true);
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg shadow-lg transition-all ${
              isCurrentYear(selectedYear)
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isCurrentYear(selectedYear)}
          >
            <Plus size={20} />
            <span className="font-medium">Add Presentation</span>
          </button>
        )}
      </div>

      {/* Tabs - Only show for residents (not in read-only mode) */}
      {!isReadOnlyMode && (
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('my-presentations')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'my-presentations'
                  ? 'bg-blue-600 text-white border-b-4 border-blue-800'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              My Presentations
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === 'assigned'
                  ? 'bg-amber-600 text-white border-b-4 border-amber-800'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Assigned Presentations
              {assignedPresentations.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                  {assignedPresentations.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filters - Only show for My Presentations tab */}
      {activeTab === 'my-presentations' && (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Presentation Type</label>
              <select
                value={filters.presentationType}
                onChange={(e) => setFilters({ ...filters, presentationType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="MORNING_PRESENTATION">Morning Presentation</option>
                <option value="SEMINAR">Seminar</option>
                <option value="SHORT_PRESENTATION">Short Presentation</option>
                <option value="MDT">MDT</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
              <select
                value={filters.venue}
                onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {venues.map((venue) => (
                  <option key={venue.value} value={venue.value}>
                    {venue.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Stats - Only show for My Presentations tab */}
      {activeTab === 'my-presentations' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Presentations</p>
                <p className="text-4xl font-bold mt-2">{stats.totalPresentations}</p>
              </div>
              <Award size={40} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Avg Rating</p>
                <p className="text-4xl font-bold mt-2">{stats.avgRating?.toFixed(1) || 'N/A'}</p>
              </div>
              <Award size={40} className="text-green-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 col-span-2">
            <h3 className="text-gray-700 text-sm font-medium mb-3">By Type</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.typeDistribution || {}).map(([type, count]: [string, any]) => (
                <div key={type} className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-xs text-gray-600">{getPresentationTypeLabel(type)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Presentations Tab */}
      {activeTab === 'my-presentations' && (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="text-xl font-bold text-white">My Presentations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moderator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {presentations.map((presentation) => {
                const rowColor = !presentation.rating 
                  ? 'bg-gray-100 hover:bg-gray-200' 
                  : presentation.rating > 50 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'bg-red-50 hover:bg-red-100';
                
                return (
                  <tr 
                    key={presentation.id} 
                    className={`cursor-pointer transition-colors ${rowColor}`}
                    onClick={(e) => {
                      // Don't open modal if clicking on action buttons
                      if ((e.target as HTMLElement).closest('button')) return;
                      
                      // Show presentation detail modal
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
                      modal.innerHTML = `
                        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                          <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-bold">Presentation Details</h3>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                          </div>
                          <div class="space-y-3">
                            <p><strong>Date:</strong> ${format(new Date(presentation.date), 'MMM dd, yyyy')}</p>
                            <p><strong>Title:</strong> ${presentation.title}</p>
                            <p><strong>Type:</strong> ${getPresentationTypeLabel(presentation.presentation_type)}</p>
                            <p><strong>Venue:</strong> ${presentation.venue}</p>
                            ${presentation.description ? `<p><strong>Description:</strong> ${presentation.description}</p>` : ''}
                            <p><strong>Moderator:</strong> ${presentation.supervisor_name || 'Not assigned'}</p>
                            ${presentation.rating ? `
                              <div class="border-t pt-3 mt-3">
                                <p><strong>Rating:</strong> <span class="text-2xl font-bold ${presentation.rating > 50 ? 'text-green-600' : 'text-red-600'}">${presentation.rating}/100</span></p>
                                ${presentation.comment ? `<p class="mt-2"><strong>Comment:</strong> ${presentation.comment}</p>` : ''}
                              </div>
                            ` : '<p class="text-gray-500 italic">Not yet rated</p>'}
                          </div>
                        </div>
                      `;
                      document.body.appendChild(modal);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(presentation.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{presentation.title}</td>
                    <td className="px-6 py-4 text-sm">{presentation.venue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {getPresentationTypeLabel(presentation.presentation_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{presentation.supervisor_name || 'Not assigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRatingBadge(presentation.rating, presentation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      {!isReadOnlyMode && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(presentation);
                            }}
                            className={`${
                              presentation.rating || !isCurrentYear(selectedYear)
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-900'
                            }`}
                            disabled={!!presentation.rating || !isCurrentYear(selectedYear)}
                            title={!isCurrentYear(selectedYear) ? 'Can only edit current year' : ''}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(presentation.id, presentation);
                            }}
                            className={`${
                              presentation.rating || !isCurrentYear(selectedYear)
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            disabled={!!presentation.rating || !isCurrentYear(selectedYear)}
                            title={!isCurrentYear(selectedYear) ? 'Can only delete current year' : ''}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {isReadOnlyMode && <span className="text-gray-400 text-xs">View Only</span>}
                    </td>
                  </tr>
                );
              })}
              {presentations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No presentations yet. Click "Add Presentation" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Assigned Presentations Tab */}
      {activeTab === 'assigned' && !isReadOnlyMode && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white">Assigned Presentations</h3>
          </div>
          {assignedPresentations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Award size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No Assigned Presentations</h3>
              <p className="text-sm">You don't have any presentations assigned to you yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moderator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedPresentations.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-amber-50">
                      <td className="px-6 py-4 text-sm font-medium">{assignment.title}</td>
                      <td className="px-6 py-4 text-sm">{assignment.type}</td>
                      <td className="px-6 py-4 text-sm">{assignment.moderator_name}</td>
                      <td className="px-6 py-4 text-sm">{assignment.created_by_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleMarkAsPresented(assignment)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                          Mark as Presented
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mark as Presented Modal */}
      {showMarkPresentedModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Mark as Presented</h3>
            <p className="text-gray-600 mb-4">
              You are marking "<strong>{selectedAssignment.title}</strong>" as presented.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presentation Date *
              </label>
              <input
                type="date"
                value={presentedDate}
                onChange={(e) => setPresentedDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitMarkPresented}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowMarkPresentedModal(false);
                  setSelectedAssignment(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingPresentation ? 'Edit Presentation' : 'Add Presentation'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPresentation(null);
                  resetForm();
                }}
                className="hover:bg-blue-800 p-2 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Management of Acute Appendicitis"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <select
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Venue</option>
                  {venues.map((venue) => (
                    <option key={venue.value} value={venue.value}>
                      {venue.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.presentationType}
                  onChange={(e) => setFormData({ ...formData, presentationType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="MORNING_PRESENTATION">Morning Presentation</option>
                  <option value="SEMINAR">Seminar</option>
                  <option value="SHORT_PRESENTATION">Short Presentation</option>
                  <option value="MDT">MDT</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moderator <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Moderator</option>
                  {supervisors.map((supervisor: any) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                      {supervisor.institution && supervisor.specialty 
                        ? ` (${supervisor.institution} - ${supervisor.specialty})`
                        : supervisor.institution 
                        ? ` (${supervisor.institution})`
                        : supervisor.specialty
                        ? ` (${supervisor.specialty})`
                        : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the supervisor who will moderate this presentation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Additional details about the presentation..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {editingPresentation ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPresentation(null);
                    resetForm();
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
