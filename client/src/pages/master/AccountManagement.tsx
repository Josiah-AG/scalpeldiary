import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Edit2, Trash2, Ban, CheckCircle, UserPlus, Building2, UserCheck } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  institution?: string;
  specialty?: string;
  created_at: string;
  is_suspended?: boolean;
  has_management_access?: boolean;
  is_chief_resident?: boolean;
}

export default function AccountManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [residentYears, setResidentYears] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState('ALL');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'RESIDENT',
    year: '1',
    institution: '',
    specialty: '',
    password: '',
    confirmPassword: '',
    hasManagementAccess: false,
    hasSupervisorAccess: false,
    isChiefResident: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data);
    
    // Fetch years for residents
    const residents = response.data.filter((u: User) => u.role === 'RESIDENT');
    for (const resident of residents) {
      try {
        const yearsRes = await api.get(`/users/resident-years/${resident.id}`);
        setResidentYears((prev: any) => ({
          ...prev,
          [resident.id]: yearsRes.data
        }));
      } catch (error) {
        console.error(`Failed to fetch years for resident ${resident.id}`);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      await api.post('/users', formData);
      alert('User created successfully!');
      setShowCreateModal(false);
      setFormData({ 
        email: '', 
        name: '', 
        role: 'RESIDENT', 
        year: '1', 
        institution: '', 
        specialty: '', 
        password: '', 
        confirmPassword: '',
        hasManagementAccess: false,
        hasSupervisorAccess: false,
        isChiefResident: false
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const years = residentYears[user.id] || [];
    const currentYear = years.length > 0 ? years[years.length - 1].year : 1;
    
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      year: currentYear.toString(),
      institution: user.institution || '',
      specialty: user.specialty || '',
      password: '',
      confirmPassword: '',
      hasManagementAccess: user.has_management_access || false,
      hasSupervisorAccess: false, // Will be determined by checking if management user has supervisor fields
      isChiefResident: user.is_chief_resident || false,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      // Update name, institution, and specialty
      await api.put(`/users/${editingUser.id}`, {
        name: formData.name,
        institution: formData.institution || null,
        specialty: formData.specialty || null,
      });
      
      // If resident and year changed, update year
      if (editingUser.role === 'RESIDENT') {
        const years = residentYears[editingUser.id] || [];
        const currentYear = years.length > 0 ? years[years.length - 1].year : 1;
        const newYear = parseInt(formData.year);
        
        if (newYear !== currentYear) {
          await api.put(`/users/${editingUser.id}/year`, {
            newYear: newYear
          });
        }
        
        // Update Chief Resident status if changed (for Year 2+ residents)
        if (formData.isChiefResident !== editingUser.is_chief_resident) {
          await api.put(`/users/${editingUser.id}/toggle-chief-resident`, {
            is_chief_resident: formData.isChiefResident
          });
        }
      }
      
      // Update management access for supervisors
      if (editingUser.role === 'SUPERVISOR') {
        await api.put(`/users/${editingUser.id}/management-access`, {
          hasAccess: formData.hasManagementAccess
        });
      }
      
      // Update supervisor access for management users
      if (editingUser.role === 'MANAGEMENT') {
        await api.put(`/users/${editingUser.id}/supervisor-access`, {
          hasAccess: formData.hasSupervisorAccess,
          institution: formData.institution,
          specialty: formData.specialty
        });
      }
      
      alert('User updated successfully! User should refresh their page (F5) to see access changes.');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: number, userName: string, userRole: string) => {
    // Prevent deleting masters
    if (userRole === 'MASTER') {
      alert('Cannot delete Master accounts for security reasons');
      return;
    }
    
    if (confirm(`Are you sure you want to DELETE ${userName}? This action cannot be undone!`)) {
      try {
        await api.delete(`/users/${userId}`);
        alert('User deleted successfully');
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleSuspend = async (userId: number, userName: string, isSuspended: boolean, userRole: string) => {
    // Prevent suspending masters
    if (userRole === 'MASTER') {
      alert('Cannot suspend Master accounts for security reasons');
      return;
    }
    
    const action = isSuspended ? 'activate' : 'suspend';
    if (confirm(`Are you sure you want to ${action.toUpperCase()} ${userName}?`)) {
      try {
        await api.put(`/users/${userId}/${action}`);
        alert(`User ${action}d successfully`);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.error || `Failed to ${action} user`);
      }
    }
  };

  const handleToggleManagement = async (userId: number, userName: string, currentAccess: boolean) => {
    const action = currentAccess ? 'revoke' : 'grant';
    if (confirm(`${action.toUpperCase()} management access for ${userName}?`)) {
      try {
        await api.put(`/users/${userId}/management-access`, { hasAccess: !currentAccess });
        alert(`Management access ${action}d successfully`);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.error || `Failed to ${action} management access`);
      }
    }
  };

  const handleResetPassword = async (userId: number, userName: string) => {
    if (confirm(`Reset password for ${userName} to default (password123)?`)) {
      try {
        await api.post(`/users/reset-password/${userId}`);
        alert('Password reset successfully');
      } catch (error) {
        alert('Failed to reset password');
      }
    }
  };

  const filteredUsers = filterRole === 'ALL' 
    ? users 
    : users.filter(u => u.role === filterRole);

  return (
    <Layout title="Account Management">
      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => {
            setFormData({ 
              email: '', 
              name: '', 
              role: 'RESIDENT', 
              year: '1', 
              institution: '', 
              specialty: '', 
              password: '', 
              confirmPassword: '',
              hasManagementAccess: false,
              hasSupervisorAccess: false,
              isChiefResident: false
            });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlus size={20} />
          <span>Create New User</span>
        </button>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="ALL">All Roles</option>
          <option value="RESIDENT">Residents Only</option>
          <option value="SUPERVISOR">Supervisors Only</option>
          <option value="MANAGEMENT">Management Only</option>
          <option value="MASTER">Masters Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Year(s)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const years = residentYears[user.id] || [];
                return (
                  <tr key={user.id} className={user.is_suspended ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'MASTER' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'MANAGEMENT' ? 'bg-indigo-100 text-indigo-800' :
                          user.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        {user.role === 'SUPERVISOR' && user.has_management_access && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold flex items-center space-x-1">
                            <Building2 size={12} />
                            <span>+Mgmt</span>
                          </span>
                        )}
                        {user.role === 'RESIDENT' && user.is_chief_resident && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold flex items-center space-x-1">
                            <UserCheck size={12} />
                            <span>Chief</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.specialty || <span className="text-gray-400">Not set</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.institution || <span className="text-gray-400">Not set</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.role === 'RESIDENT' ? (
                        <span className="font-semibold">
                          Year {years.length > 0 ? years[years.length - 1].year : 'None'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.is_suspended ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        {user.role !== 'MASTER' && (
                          <>
                            <button
                              onClick={() => handleSuspend(user.id, user.name, user.is_suspended || false, user.role)}
                              className={user.is_suspended ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}
                              title={user.is_suspended ? 'Activate user' : 'Suspend user'}
                            >
                              {user.is_suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name, user.role)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="text-purple-600 hover:text-purple-900 text-xs"
                          title="Reset password"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="RESIDENT">Resident</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>
              {formData.role === 'SUPERVISOR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., Y12HMC, ALERT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., General Surgery, Pediatric Surgery"
                    />
                  </div>
                </>
              )}
              {formData.role === 'RESIDENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Starting Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                          Year {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., General Surgery"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  placeholder="Re-enter password"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              {editingUser?.role === 'RESIDENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Year</label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="flex-1 px-4 py-2 border rounded-md"
                      >
                        {[1, 2, 3, 4, 5].map((y) => (
                          <option key={y} value={y}>
                            Year {y}
                          </option>
                        ))}
                      </select>
                      {parseInt(formData.year) < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextYear = parseInt(formData.year) + 1;
                            if (confirm(`Promote ${editingUser.name} to Year ${nextYear}?\n\nPrevious year data will be preserved and read-only.`)) {
                              setFormData({ ...formData, year: nextYear.toString() });
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap"
                        >
                          Promote →
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Previous year data will be preserved</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., General Surgery"
                    />
                  </div>
                  {parseInt(formData.year) >= 2 && (
                    <div className="border-t pt-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isChiefResident || false}
                          onChange={(e) => setFormData({ ...formData, isChiefResident: e.target.checked })}
                          className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <div className="flex items-center space-x-2">
                          <UserCheck className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-medium">Assign as Chief Resident</span>
                        </div>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-8">
                        Grants access to rotation, duty, and activity scheduling features
                      </p>
                    </div>
                  )}
                </>
              )}
              {editingUser?.role === 'SUPERVISOR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., Y12HMC, ALERT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder="e.g., General Surgery, Pediatric Surgery"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasManagementAccess || false}
                        onChange={(e) => setFormData({ ...formData, hasManagementAccess: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">Grant Management Access</span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      Allows supervisor to view department-wide statistics and browse all residents/supervisors
                    </p>
                  </div>
                </>
              )}
              {editingUser?.role === 'MANAGEMENT' && (
                <>
                  <div className="border-t pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasSupervisorAccess || false}
                        onChange={(e) => setFormData({ ...formData, hasSupervisorAccess: e.target.checked })}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Grant Supervisor Access</span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      Allows management user to also function as a supervisor (rate procedures/presentations)
                    </p>
                  </div>
                  {formData.hasSupervisorAccess && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Institution *</label>
                        <input
                          type="text"
                          value={formData.institution}
                          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                          className="w-full px-4 py-2 border rounded-md"
                          placeholder="e.g., Y12HMC, ALERT"
                          required={formData.hasSupervisorAccess}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Specialty *</label>
                        <input
                          type="text"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="w-full px-4 py-2 border rounded-md"
                          placeholder="e.g., General Surgery, Pediatric Surgery"
                          required={formData.hasSupervisorAccess}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              {editingUser?.role === 'MASTER' && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    Master accounts can only update name
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
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
