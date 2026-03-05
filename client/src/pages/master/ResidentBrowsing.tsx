import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Users, ChevronRight, Star, FileText, Presentation, User } from 'lucide-react';

interface ResidentSummary {
  id: number;
  name: string;
  profilePicture: string | null;
  avgProcedureRating: number;
  avgPresentationRating: number;
  totalProcedures: number;
  totalPresentations: number;
  ratedLogs?: number;
  is_chief_resident?: boolean;
  yearProgress?: {
    year: number;
    overallProgress: number;
    totalRequired: number;
    totalAchieved: number;
  };
}

export default function ResidentBrowsing() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchResidentsByYear = async (year: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/supervisor/residents?year=${year}`);
      const residentsData = response.data;
      
      // Fetch progress for each resident
      const residentsWithProgress = await Promise.all(
        residentsData.map(async (resident: ResidentSummary) => {
          try {
            // Get the resident's year ID
            const yearsResponse = await api.get(`/users/resident-years/${resident.id}`);
            const residentYears = yearsResponse.data;
            const currentYear = residentYears.find((y: any) => y.year === year);
            
            if (currentYear) {
              const progressResponse = await api.get(`/progress/year/${currentYear.id}?residentId=${resident.id}`);
              return {
                ...resident,
                yearProgress: progressResponse.data
              };
            }
          } catch (error) {
            console.error(`Failed to fetch progress for resident ${resident.id}:`, error);
          }
          return resident;
        })
      );
      
      setResidents(residentsWithProgress);
      setSelectedYear(year);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewResidentProfile = (residentId: number) => {
    // Store the resident ID in sessionStorage for read-only mode
    sessionStorage.setItem('viewingResidentId', residentId.toString());
    sessionStorage.setItem('isReadOnlyMode', 'true');
    navigate('/resident-view/dashboard');
  };

  const yearColors = [
    { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-600', bgLight: 'bg-blue-50' },
    { bg: 'from-green-500 to-green-600', text: 'text-green-600', border: 'border-green-600', bgLight: 'bg-green-50' },
    { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', border: 'border-purple-600', bgLight: 'bg-purple-50' },
    { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', border: 'border-orange-600', bgLight: 'bg-orange-50' },
  ];

  return (
    <Layout title="Browse Residents">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-2">Browse Residents by Year</h2>
        <p className="text-blue-100">Select a year to view residents</p>
      </div>

      {/* Year Selection - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((year) => {
          const colors = yearColors[year - 1];
          const isSelected = selectedYear === year;
          return (
            <button
              key={year}
              onClick={() => fetchResidentsByYear(year)}
              className={`relative p-6 rounded-xl transition-all transform hover:scale-105 ${
                isSelected
                  ? `bg-gradient-to-br ${colors.bg} text-white shadow-xl`
                  : 'bg-white hover:shadow-lg border-2 border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-lg mb-3 mx-auto w-fit ${
                isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-100'
              }`}>
                <Users className={`w-10 h-10 ${isSelected ? 'text-white' : colors.text}`} />
              </div>
              <p className={`text-center font-bold text-xl mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                Year {year}
              </p>
              {isSelected && (
                <p className="text-center text-xs opacity-90">
                  {residents.length} resident{residents.length !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Residents List */}
      {selectedYear && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${yearColors[selectedYear - 1].bg} text-white px-6 py-4`}>
            <h3 className="text-xl font-bold">
              Year {selectedYear} Residents
            </h3>
            <p className="text-sm opacity-90">
              {loading ? 'Loading...' : `${residents.length} resident${residents.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading residents...</p>
            ) : residents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No residents found for Year {selectedYear}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {residents.map((resident) => (
                  <div
                    key={resident.id}
                    onClick={() => viewResidentProfile(resident.id)}
                    className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      {resident.profilePicture ? (
                        <img 
                          src={resident.profilePicture} 
                          alt={resident.name}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-md">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-lg text-gray-900">{resident.name}</h4>
                          {resident.is_chief_resident && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                              Chief
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Year {selectedYear} Resident</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* Statistics Grid */}
                    <div className={`grid ${selectedYear && selectedYear >= 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-3`}>
                      {/* Procedures */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-600 font-medium">Procedures</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{resident.totalProcedures}</p>
                        {resident.totalProcedures > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{resident.avgProcedureRating.toFixed(1)} avg</span>
                          </div>
                        )}
                      </div>

                      {/* Presentations */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Presentation className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 font-medium">Presentations</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{resident.totalPresentations}</p>
                        {resident.totalPresentations > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{resident.avgPresentationRating.toFixed(1)} avg</span>
                          </div>
                        )}
                      </div>

                      {/* Rated Logs - for Year 2+ residents */}
                      {selectedYear && selectedYear >= 2 && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs text-gray-600 font-medium">Rated Logs</span>
                          </div>
                          <p className="text-2xl font-bold text-indigo-600">{resident.ratedLogs || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">As Supervisor</p>
                        </div>
                      )}
                    </div>

                    {/* Year Progress Bar */}
                    {resident.yearProgress && (
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-gray-700">Year {resident.yearProgress.year} Progress</span>
                          <span className="text-sm font-bold text-purple-600">
                            {resident.yearProgress.overallProgress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(resident.yearProgress.overallProgress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 text-center">
                          {resident.yearProgress.totalAchieved} / {resident.yearProgress.totalRequired} procedures
                        </p>
                      </div>
                    )}

                    {/* Click hint */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-center text-gray-400">
                        Click to view full profile →
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
