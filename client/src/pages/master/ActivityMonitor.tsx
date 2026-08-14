import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { AlertTriangle, Monitor, Users, UserCheck, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

type SortDir = 'asc' | 'desc';

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="px-3 py-3 text-left text-xs font-semibold uppercase cursor-pointer select-none hover:bg-white/10" onClick={onClick}>
      <span className="flex items-center gap-1">
        {label}
        {active && (dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  );
}

function sortRows(rows: any[], key: string, dir: SortDir) {
  return [...rows].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va == null) va = '';
    if (vb == null) vb = '';
    const numA = typeof va === 'string' ? parseInt(va) : va;
    const numB = typeof vb === 'string' ? parseInt(vb) : vb;
    if (!isNaN(numA) && !isNaN(numB)) return dir === 'asc' ? numA - numB : numB - numA;
    const sA = String(va), sB = String(vb);
    return dir === 'asc' ? sA.localeCompare(sB) : sB.localeCompare(sA);
  });
}

export default function ActivityMonitor() {
  const [tab, setTab] = useState<'devices' | 'suspicious' | 'residents' | 'supervisors'>('residents');
  const [sessions, setSessions] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedSup, setExpandedSup] = useState<string | null>(null);
  const [pendingDetails, setPendingDetails] = useState<any>(null);

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

  const fmtDate = (d: string | null) => {
    if (!d) return 'Never';
    try { return format(new Date(d), 'MMM dd, HH:mm'); } catch { return 'Never'; }
  };
  const shortDevice = (d: string) => {
    if (!d || d === 'unknown') return 'Unknown';
    if (d.includes('iPhone')) return 'iPhone Safari';
    if (d.includes('Android')) return 'Android Chrome';
    if (d.includes('Windows')) return 'Windows PC';
    if (d.includes('Mac')) return 'Mac Safari';
    return d.substring(0, 40) + '...';
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const togglePendingDetails = async (supId: string) => {
    if (expandedSup === supId) { setExpandedSup(null); setPendingDetails(null); return; }
    setExpandedSup(supId);
    try {
      const res = await api.get(`/activity-monitor/supervisor-pending-details/${supId}`);
      setPendingDetails(res.data);
    } catch { setPendingDetails({ procedures: [], presentations: [] }); }
  };

  const tabs = [
    { id: 'residents' as const, label: 'Residents', icon: Users },
    { id: 'supervisors' as const, label: 'Supervisors', icon: UserCheck },
    { id: 'devices' as const, label: 'Login Sessions', icon: Monitor },
    { id: 'suspicious' as const, label: 'Alerts', icon: AlertTriangle, count: suspicious.length },
  ];

  const sortedResidents = sortRows(residents, sortKey, sortDir);
  const sortedSupervisors = sortRows(supervisors, sortKey, sortDir);

  return (
    <Layout title="Activity Monitor">
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSortKey('name'); setSortDir('asc'); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}>
            <t.icon size={16} />
            <span>{t.label}</span>
            {t.id === 'suspicious' && (t.count || 0) > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}

      {/* RESIDENTS TAB */}
      {!loading && tab === 'residents' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <SortHeader label="Name" active={sortKey==='name'} dir={sortDir} onClick={() => toggleSort('name')} />
                  <SortHeader label="Year" active={sortKey==='current_year'} dir={sortDir} onClick={() => toggleSort('current_year')} />
                  <SortHeader label="Last Seen" active={sortKey==='last_seen'} dir={sortDir} onClick={() => toggleSort('last_seen')} />
                  <SortHeader label="Last Action" active={sortKey==='last_action'} dir={sortDir} onClick={() => toggleSort('last_action')} />
                  <SortHeader label="Procs" active={sortKey==='procedures_total'} dir={sortDir} onClick={() => toggleSort('procedures_total')} />
                  <SortHeader label="Pres" active={sortKey==='presentations_total'} dir={sortDir} onClick={() => toggleSort('presentations_total')} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResidents.map((r: any) => {
                  const noSeen = !r.last_seen;
                  const noAction = !r.last_action;
                  return (
                    <tr key={r.id} className={noSeen && noAction ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-3 text-sm font-medium">
                        {r.name}
                        <span className="ml-1 text-xs" title={r.is_pwa ? 'Installed App (PWA)' : 'Using Web Browser'}>
                          {r.is_pwa ? '📱' : '🌐'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm">Y{r.current_year || '?'}</td>
                      <td className="px-3 py-3 text-sm">{noSeen ? <span className="text-red-500 text-xs">Never</span> : fmtDate(r.last_seen)}</td>
                      <td className="px-3 py-3 text-sm">{noAction ? <span className="text-gray-400 text-xs">None</span> : fmtDate(r.last_action)}</td>
                      <td className="px-3 py-3 text-sm font-semibold">{r.procedures_total || 0}</td>
                      <td className="px-3 py-3 text-sm font-semibold">{r.presentations_total || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPERVISORS TAB */}
      {!loading && tab === 'supervisors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <tr>
                  <SortHeader label="Name" active={sortKey==='name'} dir={sortDir} onClick={() => toggleSort('name')} />
                  <SortHeader label="Last Seen" active={sortKey==='last_seen'} dir={sortDir} onClick={() => toggleSort('last_seen')} />
                  <SortHeader label="Last Action" active={sortKey==='last_action'} dir={sortDir} onClick={() => toggleSort('last_action')} />
                  <SortHeader label="Pend Procs" active={sortKey==='pending_procedures'} dir={sortDir} onClick={() => toggleSort('pending_procedures')} />
                  <SortHeader label="Pend Pres" active={sortKey==='pending_presentations'} dir={sortDir} onClick={() => toggleSort('pending_presentations')} />
                  <SortHeader label="Rated" active={sortKey==='rated_procedures_total'} dir={sortDir} onClick={() => toggleSort('rated_procedures_total')} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedSupervisors.map((s: any) => {
                  const pending = parseInt(s.pending_procedures || 0) + parseInt(s.pending_presentations || 0);
                  const isExpanded = expandedSup === s.id;
                  return (<>
                    <tr key={s.id} className={pending > 5 ? 'bg-red-50' : pending > 2 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-3 text-sm font-medium">
                        {s.name}
                        <span className="ml-1 text-xs" title={s.is_pwa ? 'Installed App (PWA)' : 'Using Web Browser'}>
                          {s.is_pwa ? '📱' : '🌐'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm">{!s.last_seen ? <span className="text-red-500 text-xs">Never</span> : fmtDate(s.last_seen)}</td>
                      <td className="px-3 py-3 text-sm">{!s.last_action ? <span className="text-gray-400 text-xs">None</span> : fmtDate(s.last_action)}</td>
                      <td className="px-3 py-3 text-sm">
                        <button onClick={() => parseInt(s.pending_procedures||0) > 0 && togglePendingDetails(s.id)}
                          className={`font-semibold ${parseInt(s.pending_procedures||0) > 0 ? 'text-red-600 underline cursor-pointer' : ''}`}>
                          {s.pending_procedures || 0}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <button onClick={() => parseInt(s.pending_presentations||0) > 0 && togglePendingDetails(s.id)}
                          className={`font-semibold ${parseInt(s.pending_presentations||0) > 0 ? 'text-red-600 underline cursor-pointer' : ''}`}>
                          {s.pending_presentations || 0}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold">
                        {parseInt(s.rated_procedures_total || 0) + parseInt(s.rated_presentations_total || 0)}
                      </td>
                    </tr>
                    {isExpanded && pendingDetails && (
                      <tr key={s.id + '-details'}>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
                          {pendingDetails.procedures.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Pending Procedures:</p>
                              {pendingDetails.procedures.map((p: any) => (
                                <div key={p.id} className="text-xs text-gray-700 ml-2">• {p.resident_name} — {p.name} ({fmtDate(p.created_at)})</div>
                              ))}
                            </div>
                          )}
                          {pendingDetails.presentations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">Pending Presentations:</p>
                              {pendingDetails.presentations.map((p: any) => (
                                <div key={p.id} className="text-xs text-gray-700 ml-2">• {p.resident_name} — {p.name} ({fmtDate(p.created_at)})</div>
                              ))}
                            </div>
                          )}
                          {pendingDetails.procedures.length === 0 && pendingDetails.presentations.length === 0 && (
                            <p className="text-xs text-gray-400">No pending items found</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEVICE SESSIONS TAB */}
      {!loading && tab === 'devices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold">User</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold">Mode</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold">Device</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold">IP</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        s.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                        s.role === 'RESIDENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>{s.role}</span>
                    </td>
                    <td className="px-3 py-3 text-sm">{s.is_pwa ? '📱 App' : '🌐 Web'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{shortDevice(s.device_info)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{s.ip_address || '-'}</td>
                    <td className="px-3 py-3 text-sm">{fmtDate(s.login_time)}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No login sessions recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUSPICIOUS TAB */}
      {!loading && tab === 'suspicious' && (
        <div>
          {suspicious.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Activity className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No suspicious activity detected</p>
              <p className="text-sm text-gray-400 mt-1">Cross-account device usage will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suspicious.map((s: any, i: number) => (
                <div key={i} className="bg-white rounded-lg shadow border-l-4 border-red-500 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-700">Shared Device Detected</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Dismiss this alert? It won\'t appear again for this device.')) {
                          await api.post('/activity-monitor/dismiss-alert', { deviceFingerprint: s.device_fingerprint }).catch(() => {});
                          setSuspicious(prev => prev.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Device: {shortDevice(s.device_info)}</p>
                  <div className="space-y-1">
                    {(s.users || []).map((u: any, j: number) => (
                      <div key={j} className="flex items-center space-x-2 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'SUPERVISOR' ? 'bg-green-100 text-green-800' :
                          u.role === 'RESIDENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>{u.role}</span>
                        <span className="font-medium">{u.name}</span>
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
