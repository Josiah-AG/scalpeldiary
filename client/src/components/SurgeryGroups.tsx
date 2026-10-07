import { Fragment } from 'react';
import { groupSurgeries, surgeryGroupRepresentative, SurgeryIdentity } from '../utils/surgeryGroups';
import { getSupervisorRatingBadge } from '../utils/ratingUtils';

type Entry = SurgeryIdentity & {
  patient_name?: string | null; resident_name?: string; resident_year?: number; created_at?: string; procedure: string;
  surgery_role?: string; procedure_type?: string; procedure_category?: string; diagnosis?: string;
  rating?: number | string | null; status?: string;
};

export default function SurgeryGroups<T extends Entry>({ logs, onSelect, canSelect, action = 'View' }: {
  logs: T[]; onSelect: (log: T) => void; canSelect?: (log: T) => boolean; action?: string;
}) {
  const groups = groupSurgeries(logs);
  return <div className="space-y-4">
    <p className="text-sm text-gray-600">{groups.length} {groups.length === 1 ? 'surgery' : 'surgeries'} · {logs.length} resident log {logs.length === 1 ? 'entry' : 'entries'}</p>
    <div className="max-w-full bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full min-w-[850px] text-sm">
        <thead className="bg-blue-600 text-white text-left">
          <tr>{['Date', 'Resident', 'Year', 'Procedure', 'Type', 'Role', 'Rating', 'Actions'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {groups.map(group => {
            const representative = surgeryGroupRepresentative(group.logs);
            return <Fragment key={group.key}>
              {group.logs.length > 1 && <tr className="bg-blue-50">
                <th colSpan={8} scope="rowgroup" className="px-4 py-3 text-left text-blue-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">MRN: {group.mrn || 'Not recorded'} · {representative.patient_name?.trim() || 'Patient name not recorded'} · {representative.procedure}</p>
                      <p className="text-xs font-normal mt-1">{group.date || 'Date not recorded'}{representative.resident_year ? ` · Year ${representative.resident_year}` : ''}</p>
                    </div>
                    <span className="text-xs font-normal">{group.logs.length} resident log {group.logs.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                </th>
              </tr>}
              {group.logs.map(log => {
                const allowed = !canSelect || canSelect(log);
                const badge = getSupervisorRatingBadge(log.rating ?? null, log.status || 'PENDING');
                return <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{group.date}</td>
                  <td className="px-4 py-3 font-medium">{log.resident_name || 'Resident'}</td>
                  <td className="px-4 py-3">{log.resident_year || '—'}</td>
                  <td className="px-4 py-3"><p>{log.procedure}</p>{group.logs.length === 1 && <p className="text-xs text-gray-600">MRN: {group.mrn || 'Not recorded'} · {log.patient_name?.trim() || 'Patient name not recorded'}</p>}{log.procedure_category && <p className="text-xs text-gray-500">{log.procedure_category}</p>}{log.diagnosis && <p className="text-xs text-gray-500">{log.diagnosis}</p>}</td>
                  <td className="px-4 py-3">{log.procedure_type?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-4 py-3">{log.surgery_role?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${badge.className}`}>{badge.text}</span></td>
                  <td className="px-4 py-3"><button type="button" disabled={!allowed} onClick={() => onSelect(log)} className="px-3 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">{allowed ? action : 'Restricted'}</button></td>
                </tr>;
              })}
            </Fragment>;
          })}
          {groups.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-500">No surgery records found.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}
