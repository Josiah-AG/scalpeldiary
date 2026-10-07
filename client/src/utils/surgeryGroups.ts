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

export function surgeryGroupRepresentative<T extends SurgeryIdentity & { resident_year?: number; created_at?: string }>(logs: T[]): T {
  // Use training year attached to the submitted log, not a later promotion.
  // Equal years use the first submission; ID breaks equal timestamps reliably.
  return [...logs].sort((a, b) => {
    const seniority = Number(b.resident_year || 0) - Number(a.resident_year || 0);
    const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : Number.MAX_SAFE_INTEGER;
    return seniority || time(a.created_at) - time(b.created_at) || String(a.id).localeCompare(String(b.id));
  })[0];
}
