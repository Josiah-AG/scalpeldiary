import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { FileText, Plus, User, UserCheck } from 'lucide-react';

interface Resident {
  id: string;
  name: string;
}

interface Supervisor {
  id: string;
  name: string;
}

export default function AssignPresentation() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Short Presentation',
    presenter_id: '',
    moderator_id: '',
    description: ''
  });

  useEffect(() => {
    fetchResidents();
    fetchSupervisors();
    fetchAssignments();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await api.get('/users?role=RESIDENT');
      console.log('Residents fetched:', response.data);
      console.log('First resident structure:', response.data[0]);
      setResidents(response.data);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/users/supervisors/only');
      console.log('Supervisors fetched:', response.data);
      setSupervisors(response.data);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/presentation-assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form data:', formData);
    console.log('Presenter ID type:', typeof formData.presenter_id, 'Value:', formData.presenter_id);
    console.log('Moderator ID type:', typeof formData.moderator_id, 'Value:', formData.moderator_id);
    console.log('All residents:', residents);
    console.log('All supervisors:', supervisors);
    
    // Validate required fields
    if (!formData.title || !formData.type || !formData.presenter_id || !formData.moderator_id) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingAssignment) {
        await api.put(`/presentation-assignments/${editingAssignment.id}`, formData);
      } else {
        const response = await api.post('/presentation-assignments', formData);
        console.log('Success response:', response.data);
      }
      setShowAssignModal(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
      alert('Presentation assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign presentation:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(error.response?.data?.error || error.response?.data?.details || 'Failed to assign presentation');
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      type: assignment.type,
      presenter_id: assignment.presenter_id,
      moderator_id: assignment.moderator_id,
      description: assignment.description || ''
    });
    setShowAssignModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await api.delete(`/presentation-assignments/${id}`);
      fetchAssignments();
      alert('Assignment deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete assignment:', error);
      alert(error.response?.data?.error || 'Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Short Presentation',
      presenter_id: '',
      moderator_id: '',
      description: ''
    });
  };

  return (
    <Layout title="Assign Presentation">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <FileText size={32} />
          <h2 className="text-2xl font-bold">Presentation Assignment</h2>
        </div>
        <p className="text-amber-100">Assign presentations to residents with supervisor moderators</p>
      </div>

      {/* Assign Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center space-x-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 shadow-md"
        >
          <Plus size={24} />
          <span className="font-semibold">Assign New Presentation</span>
        </button>
      </div>

      {/* Placeholder for Assigned Presentations List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No Presentations Assigned Yet</h3>
            <p className="text-sm">Click "Assign New Presentation" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presenter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moderator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{assignment.title}</td>
                    <td className="px-6 py-4 text-sm">{assignment.type}</td>
                    <td className="px-6 py-4 text-sm">{assignment.presenter_name}</td>
                    <td className="px-6 py-4 text-sm">{assignment.moderator_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'presented' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {assignment.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">
              {editingAssignment ? 'Edit Assignment' : 'Assign Presentation'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Presentation Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Acute Appendicitis Management"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Presentation Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="Short Presentation">Short Presentation</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Morning Presentation">Morning Presentation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Presenter */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <User size={16} />
                  <span>Presenter (Resident) *</span>
                </label>
                <select
                  value={formData.presenter_id}
                  onChange={(e) => {
                    console.log('Presenter selected:', e.target.value);
                    setFormData({ ...formData, presenter_id: e.target.value });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select Resident</option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Moderator */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <UserCheck size={16} />
                  <span>Moderator (Supervisor) *</span>
                </label>
                <select
                  value={formData.moderator_id}
                  onChange={(e) => {
                    console.log('Moderator selected:', e.target.value);
                    setFormData({ ...formData, moderator_id: e.target.value });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map(supervisor => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description/Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Additional details about the presentation..."
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 font-semibold"
                >
                  {editingAssignment ? 'Update Assignment' : 'Assign Presentation'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setEditingAssignment(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
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
