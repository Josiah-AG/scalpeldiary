export interface SurgeryIdentity { id: string | number; mrn?: string | null; date: string; }

// Missing identifiers must never merge unrelated records. Dates are calendar dates,
// not timestamps converted to the viewer's timezone. MRNs preserve leading zeros.
export function groupSurgeries<T extends SurgeryIdentity>(logs: T[]) {
  const groups = new Map<string, { key: string; mrn: string; date: string; logs: T[] }>();
  for (const log of logs) {
    const mrn = log.mrn?.trim() || '';
    const date = log.date?.slice(0, 10) || '';
    const key = mrn && date ? JSON.stringify([mrn, date]) : JSON.stringify(['log', log.id]);
    if (!groups.has(key)) groups.set(key, { key, mrn, date, logs: [] });
    groups.get(key)!.logs.push(log);
  }
  return [...groups.values()];
}
