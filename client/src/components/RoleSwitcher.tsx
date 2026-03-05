import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Building2, UserCheck } from 'lucide-react';

export default function RoleSwitcher() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show for supervisors with management access
  if (user?.role !== 'SUPERVISOR' || !user?.has_management_access) {
    return null;
  }

  const isManagementView = location.pathname.startsWith('/management');

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-3 py-3">
          <span className="text-sm text-gray-600 font-medium hidden sm:inline">Switch View:</span>
          <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                !isManagementView
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Supervisor</span>
            </button>
            <button
              onClick={() => navigate('/management')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                isManagementView
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Management</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
