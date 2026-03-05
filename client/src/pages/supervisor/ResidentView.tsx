import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { Calendar, TrendingUp, Award, FileText } from 'lucide-react';
import YearProgressBar from '../../components/YearProgressBar';
import ProgressDetailModal from '../../components/ProgressDetailModal';

export default function ResidentView() {
  const { residentId } = useParams();
  const [resident, setResident] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [analytics, setAnalytics] = useState<any>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [yearProgress, setYearProgress] = useState<any>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    fetchResidentData();
  }, [residentId, selectedYear]);

  const fetchResidentData = async () => {
    try {
      // Get year ID for the selected year
      const yearsRes = await api.get(`/users/resident-years/${residentId}`);
      const yearData = yearsRes.data.find((y: any) => y.year === selectedYear);
      
      console.log('Supervisor ResidentView - Years:', yearsRes.data);
      console.log('Supervisor ResidentView - Selected year data:', yearData);
      
      const [residentRes, analyticsRes, proceduresRes, presentationsRes, progressRes] = await Promise.all([
        api.get(`/users/${residentId}`),
        api.get(`/analytics/supervisor/resident/${residentId}?year=${selectedYear}`),
        api.get(`/logs/resident/${residentId}?year=${selectedYear}`),
        api.get(`/presentations/resident/${residentId}?year=${selectedYear}`),
        yearData ? api.get(`/progress/year/${yearData.id}?residentId=${residentId}`) : Promise.resolve({ data: null })
      ]);

      console.log('Supervisor ResidentView - Progress data:', progressRes.data);

      setResident(residentRes.data);
      setAnalytics(analyticsRes.data);
      setProcedures(proceduresRes.data);
      setPresentations(presentationsRes.data);
      setYearProgress(progressRes.data);
    } catch (error) {
      console.error('Failed to fetch resident data:', error);
    }
  };

  if (!resident) {
    return <Layout title="Loading..."><div>Loading...</div></Layout>;
  }

  return (
    <Layout title={`${resident.name} - Read Only View`}>
      {/* Header with Profile */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {resident.profilePicture ? (
              <img 
                src={resident.profilePicture} 
                alt={resident.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-gray-500">
                {resident.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{resident.name}</h2>
            <p className="text-gray-600">{resident.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Read Only Mode
            </span>
          </div>
        </div>

        {/* Year Selector */}
        <div className="mt-6 flex space-x-2">
          {[1, 2, 3, 4].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg ${
                selectedYear === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year {year}
            </button>
          ))}
        </div>
      </div>

      {/* Year Progress Bar */}
      {yearProgress && (
        <div className="mb-6">
          <YearProgressBar 
            progress={yearProgress} 
            onClick={() => setShowProgressModal(true)}
          />
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Procedures</p>
              <p className="text-3xl font-bold text-blue-600">{analytics?.totalProcedures || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Procedure Rating</p>
              <p className="text-3xl font-bold text-green-600">
                {analytics?.avgProcedureRating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <Award className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Presentations</p>
              <p className="text-3xl font-bold text-purple-600">{analytics?.totalPresentations || 0}</p>
            </div>
            <FileText className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Presentation Rating</p>
              <p className="text-3xl font-bold text-orange-600">
                {analytics?.avgPresentationRating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>

        {/* Rated Logs - for Year 2+ residents who can act as supervisors */}
        {selectedYear >= 2 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Rated Logs</p>
                <p className="text-3xl font-bold text-indigo-600">{analytics?.ratedLogs || 0}</p>
              </div>
              <Award className="w-10 h-10 text-indigo-600 opacity-20" />
            </div>
          </div>
        )}
      </div>

      {/* Procedures Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Surgical Procedures</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Procedure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {procedures.map((proc) => (
                <tr key={proc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(proc.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{proc.procedure}</td>
                  <td className="px-4 py-3 text-sm">{proc.procedure_type}</td>
                  <td className="px-4 py-3 text-sm">{proc.surgery_role}</td>
                  <td className="px-4 py-3 text-sm">
                    {proc.rating ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {proc.rating}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not rated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Presentations Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Presentations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Venue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {presentations.map((pres) => (
                <tr key={pres.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(pres.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{pres.title}</td>
                  <td className="px-4 py-3 text-sm">{pres.presentation_type}</td>
                  <td className="px-4 py-3 text-sm">{pres.venue}</td>
                  <td className="px-4 py-3 text-sm">
                    {pres.rating ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {pres.rating}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not rated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Detail Modal */}
      {showProgressModal && yearProgress && (
        <ProgressDetailModal
          progress={yearProgress}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </Layout>
  );
}
