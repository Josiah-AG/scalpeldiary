import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Eye } from 'lucide-react';

interface Presentation {
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
}

export default function AllRatedPresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRatedPresentations();
  }, []);

  const fetchRatedPresentations = async () => {
    try {
      const response = await api.get('/presentations/rated');
      setPresentations(response.data);
    } catch (error) {
      console.error('Failed to fetch rated presentations');
    }
  };

  const viewDetails = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setShowModal(true);
  };

  return (
    <Layout title="All Rated Presentations">
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
                      <span className={`px-2 py-1 rounded font-semibold ${
                        pres.rating && pres.rating > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pres.rating}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => viewDetails(pres)}
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
              onClick={() => viewDetails(pres)}
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
                  <span className={`px-2 py-1 rounded text-sm font-semibold ml-2 ${
                    pres.rating && pres.rating > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
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
      </div>

      {/* Detail Modal */}
      {showModal && selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Presentation Details</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                  onClick={() => setShowModal(false)}
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
