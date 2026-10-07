import SurgeryGroups from '../../components/SurgeryGroups';
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
      <SurgeryGroups logs={procedures} onSelect={viewDetails} />

      {/* Detail Modal */}
      {showModal && selectedProcedure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
