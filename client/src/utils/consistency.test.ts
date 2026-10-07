// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getRatingLabel, getResidentRatingBadge, getSupervisorRatingBadge, canSeeExactScores } from './ratingUtils';
import { summarizeReport } from './reportSummary';
import { setModalContent } from './safeModal';
describe('rating contracts', () => {
 it('preserves zero and shared band boundaries', () => {
  expect(getResidentRatingBadge(0,'RATED').text).toBe('Poor');
  expect(getSupervisorRatingBadge(0,'RATED').text).toBe('0/100');
  expect(getRatingLabel(50)).toBe('Satisfactory');
  expect(getRatingLabel('Good')).toBe('Good');
  expect(getResidentRatingBadge(null,'NOT_WITNESSED').text).toBe('N/A');
 });
 it('a client-side read-only flag does not confer score access', () => expect(canSeeExactScores('RESIDENT',true)).toBe(false));
});
describe('report scope', () => {
 it('totals and distributions use only supplied filtered rows', () => {
  const result=summarizeReport([{procedure:'A',status:'RATED',surgery_role:'PRIMARY_SURGEON'},{procedure:'B',status:'NOT_WITNESSED',surgery_role:'OBSERVER'}],[]);
  expect(result.totalSurgeries).toBe(2);expect(result.verifiedSurgeries).toBe(1);expect(result.roleDistribution.OBSERVER).toBe(1);expect(result.topProcedures).toHaveLength(2);
 });
});
describe('detail dialogs', () => {
 it('removes scripts, handlers and external requests while retaining content and close behavior', () => {
  const modal=document.createElement('div');document.body.append(modal);
  setModalContent(modal, '<h3>Details</h3><button onclick="alert(1)">×</button><p>Diagnosis <img src="https://example.invalid/track" onerror="alert(1)"></p><script>alert(1)</script>');
  expect(modal.querySelector('img,script,[onclick],[onerror]')).toBeNull();expect(modal.textContent).toContain('Diagnosis');expect(modal.getAttribute('role')).toBe('dialog');
  modal.querySelector('button')!.click();expect(modal.isConnected).toBe(false);
 });
});
