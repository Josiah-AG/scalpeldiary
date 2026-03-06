import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Eye, FileText, Presentation } from 'lucide-react';

interface Procedure {
  id: number;
  date: string;
  procedure: string;
  procedure_type: string;
  surgery_role: string;
  rating: number | null;
  comment: string;
  resident_name: string;
  resident_year: number;
  mrn: string;
  age: number;
  sex: string;
  diagnosis: string;
  place_of_practice: string;
  status: string;
  rated_at: string;
}

interface PresentationItem {
  id: number;
  date: string;
  title: string;
  venue: string;
  presentation_type: string;
  description: string;
  rating: number | null;
  comment: string;
  resident_name: string;
  resident_year: number;
  status: string;
  rated_at: string;
}

export default function RatingsDone() {
  const [activeTab, setActiveTab] = useState<'procedures' | 'presentations'>('procedures');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationItem | null>(null);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  useEffect(() => {
    fetchProcedures();
    fetchPresentations();
  }, []);

  const fetchProcedures = async () => {
    try {
      const response = await api.get('/logs/rated');
      setProcedures(response.data);
    } catch (error) {
      console.error('Failed to fetch rated procedures');
    }
  };

  const fetchPresentations = async () => {
    try {
      const response = await api.get('/presentations/rated');
      setPresentations(response.data);
    } catch (error) {
      console.error('Failed to fetch rated presentations');
    }
  };

  const viewProcedureDetails = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setShowProcedureModal(true);
  };

  const viewPresentationDetails = (presentation: PresentationItem) => {
    setSelectedPresentation(presentation);
    setShowPresentationModal(true);
  };

  return (
    <Layout title="Ratings Done">
      {/* Tabs */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('procedures')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'procedures'
                ? 'bg-blue-600 text-white border-b-4 border-blue-800'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText size={20} />
            <span>Procedures ({procedures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('presentations')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'presentations'
                ? 'bg-green-600 text-white border-b-4 border-green-800'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Presentation size={20} />
            <span>Presentations ({presentations.length})</span>
          </button>
        </div>
      </div>

      {/* Procedures Tab */}
      {activeTab === 'procedures' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Resident</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Procedure</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {procedures.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(proc.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{proc.resident_name}</td>
                    <td className="px-4 py-3 text-sm">Year {proc.resident_year}</td>
                    <td className="px-4 py-3 text-sm">{proc.procedure}</td>
                    <td className="px-4 py-3 text-sm">{proc.procedure_type}</td>
                    <td className="px-4 py-3 text-sm">{proc.surgery_role}</td>
                    <td className="px-4 py-3 text-sm">
                      {proc.status === 'NOT_WITNESSED' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-semibold">
                          N/A
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                          {proc.rating}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => viewProcedureDetails(proc)}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                onClick={() => viewProcedureDetails(proc)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{proc.procedure}</h3>
                    <p className="text-sm text-gray-600">{proc.resident_name} - Year {proc.resident_year}</p>
                  </div>
                  {proc.status === 'NOT_WITNESSED' ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm font-semibold ml-2">
                      N/A
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold ml-2">
                      {proc.rating}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Date:</span> {new Date(proc.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Type:</span> {proc.procedure_type}</p>
                  <p><span className="font-medium">Role:</span> {proc.surgery_role}</p>
                </div>
              </div>
            ))}
          </div>

          {procedures.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No rated procedures yet</p>
            </div>
          )}
        </div>
      )}

      {/* Presentations Tab */}
      {activeTab === 'presentations' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Resident</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {presentations.map((pres) => (
                  <tr key={pres.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(pres.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{pres.resident_name}</td>
                    <td className="px-4 py-3 text-sm">Year {pres.resident_year}</td>
                    <td className="px-4 py-3 text-sm">{pres.title}</td>
                    <td className="px-4 py-3 text-sm">{pres.presentation_type}</td>
                    <td className="px-4 py-3 text-sm">{pres.venue}</td>
                    <td className="px-4 py-3 text-sm">
                      {pres.status === 'NOT_WITNESSED' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-semibold">
                          N/A
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                          {pres.rating}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => viewPresentationDetails(pres)}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {presentations.map((pres) => (
              <div
                key={pres.id}
                onClick={() => viewPresentationDetails(pres)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{pres.title}</h3>
                    <p className="text-sm text-gray-600">{pres.resident_name} - Year {pres.resident_year}</p>
                  </div>
                  {pres.status === 'NOT_WITNESSED' ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm font-semibold ml-2">
                      N/A
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold ml-2">
                      {pres.rating}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Date:</span> {new Date(pres.date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Type:</span> {pres.presentation_type}</p>
                  <p><span className="font-medium">Venue:</span> {pres.venue}</p>
                </div>
              </div>
            ))}
          </div>

          {presentations.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Presentation size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No rated presentations yet</p>
            </div>
          )}
        </div>
      )}

      {/* Procedure Detail Modal */}
      {showProcedureModal && selectedProcedure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Procedure Details</h3>
                <button
                  onClick={() => setShowProcedureModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{new Date(selectedProcedure.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MRN</p>
                    <p className="font-semibold">{selectedProcedure.mrn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-semibold">{selectedProcedure.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sex</p>
                    <p className="font-semibold">{selectedProcedure.sex}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Diagnosis</p>
                  <p className="font-semibold">{selectedProcedure.diagnosis}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Procedure</p>
                  <p className="font-semibold">{selectedProcedure.procedure}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Procedure Type</p>
                    <p className="font-semibold">{selectedProcedure.procedure_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Surgery Role</p>
                    <p className="font-semibold">{selectedProcedure.surgery_role}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Place of Practice</p>
                  <p className="font-semibold">{selectedProcedure.place_of_practice}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Resident</p>
                  <p className="font-semibold">{selectedProcedure.resident_name} (Year {selectedProcedure.resident_year})</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Rating</p>
                  {selectedProcedure.status === 'NOT_WITNESSED' ? (
                    <p className="text-2xl font-bold text-gray-600">N/A (Not Witnessed)</p>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{selectedProcedure.rating}</p>
                  )}
                </div>

                {selectedProcedure.comment && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">Comment</p>
                    <p className="mt-1">{selectedProcedure.comment}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowProcedureModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Detail Modal */}
      {showPresentationModal && selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Presentation Details</h3>
                <button
                  onClick={() => setShowPresentationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">{new Date(selectedPresentation.date).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-semibold text-lg">{selectedPresentation.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Presentation Type</p>
                    <p className="font-semibold">{selectedPresentation.presentation_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-semibold">{selectedPresentation.venue}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{selectedPresentation.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Resident</p>
                  <p className="font-semibold">{selectedPresentation.resident_name} (Year {selectedPresentation.resident_year})</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Rating</p>
                  {selectedPresentation.status === 'NOT_WITNESSED' ? (
                    <p className="text-2xl font-bold text-gray-600">N/A (Not Witnessed)</p>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{selectedPresentation.rating}</p>
                  )}
                </div>

                {selectedPresentation.comment && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">Comment</p>
                    <p className="mt-1">{selectedPresentation.comment}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPresentationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
