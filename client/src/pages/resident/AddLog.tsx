import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { getAllCategories, getAllProceduresForCategory } from '@shared/procedureUtils';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ProcedureEntry {
  id: string;
  procedure: string;
  procedureCategory: string;
  surgeryRole: string;
  remark: string;
}

export default function AddLog() {
  const [years, setYears] = useState<any[]>([]);
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [detachmentSupervisors, setDetachmentSupervisors] = useState<any[]>([]);
  const [detachmentExternalLabel, setDetachmentExternalLabel] = useState('');
  const [isDetachment, setIsDetachment] = useState(false);
  const [useExternalSupervisor, setUseExternalSupervisor] = useState(false);
  const [externalSupervisorName, setExternalSupervisorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Patient data (shared across all procedures)
  const [patientData, setPatientData] = useState({
    yearId: '',
    date: new Date().toISOString().split('T')[0],
    mrn: '',
    age: '',
    sex: 'MALE',
    diagnosis: '',
    procedureType: 'ELECTIVE',
    placeOfPractice: 'Y12HMC',
  });

  // Shared supervisor for all procedures
  const [supervisorId, setSupervisorId] = useState('');

  // Multiple procedures for the same patient
  const [procedures, setProcedures] = useState<ProcedureEntry[]>([
    {
      id: Date.now().toString(),
      procedure: '',
      procedureCategory: 'GI Surgery', // Use actual JSON key
      surgeryRole: 'PRIMARY_SURGEON',
      remark: '',
    },
  ]);

  useEffect(() => {
    fetchYears();
    fetchSuggestions();
    // Load categories from JSON
    setCategories(getAllCategories());
  }, []);

  // Fetch supervisors when procedures change (to check if any is Minor Surgery)
  useEffect(() => {
    fetchSupervisors();
  }, [procedures]);

  // Detect detachment and fetch appropriate supervisors
  useEffect(() => {
    const venue = patientData.placeOfPractice;
    const hasOrtho = procedures.some(p => p.procedureCategory === 'Orthopedic Surgery');
    const hasPlastic = procedures.some(p => p.procedureCategory === 'Plastic Surgery');
    
    if (venue !== 'Y12HMC' || hasOrtho || hasPlastic) {
      setIsDetachment(true);
      fetchDetachmentSupervisors(venue, hasOrtho || hasPlastic);
    } else {
      setIsDetachment(false);
      setDetachmentSupervisors([]);
      setDetachmentExternalLabel('');
      setUseExternalSupervisor(false);
      setExternalSupervisorName('');
    }
  }, [patientData.placeOfPractice, procedures]);

  const fetchDetachmentSupervisors = async (venue: string, hasOrtho: boolean) => {
    try {
      const params: any = {};
      if (hasOrtho || hasPlastic) {
        params.category = hasOrtho ? 'Orthopedic Surgery' : 'Plastic Surgery';
      } else {
        params.venue = venue;
      }
      const response = await api.get('/users/detachment-supervisors', { params });
      setDetachmentSupervisors(response.data.residents || []);
      setDetachmentExternalLabel(response.data.externalLabel || 'External Supervisor');
      
      // For venues with no resident options (TASH, Abebech Gobena), auto-select external
      if ((response.data.residents || []).length === 0) {
        setUseExternalSupervisor(true);
        setSupervisorId('');
      } else {
        setUseExternalSupervisor(false);
      }
    } catch (error) {
      console.error('Failed to fetch detachment supervisors:', error);
      setDetachmentSupervisors([]);
      setUseExternalSupervisor(true);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/users/supervisors');
      setSupervisors(response.data);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      setSupervisors([]);
    }
  };

  const fetchYears = async () => {
    const response = await api.get('/users/resident-years/me');
    setYears(response.data);
    // Always set to current (latest) year and lock it
    if (response.data.length > 0) {
      const currentYear = response.data[response.data.length - 1];
      setPatientData((prev) => ({ ...prev, yearId: currentYear.id }));
    }
  };

  const fetchSuggestions = async () => {
    const diagnosisRes = await api.get('/logs/suggestions?field=diagnosis');
    setDiagnosisSuggestions(diagnosisRes.data);
  };

  const addProcedure = () => {
    setProcedures([
      ...procedures,
      {
        id: Date.now().toString(),
        procedure: '',
        procedureCategory: 'GI Surgery', // Use actual JSON key
        surgeryRole: 'PRIMARY_SURGEON',
        remark: '',
      },
    ]);
  };

  const removeProcedure = (id: string) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter((p) => p.id !== id));
    }
  };

  const updateProcedure = (id: string, field: string, value: string) => {
    setProcedures((prevProcedures) =>
      prevProcedures.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Submit each procedure as a separate log with shared supervisor
      await Promise.all(
        procedures.map((proc) => {
          const detachmentType = proc.procedureCategory === 'Orthopedic Surgery' ? 'ORTHOPEDICS'
            : proc.procedureCategory === 'Plastic Surgery' ? 'PLASTIC_SURGERY'
            : patientData.placeOfPractice !== 'Y12HMC' ? patientData.placeOfPractice
            : null;
          
          return api.post('/logs', {
            ...patientData,
            procedure: proc.procedure,
            procedureCategory: proc.procedureCategory,
            surgeryRole: proc.surgeryRole,
            supervisorId: useExternalSupervisor ? null : supervisorId,
            remark: proc.remark,
            isDetachment: isDetachment,
            detachmentType: isDetachment ? detachmentType : null,
            externalSupervisorName: useExternalSupervisor ? externalSupervisorName : null,
          });
        })
      );
      
      setSuccess(true);
      // Reset form
      setPatientData({
        ...patientData,
        mrn: '',
        age: '',
        diagnosis: '',
      });
      setSupervisorId('');
      setUseExternalSupervisor(false);
      setExternalSupervisorName('');
      setProcedures([
        {
          id: Date.now().toString(),
          procedure: '',
          procedureCategory: 'GI Surgery', // Use actual JSON key
          surgeryRole: 'PRIMARY_SURGEON',
          remark: '',
        },
      ]);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Failed to create log(s)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Add Surgical Log">
      <div className="max-w-4xl bg-white p-8 rounded-lg shadow">
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">{procedures.length} procedure log(s) created successfully!</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {years.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-4">
              <p className="text-blue-800 font-semibold">
                Logging for: Year {years[years.length - 1]?.year} (Current Year)
              </p>
              <p className="text-blue-700 text-sm mt-1">
                You can only add procedures for your current year. Previous years are view-only.
              </p>
            </div>
          )}

          {/* Patient Information Section */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={patientData.date}
                  onChange={(e) => setPatientData({ ...patientData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MRN</label>
                <input
                  type="text"
                  value={patientData.mrn}
                  onChange={(e) => setPatientData({ ...patientData, mrn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={patientData.age}
                  onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                <select
                  value={patientData.sex}
                  onChange={(e) => setPatientData({ ...patientData, sex: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <input
                  type="text"
                  value={patientData.diagnosis}
                  onChange={(e) => setPatientData({ ...patientData, diagnosis: e.target.value })}
                  list="diagnosis-suggestions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full diagnosis of the patient"
                  required
                />
                <datalist id="diagnosis-suggestions">
                  {diagnosisSuggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion} />
                  ))}
                </datalist>
                <p className="text-xs text-blue-600 mt-1 flex items-start">
                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  Write full diagnosis of the patient
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedure Type
                </label>
                <select
                  value={patientData.procedureType}
                  onChange={(e) => setPatientData({ ...patientData, procedureType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ELECTIVE">Elective</option>
                  <option value="SEMI_ELECTIVE">Semi-Elective</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <select
                  value={patientData.placeOfPractice}
                  onChange={(e) => setPatientData({ ...patientData, placeOfPractice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Y12HMC">Y12HMC</option>
                  <option value="ALERT">ALERT</option>
                  <option value="TASH">TASH</option>
                  <option value="ABEBECH_GOBENA">Abebech Gobena</option>
                </select>
              </div>
            </div>
          </div>

          {/* Procedures Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {procedures.length > 1 ? 'Procedures' : 'Procedure'}
              </h3>
              <button
                type="button"
                onClick={addProcedure}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                <span>Add Another Procedure</span>
              </button>
            </div>

            {procedures.map((proc, index) => (
              <ProcedureForm
                key={`${proc.id}-${proc.procedureCategory}`}
                procedure={proc}
                index={index}
                totalProcedures={procedures.length}
                categories={categories}
                updateProcedure={updateProcedure}
                removeProcedure={removeProcedure}
                canRemove={procedures.length > 1}
              />
            ))}
          </div>

          {/* Shared Supervisor Section */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Supervisor
              {isDetachment && (
                <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Detachment</span>
              )}
            </h3>

            {!isDetachment ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((supervisor: any) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                      {supervisor.institution ? ` (${supervisor.institution})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : detachmentSupervisors.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                <select
                  value={useExternalSupervisor ? '__EXTERNAL__' : supervisorId}
                  onChange={(e) => {
                    if (e.target.value === '__EXTERNAL__') {
                      setUseExternalSupervisor(true);
                      setSupervisorId('');
                    } else {
                      setUseExternalSupervisor(false);
                      setSupervisorId(e.target.value);
                      setExternalSupervisorName('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Supervisor</option>
                  {detachmentSupervisors.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Year {r.year})
                    </option>
                  ))}
                  <option value="__EXTERNAL__" style={{ fontWeight: 'bold' }}>
                    ── {detachmentExternalLabel} ──
                  </option>
                </select>
                {useExternalSupervisor && (
                  <input
                    type="text"
                    value={externalSupervisorName}
                    onChange={(e) => setExternalSupervisorName(e.target.value)}
                    placeholder={`Enter ${detachmentExternalLabel.toLowerCase()} name`}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                    required
                  />
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{detachmentExternalLabel}</label>
                <input
                  type="text"
                  value={externalSupervisorName}
                  onChange={(e) => setExternalSupervisorName(e.target.value)}
                  placeholder={`Enter ${detachmentExternalLabel.toLowerCase()} name`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-xs text-amber-600 mt-1">
                  This is a detachment log. Enter the name of the supervising doctor at the external site.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-semibold text-lg transition-colors"
          >
            {loading ? 'Creating...' : `Create ${procedures.length} Log${procedures.length > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </Layout>
  );
}

// Separate component for each procedure form
function ProcedureForm({
  procedure,
  index,
  totalProcedures,
  categories,
  updateProcedure,
  removeProcedure,
  canRemove,
}: {
  procedure: ProcedureEntry;
  index: number;
  totalProcedures: number;
  categories: string[];
  updateProcedure: (id: string, field: string, value: string) => void;
  removeProcedure: (id: string) => void;
  canRemove: boolean;
}) {
  const [proceduresForCategory, setProceduresForCategory] = useState<string[]>([]);

  useEffect(() => {
    if (procedure.procedureCategory) {
      setProceduresForCategory(getAllProceduresForCategory(procedure.procedureCategory));
    }
  }, [procedure.procedureCategory]);

  return (
    <div className="border-2 border-gray-300 rounded-lg p-6 bg-white relative">
      {canRemove && (
        <button
          type="button"
          onClick={() => removeProcedure(procedure.id)}
          className="absolute top-4 right-4 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
          title="Remove this procedure"
        >
          <Trash2 size={20} />
        </button>
      )}

      <h4 className="font-semibold text-gray-900 mb-4">
        {totalProcedures > 1 ? `Procedure #${index + 1}` : 'Procedure'}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Procedure Category
          </label>
          <select
            value={procedure.procedureCategory}
            onChange={(e) => {
              const newCategory = e.target.value;
              updateProcedure(procedure.id, 'procedureCategory', newCategory);
              updateProcedure(procedure.id, 'procedure', '');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={procedure.surgeryRole}
            onChange={(e) => updateProcedure(procedure.id, 'surgeryRole', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="PRIMARY_SURGEON">Primary Surgeon</option>
            <option value="PRIMARY_SURGEON_ASSISTED">Primary Surgeon (Assisted)</option>
            <option value="FIRST_ASSISTANT">1st Assistant</option>
            <option value="SECOND_ASSISTANT">2nd Assistant</option>
            <option value="OBSERVER">Observer</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
          <select
            value={procedure.procedure}
            onChange={(e) => updateProcedure(procedure.id, 'procedure', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Procedure</option>
            {proceduresForCategory.map((proc, idx) => (
              <option key={idx} value={proc}>
                {proc}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1 flex items-start">
            <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
            Choose the most close procedure done for the patient. If procedure is not found, choose "Other {procedure.procedureCategory} Procedure" and add the correct procedure in remark.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remark (Optional)
          </label>
          <textarea
            value={procedure.remark}
            onChange={(e) => updateProcedure(procedure.id, 'remark', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Additional notes or remarks about this procedure..."
          />
        </div>
      </div>
    </div>
  );
}
