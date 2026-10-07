import { groupSurgeries, SurgeryIdentity } from '../utils/surgeryGroups';
import { getSupervisorRatingBadge } from '../utils/ratingUtils';

type Entry = SurgeryIdentity & {
  resident_name?: string; resident_year?: number; procedure: string;
  surgery_role?: string; procedure_category?: string; diagnosis?: string;
  rating?: number | string | null; status?: string;
};

export default function SurgeryGroups<T extends Entry>({ logs, onSelect, canSelect, action = 'View' }: {
  logs: T[]; onSelect: (log: T) => void; canSelect?: (log: T) => boolean; action?: string;
}) {
  const groups = groupSurgeries(logs);
  return <div className="space-y-4">
    <p className="text-sm text-gray-600">{groups.length} {groups.length === 1 ? 'surgery' : 'surgeries'} · {logs.length} resident log {logs.length === 1 ? 'entry' : 'entries'}</p>
    {groups.length === 0 && <p className="p-6 text-center text-gray-500">No surgery records found.</p>}
    {groups.map(group => <section key={group.key} className="bg-white border border-blue-200 rounded-xl overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold text-blue-900 break-all">MRN: {group.mrn || 'Not recorded'} · {group.date || 'Date not recorded'}</h3>
        <span className="text-sm text-blue-800">{group.logs.length} resident log {group.logs.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {group.logs.map(log => {
          const allowed = !canSelect || canSelect(log);
          const badge = getSupervisorRatingBadge(log.rating ?? null, log.status || 'PENDING');
          return <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 break-words">
              <p className="font-semibold text-gray-900">{log.resident_name || 'Resident'}{log.resident_year ? ` · Year ${log.resident_year}` : ''}</p>
              <p className="text-gray-800">{log.procedure}</p>
              <p className="text-sm text-gray-600">{log.surgery_role?.replace(/_/g, ' ')}{log.procedure_category ? ` · ${log.procedure_category}` : ''}</p>
              {log.diagnosis && <p className="text-sm text-gray-600">{log.diagnosis}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>{badge.text}</span>
            <button type="button" disabled={!allowed} onClick={() => onSelect(log)} className="px-3 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">{allowed ? action : 'Restricted'}</button>
          </div>;
        })}
      </div>
    </section>)}
  </div>;
}
