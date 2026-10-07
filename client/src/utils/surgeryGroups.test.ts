import { describe, expect, it } from 'vitest';
import { groupSurgeries } from './surgeryGroups';

describe('supervised surgery grouping', () => {
  it('groups several residents and different procedure names by MRN and date, retaining every log', () => {
    const logs = [
      { id: '1', mrn: '00123', date: '2026-10-07', procedure: 'A' },
      { id: '2', mrn: '00123 ', date: '2026-10-07T00:00:00.000Z', procedure: 'B' },
      { id: '3', mrn: '00123', date: '2026-10-07', procedure: 'A' },
      { id: '4', mrn: '00123', date: '2026-10-08', procedure: 'A' },
      { id: '5', mrn: '123', date: '2026-10-07', procedure: 'A' },
    ];
    const groups = groupSurgeries(logs);
    expect(groups).toHaveLength(3);
    expect(groups[0].logs.map(log => log.id)).toEqual(['1', '2', '3']);
    expect(groups.flatMap(group => group.logs)).toHaveLength(5);
  });
  it('does not group incomplete historical identifiers', () => {
    expect(groupSurgeries([
      { id: '1', mrn: '', date: '2026-10-07' },
      { id: '2', mrn: null, date: '2026-10-07' },
      { id: '3', mrn: '123', date: '' },
      { id: '4', mrn: '123', date: '' },
    ])).toHaveLength(4);
  });
});
