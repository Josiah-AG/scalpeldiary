import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Eye } from 'lucide-react';

interface Procedure {
  id: number;
  date: string;
  procedure: string;
  procedure_type: string;
  surgery_role: string;
  rating: number;
  comment: string;
  resident_name: string;
  resident_year: number;
  mrn: string;
  age: number;
  sex: string;
  diagnosis: string;
  place_of_practice: string;
}

export default function AllRatedProcedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRatedProcedures();
  }, []);

  const fetchRatedProcedures = async () => {
    try {
      const response = await api.get('/logs/rated');
      setProcedures(response.data);
    } catch (error) {
      console.error('Failed to fetch rated procedures');
    }
  };

  const viewDetails = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setShowModal(true);
  };

  return (
    <Layout title="All Rated Procedures">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                      {proc.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => viewDetails(proc)}
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
      </div>

      {/* Detail Modal */}
      {showModal && selectedProcedure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Procedure Details</h3>
                <button
                  onClick={() => setShowModal(false)}
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
                  <p className="text-2xl font-bold text-green-600">{selectedProcedure.rating}</p>
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
