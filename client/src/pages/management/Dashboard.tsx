import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Users, UserCheck, TrendingUp, Activity, Building2 } from 'lucide-react';

export default function ManagementDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/management/stats');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch management stats:', error);
    }
  };

  const residents = users.filter((u) => u.role === 'RESIDENT');
  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');

  return (
    <Layout title="Management Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Department Management</h1>
        <p className="text-gray-600">Overview of residents and supervisors</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Residents Card */}
        <button
          onClick={() => navigate('/management/browse-residents')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Users className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <TrendingUp className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm md:text-base font-medium opacity-90 mb-1">Total Residents</h3>
          <p className="text-4xl md:text-5xl font-bold mb-2">{residents.length}</p>
          <p className="text-xs md:text-sm opacity-75">Click to browse by year →</p>
        </button>

        {/* Supervisors Card */}
        <button
          onClick={() => navigate('/management/browse-supervisors')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <UserCheck className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <Activity className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-sm md:text-base font-medium opacity-90 mb-1">Total Supervisors</h3>
          <p className="text-4xl md:text-5xl font-bold mb-2">{supervisors.length}</p>
          <p className="text-xs md:text-sm opacity-75">Click to view statistics →</p>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Management Access</h3>
            <p className="text-sm text-gray-600">
              You have access to view and monitor all residents and supervisors in the department. 
              Browse their profiles, view statistics, and track progress.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
