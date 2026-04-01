import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { AlertTriangle, Monitor, Users, UserCheck, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityMonitor() {
  const [tab, setTab] = useState<'devices' | 'suspicious' | 'residents' | 'supervisors'>('residents');
  const [sessions, setSessions] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, sus, r, sup] = await Promise.all([
        api.get('/activity-monitor/device-sessions').catch(() => ({ data: [] })),
        api.get('/activity-monitor/suspicious').catch(() => ({ data: [] })),
        api.get('/activity-monitor/resident-activity').catch(() => ({ data: [] })),
        api.get('/activity-monitor/supervisor-responsiveness').catch(() => ({ data: [] })),
      ]);
      setSessions(s.data); setSuspicious(sus.data); setResidents(r.data); setSupervisors(sup.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'MMM dd, HH:mm') : 'Never';
  const shortDevice = (d: string) => {
    if (!d || d === 'unknown') return 'Unknown';
    if (d.includes('iPhone')) return 'iPhone Safari';
    if (d.includes('Android')) return 'Android Chrome';
    if (d.includes('Windows')) return 'Windows PC';
    if (d.includes('Mac')) return 'Mac Safari';
    return d.substring(0, 40) + '...';
  };

  const tabs = [
    { id: 'residents' as const, label: 'Residents', icon: Users, count: residents.length },
    { id: 'supervisors' as const, label: 'Supervisors', icon: UserCheck, count: supervisors.length },
    { id: 'devices' as const, label: 'Login Sessions', icon: Monitor, count: sessions.length },
    { id: 'suspicious' as const, label: 'Alerts', icon: AlertTriangle, count: suspicious.length },
  ];

  return (
    <Layout title="Activity Monitor">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}>
            <t.icon size={16} />
            <span>{t.label}</span>
            {t.id === 'suspicious' && t.count > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {/* Resident Activity Tab */}
      {!loading && tab === 'residents' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Procs (Month)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Pres (Month)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {residents.map((r: any) => {
                  const inactive = !r.last_login;
                  const lowActivity = parseInt(r.procedures_this_month || 0) === 0 && parseInt(r.presentations_this_month || 0) === 0;
                  return (
                    <tr key={r.id} className={inactive ? 'bg-red-50' : lowActivity ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-sm">Year {r.current_year || '?'}</td>
                      <td className="px-4 py-3 text-sm">
                        {inactive ? <span className="text-red-600 font-semibold">Never logged in</span> : fmtDate(r.last_login)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{r.procedures_this_month || 0}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{r.presentations_this_month || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supervisor Responsiveness Tab */}
      {!loading && tab === 'supervisors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Pending Procs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Pending Pres</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Rated (Month)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supervisors.map((s: any) => {
                  const pending = parseInt(s.pending_procedures || 0) + parseInt(s.pending_presentations || 0);
                  const inactive = !s.last_login;
                  return (
                    <tr key={s.id} className={pending > 5 ? 'bg-red-50' : pending > 2 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {inactive ? <span className="text-red-600 font-semibold">Never</span> : fmtDate(s.last_login)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${parseInt(s.pending_procedures || 0) > 3 ? 'text-red-600' : ''}`}>
                          {s.pending_procedures || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${parseInt(s.pending_presentations || 0) > 2 ? 'text-red-600' : ''}`}>
                          {s.pending_presentations || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {parseInt(s.rated_this_month || 0) + parseInt(s.presentations_rated_this_month || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device Sessions Tab */}
      {!loading && tab === 'devices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                        s.role === 'RESIDENT' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>{s.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{shortDevice(s.device_info)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-sm">{fmtDate(s.login_time)}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No login sessions recorded yet. Sessions will appear after the migration is run and users log in.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspicious Devices Tab */}
      {!loading && tab === 'suspicious' && (
        <div>
          {suspicious.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Activity className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No suspicious activity detected</p>
              <p className="text-sm text-gray-400 mt-1">Cross-account device usage will appear here when detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suspicious.map((s: any, i: number) => (
                <div key={i} className="bg-white rounded-lg shadow border-l-4 border-red-500 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700">Shared Device Detected</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Device: {shortDevice(s.device_info)}</p>
                  <div className="space-y-1">
                    {(s.users || []).map((u: any, j: number) => (
                      <div key={j} className="flex items-center space-x-2 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                          u.role === 'RESIDENT' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>{u.role}</span>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-gray-400">({u.email})</span>
                        <span className="text-gray-400 text-xs">{fmtDate(u.login_time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
