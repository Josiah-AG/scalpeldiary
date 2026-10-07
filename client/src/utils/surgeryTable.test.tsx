// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SurgeryGroups from '../components/SurgeryGroups';

it('keeps table rows and uses patient and procedure from the senior submission in the group header', () => {
  const html = renderToStaticMarkup(<SurgeryGroups logs={[
    { id:'1',mrn:'123',date:'2026-10-07',resident_name:'Junior Resident',resident_year:1,patient_name:'Initial Patient Name',procedure:'Initial Procedure',status:'RATED',rating:80,created_at:'2026-10-07T08:00:00Z' },
    { id:'2',mrn:'123',date:'2026-10-07',resident_name:'Senior Resident',resident_year:3,patient_name:'Correct Patient Name',procedure:'Senior Procedure',status:'PENDING',created_at:'2026-10-07T09:00:00Z' },
    { id:'3',mrn:'456',date:'2026-10-08',resident_name:'Another Resident',resident_year:2,patient_name:'Standalone Patient',procedure:'Standalone Procedure' },
  ]} onSelect={() => {}} />);
  const doc = new DOMParser().parseFromString(html,'text/html');
  expect(doc.querySelector('th[scope="rowgroup"]')?.textContent).toContain('Correct Patient Name');
  expect(doc.querySelector('th[scope="rowgroup"]')?.textContent).toContain('Senior Procedure');
  expect(doc.querySelector('th[scope="rowgroup"]')?.textContent).not.toContain('Senior Resident');
  expect(doc.querySelectorAll('tbody tr')).toHaveLength(4);
  expect(doc.querySelectorAll('button')).toHaveLength(4);
  expect(doc.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')).toBe('true');
  expect(doc.querySelectorAll('th[scope="rowgroup"]')).toHaveLength(1);
  const singleRow = doc.querySelector('tbody tr:last-child');
  expect(singleRow?.textContent).toContain('Standalone Patient');
  expect(singleRow?.textContent).toContain('MRN: 456');
  expect(singleRow?.querySelector('th')).toBeNull();
});

it('starts reviewed groups collapsed, preserving standalone entries and zero scores', () => {
  const html = renderToStaticMarkup(<SurgeryGroups logs={[
    { id:'1',mrn:'123',date:'2026-10-07',procedure:'A',status:'RATED',rating:0 },
    { id:'2',mrn:'123',date:'2026-10-07',procedure:'B',status:'NOT_WITNESSED',rating:null },
    { id:'3',mrn:'456',date:'2026-10-07',procedure:'Single',status:'PENDING' },
  ]} onSelect={() => {}} />);
  const doc = new DOMParser().parseFromString(html,'text/html');
  expect(doc.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')).toBe('false');
  expect(doc.querySelectorAll('tbody tr')).toHaveLength(2);
  expect(doc.querySelector('tbody tr:last-child')?.textContent).toContain('Single');
});
