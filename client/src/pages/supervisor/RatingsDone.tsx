import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';

export default function RatingsDone() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const response = await api.get('/logs/rated');
    setLogs(response.data);
  };

  return (
    <Layout title="Ratings Done">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rated At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{log.date}</td>
                <td className="px-6 py-4 text-sm">{log.procedure}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                  {log.rating ? `${log.rating}/100` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm">{log.comment}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{log.rated_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
