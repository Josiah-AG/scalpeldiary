import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { ArrowLeft, FileText, Presentation, Calendar, User, Star, MessageSquare, X } from 'lucide-react';

interface RatedProcedure {
  id: number;
  date: string;
  procedure: string;
  procedure_type: string;
  diagnosis: string;
  surgery_role: string;
  rating: number;
  comment: string;
  rated_at: string;
  resident_name: string;
  resident_profile_picture: string | null;
  resident_year: number;
}

interface RatedPresentation {
  id: number;
  date: string;
  title: string;
  venue: string;
  presentation_type: string;
  description: string;
  rating: number;
  comment: string;
  resident_name: string;
  resident_profile_picture: string | null;
  resident_year: number;
}

export default function SupervisorView() {
  const [activeTab, setActiveTab] = useState<'procedures' | 'presentations'>('procedures');
  const [procedures, setProcedures] = useState<RatedProcedure[]>([]);
  const [presentations, setPresentations] = useState<RatedPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<RatedProcedure | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<RatedPresentation | null>(null);
  const navigate = useNavigate();

  const supervisorId = sessionStorage.getItem('viewingSupervisorId');
  const supervisorName = sessionStorage.getItem('viewingSupervisorName');

  useEffect(() => {
    if (!supervisorId) {
      navigate('/management/browse-supervisors');
      return;
    }
    fetchData();
  }, [supervisorId, navigate]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for supervisor:', supervisorId);
      
      // Fetch procedures using api instance (has auth interceptor)
      const procResponse = await api.get(`/logs/supervisor/${supervisorId}/rated`);
      console.log('Procedures data:', procResponse.data);
      console.log('Number of procedures:', procResponse.data.length);
      setProcedures(Array.isArray(procResponse.data) ? procResponse.data : []);

      // Fetch presentations using api instance (has auth interceptor)
      const presResponse = await api.get(`/presentations/supervisor/${supervisorId}/rated`);
      console.log('Presentations data:', presResponse.data);
      console.log('Number of presentations:', presResponse.data.length);
      setPresentations(Array.isArray(presResponse.data) ? presResponse.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setProcedures([]);
      setPresentations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem('viewingSupervisorId');
    sessionStorage.removeItem('viewingSupervisorName');
    navigate('/management/browse-supervisors');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout title="Supervisor View">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-center">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${supervisorName}'s Rated Items`}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 md:p-6 rounded-lg shadow-lg">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-white hover:text-green-100 mb-3 md:mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base">Back to Supervisors</span>
          </button>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{supervisorName}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-green-100">
            <span className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{procedures.length} procedures</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Presentation className="w-4 h-4" />
              <span>{presentations.length} presentations</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('procedures')}
                className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-colors ${
                  activeTab === 'procedures'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 md:space-x-2">
                  <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">
                    <span className="hidden sm:inline">Procedures </span>
                    ({procedures.length})
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('presentations')}
                className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-colors ${
                  activeTab === 'presentations'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 md:space-x-2">
                  <Presentation className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">
                    <span className="hidden sm:inline">Presentations </span>
                    ({presentations.length})
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-6">
            {activeTab === 'procedures' ? (
              procedures.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm md:text-base">No procedures rated yet</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {procedures.map((proc) => (
                    <div
                      key={proc.id}
                      onClick={() => setSelectedProcedure(proc)}
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                            {proc.resident_profile_picture ? (
                              <img
                                src={proc.resident_profile_picture}
                                alt={proc.resident_name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{proc.procedure}</h3>
                              <p className="text-xs md:text-sm text-gray-500 truncate">
                                {proc.resident_name} • Year {proc.resident_year}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600 mt-2">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{formatDate(proc.date)}</span>
                            </span>
                            <span className="px-2 py-0.5 md:py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {proc.procedure_type}
                            </span>
                            <span className="px-2 py-0.5 md:py-1 bg-purple-100 text-purple-800 rounded text-xs truncate max-w-[120px] md:max-w-none">
                              {proc.surgery_role}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                          <div className="flex items-center space-x-1 text-yellow-500">
                            <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm md:text-base">{proc.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              presentations.length === 0 ? (
                <div className="text-center py-12">
                  <Presentation className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm md:text-base">No presentations rated yet</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {presentations.map((pres) => (
                    <div
                      key={pres.id}
                      onClick={() => setSelectedPresentation(pres)}
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                            {pres.resident_profile_picture ? (
                              <img
                                src={pres.resident_profile_picture}
                                alt={pres.resident_name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{pres.title}</h3>
                              <p className="text-xs md:text-sm text-gray-500 truncate">
                                {pres.resident_name} • Year {pres.resident_year}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600 mt-2">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{formatDate(pres.date)}</span>
                            </span>
                            <span className="px-2 py-0.5 md:py-1 bg-green-100 text-green-800 rounded text-xs">
                              {pres.presentation_type}
                            </span>
                            <span className="text-gray-500 truncate max-w-[150px] md:max-w-none">{pres.venue}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                          <div className="flex items-center space-x-1 text-yellow-500">
                            <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm md:text-base">{pres.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Procedure Detail Modal */}
      {selectedProcedure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50" onClick={() => setSelectedProcedure(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Procedure Details</h3>
              <button
                onClick={() => setSelectedProcedure(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b">
                {selectedProcedure.resident_profile_picture ? (
                  <img
                    src={selectedProcedure.resident_profile_picture}
                    alt={selectedProcedure.resident_name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedProcedure.resident_name}</p>
                  <p className="text-xs md:text-sm text-gray-500">Year {selectedProcedure.resident_year}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-sm md:text-base">{formatDate(selectedProcedure.date)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Rated On</p>
                  <p className="font-medium text-sm md:text-base">{formatDate(selectedProcedure.rated_at)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-sm md:text-base">{selectedProcedure.procedure_type}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Role</p>
                  <p className="font-medium text-sm md:text-base">{selectedProcedure.surgery_role}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-blue-600 font-medium mb-1">Procedure</p>
                <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedProcedure.procedure}</p>
              </div>

              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Diagnosis</p>
                <p className="font-medium text-gray-900 text-sm md:text-base">{selectedProcedure.diagnosis}</p>
              </div>

              <div className="flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                <Star className="w-7 h-7 md:w-8 md:h-8 text-yellow-500 fill-current" />
                <span className="text-3xl md:text-4xl font-bold text-gray-900">{selectedProcedure.rating}</span>
                <span className="text-lg md:text-xl text-gray-500">/ 5</span>
              </div>

              {selectedProcedure.comment && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <p className="font-semibold text-gray-900 text-sm md:text-base">Supervisor Comment</p>
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{selectedProcedure.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Presentation Detail Modal */}
      {selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50" onClick={() => setSelectedPresentation(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Presentation Details</h3>
              <button
                onClick={() => setSelectedPresentation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b">
                {selectedPresentation.resident_profile_picture ? (
                  <img
                    src={selectedPresentation.resident_profile_picture}
                    alt={selectedPresentation.resident_name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedPresentation.resident_name}</p>
                  <p className="text-xs md:text-sm text-gray-500">Year {selectedPresentation.resident_year}</p>
                </div>
              </div>

              <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                <p className="text-xs md:text-sm text-green-600 font-medium mb-1">Title</p>
                <p className="font-bold text-gray-900 text-base md:text-lg">{selectedPresentation.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-sm md:text-base">{formatDate(selectedPresentation.date)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-sm md:text-base">{selectedPresentation.presentation_type}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Venue</p>
                <p className="font-medium text-gray-900 text-sm md:text-base">{selectedPresentation.venue}</p>
              </div>

              {selectedPresentation.description && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{selectedPresentation.description}</p>
                </div>
              )}

              <div className="flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                <Star className="w-7 h-7 md:w-8 md:h-8 text-yellow-500 fill-current" />
                <span className="text-3xl md:text-4xl font-bold text-gray-900">{selectedPresentation.rating}</span>
                <span className="text-lg md:text-xl text-gray-500">/ 5</span>
              </div>

              {selectedPresentation.comment && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    <p className="font-semibold text-gray-900 text-sm md:text-base">Supervisor Comment</p>
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{selectedPresentation.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
