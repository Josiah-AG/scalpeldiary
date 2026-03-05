import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { User, FileText, Presentation, ChevronRight, Building2, Stethoscope } from 'lucide-react';

interface SupervisorStats {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
  institution: string | null;
  specialty: string | null;
  is_senior: boolean;
  total_procedures_rated: number;
  total_presentations_rated: number;
  avg_procedure_rating: number;
  avg_presentation_rating: number;
}

export default function SupervisorBrowsing() {
  const [supervisors, setSupervisors] = useState<SupervisorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      console.log('Fetching supervisors...');
      const response = await api.get('/users/supervisors/stats');
      console.log('Supervisors response:', response);
      console.log('Supervisors data:', response.data);
      console.log('Number of supervisors:', response.data.length);
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setSupervisors(response.data);
        setError(null);
      } else {
        console.error('Response data is not an array:', response.data);
        setError('Invalid data format received from server');
        setSupervisors([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch supervisors:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.error || 'Failed to load supervisors');
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSupervisor = (supervisor: SupervisorStats) => {
    // Store supervisor info in sessionStorage
    sessionStorage.setItem('viewingSupervisorId', supervisor.id.toString());
    sessionStorage.setItem('viewingSupervisorName', supervisor.name);
    navigate('/management/supervisor-view');
  };

  if (loading) {
    return (
      <Layout title="Browse Supervisors">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p className="text-gray-500 text-center mt-4">Loading supervisors...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Browse Supervisors">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg shadow-lg">
          <button
            onClick={() => navigate('/management')}
            className="flex items-center space-x-2 text-white hover:text-green-100 mb-4 transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-2xl font-bold mb-2">All Supervisors</h2>
          <p className="text-green-100">
            {supervisors.length} supervisor{supervisors.length !== 1 ? 's' : ''} in the system
          </p>
        </div>

        {/* Supervisors Grid */}
        {supervisors.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No supervisors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                onClick={() => handleViewSupervisor(supervisor)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
              >
                {/* Profile Section */}
                <div className="flex items-center space-x-4 mb-4">
                  {supervisor.profile_picture ? (
                    <img
                      src={supervisor.profile_picture}
                      alt={supervisor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {supervisor.name}
                    </h3>
                    <p className="text-sm text-gray-500">{supervisor.email}</p>
                    {supervisor.is_senior && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Senior
                      </span>
                    )}
                  </div>
                </div>

                {/* Institution & Specialty */}
                <div className="space-y-2 mb-4">
                  {supervisor.institution && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">{supervisor.institution}</span>
                    </div>
                  )}
                  {supervisor.specialty && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Stethoscope className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">{supervisor.specialty}</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="space-y-3 border-t pt-4">
                  {/* Procedures */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Procedures Rated</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {supervisor.total_procedures_rated}
                    </span>
                  </div>

                  {/* Presentations */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Presentation className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Presentations Rated</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {supervisor.total_presentations_rated}
                    </span>
                  </div>
                </div>

                {/* Click hint */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-center text-gray-400">
                    Click to view rated items
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
